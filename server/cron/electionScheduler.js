import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logEvent } from '../utils/audit.js';
import {
  sendElectionOpenNotification,
  sendElectionCloseNotification,
  sendElectionReminderNotification
} from '../services/notificationService.js';

const prisma = new PrismaClient();

/**
 * Resolves list of voter emails associated with an election's constituency scope.
 */
async function getVoterEmailsForElection(election) {
  let selectQuery = {
    where: { role: 'VOTER' },
    select: { email: true }
  };

  if (election.constituency_scope !== 'ALL' && election.constituency_scope !== 'NATIONAL') {
    selectQuery.where.constituency = {
      contains: election.constituency_scope,
      mode: 'insensitive'
    };
  }

  const users = await prisma.user.findMany(selectQuery);
  return users.map((u) => u.email);
}

/**
 * Automates election state transitions on a minute-by-minute routine.
 * Emits real-time live updates via the central socket server and appends security logs.
 * @param {import('socket.io').Server} io - Socket.io live connection hub
 */
export function startScheduler(io) {
  console.log('⏰ Starting secure election status tracker...');
  
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // 1. Transition elections SCHEDULED -> ACTIVE
      const scheduledElections = await prisma.election.findMany({
        where: {
          status: 'SCHEDULED',
          start_at: { lte: now }
        }
      });

      for (const election of scheduledElections) {
        await prisma.election.update({
          where: { id: election.id },
          data: { status: 'ACTIVE' }
        });

        io.emit('election:status_changed', { 
          electionId: election.id, 
          status: 'ACTIVE', 
          title: election.title 
        });
        
        await logEvent(null, "ELECTION_OPENED", election.title, null, election.id);
        console.log(`📡 Election "${election.title}" transitioned automatically to ACTIVE.`);

        // Dispatch emails asynchronously
        getVoterEmailsForElection(election)
          .then((emails) => sendElectionOpenNotification(election, emails))
          .catch((err) => console.error(`❌ Error in open-polling notifier for ${election.title}:`, err));
      }

      // 2. Transition elections ACTIVE -> CLOSED
      const activeElections = await prisma.election.findMany({
        where: {
          status: 'ACTIVE',
          end_at: { lte: now }
        }
      });

      for (const election of activeElections) {
        await prisma.election.update({
          where: { id: election.id },
          data: { status: 'CLOSED' }
        });

        io.emit('election:status_changed', { 
          electionId: election.id, 
          status: 'CLOSED', 
          title: election.title 
        });
        
        await logEvent(null, "ELECTION_CLOSED", election.title, null, election.id);
        console.log(`🔒 Election "${election.title}" transitioned automatically to CLOSED.`);

        // Dispatch emails asynchronously
        getVoterEmailsForElection(election)
          .then((emails) => sendElectionCloseNotification(election, emails))
          .catch((err) => console.error(`❌ Error in close-polling notifier for ${election.title}:`, err));
      }
    } catch (err) {
      console.error('❌ Scheduler cycle encountered a security alignment error:', err);
    }
  });

  // 24-Hour Reminder Cron (Assesses active pollings ending in roughly 24 hours every hour)
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const targetMin = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const targetMax = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const reminderElections = await prisma.election.findMany({
        where: {
          status: 'ACTIVE',
          end_at: {
            gte: targetMin,
            lte: targetMax
          }
        }
      });

      for (const election of reminderElections) {
        const emails = await getVoterEmailsForElection(election);
        await sendElectionReminderNotification(election, emails);
        console.log(`⏰ 24-hour reminder dispatched for election: "${election.title}" to ${emails.length} voters.`);
      }
    } catch (err) {
      console.error('❌ 24-hour reminder scheduler exception:', err);
    }
  });
}

