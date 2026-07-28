import cron from 'node-cron';
import { prisma } from '../../prisma.js';
import { logEvent } from '../../core/audit.service.js';
import { verifyVoteChain } from '../../core/ledger.engine.js';
import { createTransporter } from '../../shared/email.service.js';
import {
  sendElectionOpenNotification,
  sendElectionCloseNotification,
  sendElectionReminderNotification
} from '../../../services/notificationService.js';

// In-memory verification logs map (electionId -> verification details object)
export const lastVerificationResults = new Map();

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
  console.log('[cron] Election status tracker started');
  
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

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

        if (io) {
          io.emit('election:status_changed', { 
            electionId: election.id, 
            status: 'ACTIVE', 
            title: election.title 
          });
        }
        
        await logEvent(null, "ELECTION_OPENED", election.title, null, election.id);
        console.log(`[cron] Election "${election.title}" opened`);

        getVoterEmailsForElection(election)
          .then((emails) => sendElectionOpenNotification(election, emails))
          .catch((err) => console.error(`[error] Email notifier failed for ${election.title}:`, err));
      }

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

        if (io) {
          io.emit('election:status_changed', { 
            electionId: election.id, 
            status: 'CLOSED', 
            title: election.title 
          });
        }
        
        await logEvent(null, "ELECTION_CLOSED", election.title, null, election.id);
        console.log(`[cron] Election "${election.title}" closed`);

        getVoterEmailsForElection(election)
          .then((emails) => sendElectionCloseNotification(election, emails))
          .catch((err) => console.error(`[error] Email notifier failed for ${election.title}:`, err));
      }
    } catch (err) {
      console.error('[error] Election scheduler:', err);
    }
  });

  // 24-hour reminder (hourly)
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
        console.log(`[cron] 24h reminder sent for "${election.title}" to ${emails.length} voters`);
      }
    } catch (err) {
      console.error('[error] Reminder scheduler:', err);
    }
  });
}

export function startAuditVerifier(io) {
  console.log('[cron] Vote chain audit started');

  cron.schedule('0 * * * *', async () => {
    await runAutoAudit(io);
  });
}

export async function runAutoAudit(io) {
  try {
    const elections = await prisma.election.findMany();
    
    for (const election of elections) {
      const votes = await prisma.vote.findMany({
        where: { election_id: election.id },
        orderBy: { cast_at: 'asc' }
      });

      if (votes.length === 0) continue;

      const result = verifyVoteChain(votes);
      const is_valid = result.valid;
      const brokenAt = result.brokenAt;
      const voteId = result.voteId;

      lastVerificationResults.set(election.id, {
        electionId: election.id,
        title: election.title,
        lastVerified: new Date().toISOString(),
        valid: is_valid,
        totalVotes: votes.length,
        brokenAt: is_valid ? null : brokenAt,
        voteId: is_valid ? null : voteId
      });

      await logEvent(
        null, 
        "BLOCKCHAIN_VERIFIED", 
        `Chain verified for election: ${election.title} | Result: ${is_valid ? "INTACT" : `TAMPER DETECTED at vote index ${brokenAt}`}`, 
        null, 
        election.id
      );

      if (!is_valid) {
        const transporter = createTransporter();
        const adminEmail = process.env.EMAIL_USER;

        const subject = `🚨 CRITICAL: Blockchain Tamper Detected in OneID Voting`;
        const bodyContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px;">
            <h2 style="color: #991b1b; margin-top: 0;">🚨 CRITICAL: Blockchain tamper detected in OneID Voting</h2>
            <hr style="border-color: #fee2e2;"/>
            <p><strong>Election:</strong> ${election.title}</p>
            <p><strong>Broken at vote index:</strong> ${brokenAt}</p>
            <p><strong>Vote ID:</strong> ${voteId}</p>
            <p style="font-weight: bold; color: #7f1d1d;">Check audit logs immediately!</p>
          </div>
        `;

        console.log(`[alert] Tamper in "${election.title}" at index ${brokenAt}`);
        if (transporter && adminEmail) {
          try {
            await transporter.sendMail({
              from: `"OneID watchdog" <${process.env.EMAIL_USER}>`,
              to: adminEmail,
              subject: subject,
              html: bodyContent
            });
          } catch (mailErr) {
            console.error('❌ Failed to deliver tamper alert email:', mailErr);
          }
        }

        if (io) {
          io.emit('blockchain:tamper_detected', { 
            electionId: election.id, 
            title: election.title, 
            brokenAt, 
            voteId,
            severity: 'CRITICAL' 
          });
        }
      }
    }
  } catch (error) {
    console.error('[error] Vote chain audit:', error);
  }
}
