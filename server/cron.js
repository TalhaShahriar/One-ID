import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Starts background cron tasks for the OneID Bangladesh security protocols.
 * @param {import('socket.io').Server} io - Socket.io live connection hub
 */
export function startScheduler(io) {
  console.log('⏰ Initializing OneID Security and Status Scheduler...');

  // 1. Every minute, inspect pending and running elections to transition statuses
  cron.schedule('* * * * *', async () => {
    try {
      console.log('⏳ Scheduler checking election start/end alignments...');
      const now = new Date();

      // Transition Scheduled -> Active
      const scheduledElections = await prisma.election.findMany({
        where: {
          status: 'SCHEDULED',
          start_at: { lte: now },
        },
      });

      for (const election of scheduledElections) {
        await prisma.election.update({
          where: { id: election.id },
          data: { status: 'ACTIVE' },
        });

        // Track state change in Audit logs
        await prisma.auditLog.create({
          data: {
            event_type: 'ELECTION_STATUS_CHANGE',
            description: `Election "${election.title}" has transitioned from SCHEDULED to ACTIVE based on start time.`,
            election_id: election.id,
          },
        });

        // Broadcast to all active voters real-time
        io.emit('election_status_update', {
          id: election.id,
          title: election.title,
          status: 'ACTIVE',
        });
        console.log(`🚀 Automated transition: Election "${election.title}" is now ACTIVE.`);
      }

      // Transition Active -> Closed
      const activeElections = await prisma.election.findMany({
        where: {
          status: 'ACTIVE',
          end_at: { lte: now },
        },
      });

      for (const election of activeElections) {
        await prisma.election.update({
          where: { id: election.id },
          data: { status: 'CLOSED' },
        });

        await prisma.auditLog.create({
          data: {
            event_type: 'ELECTION_STATUS_CHANGE',
            description: `Election "${election.title}" has transitioned from ACTIVE to CLOSED based on end time.`,
            election_id: election.id,
          },
        });

        io.emit('election_status_update', {
          id: election.id,
          title: election.title,
          status: 'CLOSED',
        });
        console.log(`🔒 Automated transition: Election "${election.title}" is now CLOSED.`);
      }
    } catch (error) {
      console.error('❌ Scheduler error in election alignment:', error);
    }
  });

  // 2. Every hour, scan vote records for off-hours security flags
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🛡️ Scanning vote blocks for off-hours / peak anomalies...');
      const now = new Date();
      const currentHour = now.getHours();

      // Flag off-hours voting if detected between 1 AM and 5 AM
      if (currentHour >= 1 && currentHour <= 5) {
        const midnightVotes = await prisma.vote.findMany({
          where: {
            cast_at: {
              gte: new Date(now.setHours(1, 0, 0, 0)),
              lte: new Date(now.setHours(5, 0, 0, 0)),
            },
          },
        });

        if (midnightVotes.length > 50) {
          const anomaly = await prisma.anomalyFlag.create({
            data: {
              flag_type: 'OFF_HOURS_ACTIVITY',
              ip_address: 'System-Scanner',
              severity: 'MEDIUM',
              details: {
                message: `Elevated polling activity volume (${midnightVotes.length} ballots) detected during off-hours (1AM-5AM).`,
                vote_count: midnightVotes.length,
              },
            },
          });

          io.emit('security_anomaly_flagged', anomaly);
        }
      }
    } catch (error) {
      console.error('❌ Scheduler error in anomaly analysis:', error);
    }
  });
}
