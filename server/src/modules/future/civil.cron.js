import cron from 'node-cron';
import { prisma } from '../../prisma.js';
import { append as appendLedgerRecord } from '../../core/ledger.engine.js';
import { createTransporter } from '../../shared/email.service.js';
import crypto from 'crypto';

// SHA-256 helper
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Help send visual emails
async function notifyUser(email, subject, bodyText) {
  const transporter = createTransporter();
  console.log(`✉️ [CRON CIVIL NOTIFICATION] To: ${email} | Subject: "${subject}" | Msg: ${bodyText}`);
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: `"OneID Civil Registry Node" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 25px; background: #FFF8E7; border: 2px solid #006a4e; border-radius: 12px; max-width: 550px; margin: auto;">
          <h2 style="color: #006a4e; margin-top: 0;">OneID Bangladesh • Civil Registry Cron System 🇧🇩</h2>
          <hr style="border: 0; border-top: 2px solid #006a4e; margin-bottom: 20px;" />
          <p style="font-size: 14px; line-height: 1.6; color: #333;">${bodyText}</p>
          <hr style="border: 0; border-top: 1px solid #ddd; margin-top: 25px; margin-bottom: 10px;" />
          <caption style="font-size: 11px; color: #666;">This is an automated background state transition from the OneID Core Civil Registry.</caption>
        </div>
      `
    });
  } catch (err) {
    console.error('Email notify fail:', err);
  }
}

/**
 * Initializes civil registry background tasks
 * @param {import('socket.io').Server} io - Socket.io connection hub
 */
export function startCivilScheduler(io) {
  console.log('⏰ Initializing OneID Bangladesh Civil Registry Cron Scheduler...');

  // Run daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('⏳ Running Civil Registry daily compliance checks...');
      const now = new Date();

      // 1. AUTO-FINALIZE EXPIRED 90-DAY CERTIFICATES
      const pendingFinalizations = await prisma.divorceProceeding.findMany({
        where: {
          status: 'ARBITRATION_ACTIVE',
          effectiveDate: { lte: now }
        },
        include: {
          marriage: {
            include: { groom: true, bride: true }
          }
        }
      });

      console.log(`⏳ Found ${pendingFinalizations.length} active arbitrations ready for 90-day finalization...`);

      for (const proceeding of pendingFinalizations) {
        const actualEffectiveDate = new Date();
        const certificateHash = sha256(proceeding.marriage.marriageId + proceeding.id + actualEffectiveDate.toISOString());

        const ledgerRecord = await appendLedgerRecord('CIVIL_REGISTRY', {
          eventType: 'DIVORCE_FINALIZED_AUTOMATIC',
          marriageId: proceeding.marriage.marriageId,
          proceedingId: proceeding.id,
          certificateHash
        }, prisma);

        await prisma.divorceProceeding.update({
          where: { id: proceeding.id },
          data: {
            status: 'FINALIZED',
            actualEffectiveDate,
            certificateHash,
            ledgerRecordId: ledgerRecord.id
          }
        });

        await prisma.marriageRecord.update({
          where: { id: proceeding.marriageId },
          data: { status: 'DISSOLVED' }
        });

        await prisma.user.update({
          where: { oneid: proceeding.marriage.groomOneId },
          data: { maritalStatus: 'DIVORCED' }
        });

        await prisma.user.update({
          where: { oneid: proceeding.marriage.brideOneId },
          data: { maritalStatus: 'DIVORCED' }
        });

        // Notify citizens of automatic finalization
        await notifyUser(proceeding.marriage.groom.email, "Marital Dissolution Finalized Automatcially", `The mandatory 90-day legal arbitration window has expired. Your marriage (Record Code: ${proceeding.marriage.marriageId}) is dissolved on the public registrar ledger. Certificate hash: <b>${certificateHash}</b>.`);
        await notifyUser(proceeding.marriage.bride.email, "Marital Dissolution Finalized Automatcially", `The mandatory 90-day legal arbitration window has expired. Your marriage (Record Code: ${proceeding.marriage.marriageId}) is dissolved on the public registrar ledger. Certificate hash: <b>${certificateHash}</b>.`);

        // Notify UI about updates if sockets available
        if (io) {
          io.emit('divorce_finalized_autom_alert', {
            marriageId: proceeding.marriage.marriageId,
            effectiveDate: actualEffectiveDate
          });
        }
      }

      // 2. DETECT INACTIVE / NOT YET FORMED COUNCILS CLOSE TO 30-DAY STATUTORY DEADLINE
      const notificationHorizon = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000); // 28 days ago or more
      const outstandingCouncils = await prisma.divorceProceeding.findMany({
        where: {
          arbitrationFormedAt: null,
          status: 'NOTICE_FILED',
          noticeFiledAt: { lte: notificationHorizon }
        },
        include: {
          marriage: true
        }
      });

      console.log(`⚠️ Detected ${outstandingCouncils.length} proceedings approaching the 30-day arbitration council limit without formation...`);

      for (const proceeding of outstandingCouncils) {
        console.warn(`🚨 COMPLIANCE VIOLATION WARNING: Notice Filed ${proceeding.noticeFiledAt.toDateString()} has passed 28 days without an Arbitration Council setup.`);
        // Emit trigger warning to any listening admin dashboard
        if (io) {
          io.emit('arbitration_deadline_violation', {
            divorceProceedingId: proceeding.id,
            marriageId: proceeding.marriage.marriageId,
            noticeFiledAt: proceeding.noticeFiledAt
          });
        }
      }

    } catch (err) {
      console.error('❌ Error executing Civil Registry Scheduler tasks:', err);
    }
  });
}
