import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { verifyChain } from '../utils/blockchain.js';
import { logEvent } from '../utils/audit.js';
import { createTransporter } from '../utils/email.js';

const prisma = new PrismaClient();

// In-memory verification logs map (electionId -> verification details object)
export const lastVerificationResults = new Map();

/**
 * Smart Auto Audit System — Automatically verifies blockchain chain integrity every hour.
 * Sends email alert to admin if tampering is detected.
 */
export function startAuditVerifier(io) {
  console.log('⏰ Starting secure Smart Auto Audit Verifier (every hour)...');

  cron.schedule('0 * * * *', async () => {
    await runAutoAudit(io);
  });
}

export async function runAutoAudit(io) {
  try {
    // 1. Get all elections
    const elections = await prisma.election.findMany();
    
    for (const election of elections) {
      // 2. Fetch all votes ordered by cast_at ascending to verify blockchain chain
      const votes = await prisma.vote.findMany({
        where: { election_id: election.id },
        orderBy: { cast_at: 'asc' }
      });

      // Verification rule: Skip or check elections with at least 1 vote
      if (votes.length === 0) continue;

      const result = verifyChain(votes);
      const is_valid = result.valid;
      const brokenAt = result.brokenAt;
      const voteId = result.voteId;

      // Update in-memory map
      lastVerificationResults.set(election.id, {
        electionId: election.id,
        title: election.title,
        lastVerified: new Date().toISOString(),
        valid: is_valid,
        totalVotes: votes.length,
        brokenAt: is_valid ? null : brokenAt,
        voteId: is_valid ? null : voteId
      });

      // Log verified results
      await logEvent(
        null, 
        "BLOCKCHAIN_VERIFIED", 
        `Chain verified for election: ${election.title} | Result: ${is_valid ? "INTACT" : `TAMPER DETECTED at vote index ${brokenAt}`}`, 
        null, 
        election.id
      );

      // Handle anomaly
      if (!is_valid) {
        // Send email to admin (EMAIL_USER)
        const transporter = createTransporter();
        const adminEmail = process.env.EMAIL_USER;

        const subject = `🚨 CRITICAL: Blockchain Tamper Detected in OneID`;
        const bodyContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px;">
            <h2 style="color: #991b1b; margin-top: 0;">🚨 CRITICAL: Blockchain tamper detected in OneID</h2>
            <hr style="border-color: #fee2e2;"/>
            <p><strong>Election:</strong> ${election.title}</p>
            <p><strong>Broken at vote index:</strong> ${brokenAt}</p>
            <p><strong>Vote ID:</strong> ${voteId}</p>
            <p style="font-weight: bold; color: #7f1d1d;">Check audit logs immediately!</p>
          </div>
        `;

        console.log(`🚨 [ALERT TO ADMIN] Tamper detected in election: "${election.title}". Broken index: ${brokenAt}, Vote ID: ${voteId}`);
        if (transporter && adminEmail) {
          try {
            await transporter.sendMail({
              from: `"OneID Bangladesh Watchdog" <${process.env.EMAIL_USER}>`,
              to: adminEmail,
              subject: subject,
              html: bodyContent
            });
          } catch (mailErr) {
            console.error('❌ Failed to deliver tamper alert email:', mailErr);
          }
        }

        // Socket emit to admin channels
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
    console.error('❌ Automatic chain verifier failed:', error);
  }
}
