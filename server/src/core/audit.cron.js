import cron from 'node-cron';
import { prisma } from '../prisma.js';
import { verifyChain, append as appendLedgerRecord } from './ledger.engine.js';
import { createTransporter } from '../shared/email.service.js';
import { logEvent } from './audit.service.js';
import crypto from 'crypto';

const SECTORS = ['VOTE', 'TAX', 'VEHICLE', 'PROPERTY', 'CIVIL_REGISTRY'];

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Sends a clean, branded email Notification
 */
async function sendSystemMail(toEmail, subject, textContent, bannerText = "OneID Bangladesh Government Cloud Hub 🇧🇩") {
  const transporter = createTransporter();
  console.log(`✉️ [SYSTEM CRON NOTIFICATION] To: ${toEmail} | Subject: "${subject}"`);
  if (!transporter) {
    console.warn(`SMTP Not Configured. Suppressing email transmission.`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"OneID Core System" <${process.env.EMAIL_USER || 'no-reply@oneid.gov.bd'}>`,
      to: toEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; background: #FAFAFA; border: 1.5px solid #006a4e; border-radius: 12px; max-width: 550px; margin: auto;">
          <h2 style="color: #006a4e; margin-top: 0; font-size: 18px; border-bottom: 2px solid #006a4e; padding-bottom: 8px;">
            ${bannerText}
          </h2>
          <p style="font-size: 14px; line-height: 1.6; color: #333; white-space: pre-line;">${textContent}</p>
          <hr style="border: 0; border-top: 1px solid #ddd; margin-top: 25px; margin-bottom: 10px;" />
          <caption style="font-size: 10px; color: #888; display: block; text-align: center;">This is an automated system dispatch from OneID Secure Cryptographic Watchdog Core.</caption>
        </div>
      `
    });
  } catch (err) {
    console.error('Failed to deliver system email notification:', err);
  }
}

/**
 * Triggers secure tamper alert warning to all super admins
 */
async function triggerTamperAlarm(sector, errorDetails) {
  const superAdmins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
  const emails = superAdmins.map(admin => admin.email).filter(Boolean);
  if (emails.length === 0) return;

  const transporter = createTransporter();
  if (!transporter) {
    console.warn(`[Watchdog Alert] Tamper found in ${sector} but SMTP is unconfigured.`);
    return;
  }

  const subject = `🚨 Tamper Detected in Sector ${sector}`;
  const textContent = `
    Integrity check detected a chain discontinuity in sector: ${sector}
    
    Layer: ${errorDetails.layer || 'SEQUENCE_CHAIN'}
    Broken Block: #${errorDetails.brokenAt || 'Unknown'}
    Reason: ${errorDetails.reason || 'Hash or signature mismatch'}

    Please check system audit logs immediately.
  `;

  for (const email of emails) {
    await sendSystemMail(email, subject, textContent, "OneID Security Watchdog");
  }
}

/**
 * Perform verification on all modules and log to console
 */
export async function verifyAllChainsAndPrint() {
  for (const sector of SECTORS) {
    try {
      const check = await verifyChain(sector, prisma);
      if (check.valid) {
        console.log(`✓ ${sector} chain: ${check.totalRecords} records, valid`);
      } else {
        console.log(`✗ TAMPER DETECTED in ${sector}`);
        await triggerTamperAlarm(sector, check);
      }
    } catch (err) {
      console.error(`✗ Exception verifying ${sector} chain:`, err);
    }
  }
}

/**
 * Starts all scheduled background timers across OneID modules
 */
export function startAllCrons() {
  console.log('[cron] Starting audit schedulers');

  verifyAllChainsAndPrint().catch(err => {
    console.error('Failed executing initial startup verification audit:', err);
  });

  cron.schedule('0 * * * *', async () => {
    console.log('[cron] Hourly ledger audit');
    await verifyAllChainsAndPrint();
  });

  cron.schedule('0 8 * * *', async () => {
    console.log('[cron] Daily civil check');
    try {
      const now = new Date();

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

      console.log(`[cron] ${pendingFinalizations.length} divorce proceedings to finalize`);

      for (const proceeding of pendingFinalizations) {
        const actualDate = new Date();
        const certHash = sha256(proceeding.marriage.marriageId + proceeding.id + actualDate.toISOString());

        const ledgerRec = await appendLedgerRecord('CIVIL_REGISTRY', {
          eventType: 'DIVORCE_FINALIZED_AUTOMATIC',
          marriageId: proceeding.marriage.marriageId,
          proceedingId: proceeding.id,
          certificateHash: certHash
        }, prisma);

        await prisma.divorceProceeding.update({
          where: { id: proceeding.id },
          data: {
            status: 'FINALIZED',
            actualEffectiveDate: actualDate,
            certificateHash: certHash,
            ledgerRecordId: ledgerRec.id
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

        // Email notifications to citizens
        const groomMsg = `Dear Citizen ${proceeding.marriage.groom.name},\n\nYour marriage dissolution (Registration ID: ${proceeding.marriage.marriageId}) has been finalized as the mandatory 90-day statutory arbitration and reconciliation window has concluded.\n\nYour status has been updated to DIVORCED in the OneID sovereign registry.\nDissolution Certificate Checksum: ${certHash}`;
        const brideMsg = `Dear Citizen ${proceeding.marriage.bride.name},\n\nYour marriage dissolution (Registration ID: ${proceeding.marriage.marriageId}) has been finalized as the mandatory 90-day statutory arbitration and reconciliation window has concluded.\n\nYour status has been updated to DIVORCED in the OneID sovereign registry.\nDissolution Certificate Checksum: ${certHash}`;

        if (proceeding.marriage.groom.email) {
          await sendSystemMail(proceeding.marriage.groom.email, "Marital Dissolution Certificate Finalized", groomMsg, "OneID Civil Registry Notification 🇧🇩");
        }
        if (proceeding.marriage.bride.email) {
          await sendSystemMail(proceeding.marriage.bride.email, "Marital Dissolution Certificate Finalized", brideMsg, "OneID Civil Registry Notification 🇧🇩");
        }
      }

      // Find outstanding cases with no arbitration council setup after 28 days
      const warningHorizon = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
      const overdueProceedings = await prisma.divorceProceeding.findMany({
        where: {
          arbitrationFormedAt: null,
          status: 'NOTICE_FILED',
          noticeFiledAt: { lte: warningHorizon }
        },
        include: {
          marriage: {
            include: { groom: true, bride: true }
          }
        }
      });

      console.log(`[cron] ${overdueProceedings.length} overdue divorce proceedings (28+ days)`);

      if (overdueProceedings.length > 0) {
        const localAdmins = await prisma.user.findMany({ where: { role: 'LOCAL_AUTHORITY_ADMIN' } });
        const adminEmails = localAdmins.map(admin => admin.email).filter(Boolean);

        if (adminEmails.length > 0) {
          for (const proceeding of overdueProceedings) {
            const warningMsg = `Divorce proceeding ID: ${proceeding.id} (Groom: ${proceeding.marriage.groom.name} + Bride: ${proceeding.marriage.bride.name}) has been open for over 28 days without an arbitration council.\n\nPlease log in to establish an arbitration council before the 30-day deadline.`;
            for (const email of adminEmails) {
              await sendSystemMail(email, `⚠️ 28 Days Passed Without Arbitration Council`, warningMsg, "Union Parishad Local Authority");
            }
          }
        }
      }

    } catch (err) {
      console.error('❌ Exception execution Daily Civil Scheduler checks:', err);
    }
  });

  cron.schedule('0 9 * * *', async () => {
    console.log('[cron] Road tax expiry scan');
    try {
      const now = new Date();
      const fourteenDaysOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const scanVehicles = await prisma.vehicle.findMany({
        where: {
          roadTaxDueDate: {
            gte: now,
            lte: fourteenDaysOut
          }
        },
        include: {
          currentOwner: true
        }
      });

      console.log(`[cron] ${scanVehicles.length} vehicles with expiring road tax`);

      for (const vehicle of scanVehicles) {
        if (vehicle.currentOwner && vehicle.currentOwner.email) {
          const expirationMsg = `Dear Citizen ${vehicle.currentOwner.name},\n\nRoad tax for your vehicle ${vehicle.registrationNo} (${vehicle.make} ${vehicle.model}) expires on ${vehicle.roadTaxDueDate ? vehicle.roadTaxDueDate.toLocaleDateString() : 'N/A'}.\n\nPlease renew your tax payment through the OneID portal within 14 days.`;
          await sendSystemMail(vehicle.currentOwner.email, `⚠️ Road Tax Expiring Soon - ${vehicle.registrationNo}`, expirationMsg, "BRTA Vehicle Registrar");
        }
      }

    } catch (err) {
      console.error('❌ Exception executing BRTA scheduler compliance check:', err);
    }
  });

  // Cron 4 (Weekly Monday 7:00 AM): stats summary email to super admin accounts
  cron.schedule('0 7 * * 1', async () => {
    console.log('[cron] Weekly stats email');
    try {
      const superAdmins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
      const emails = superAdmins.map(admin => admin.email).filter(Boolean);
      if (emails.length === 0) return;

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newUsersCount = await prisma.user.count({ where: { created_at: { gte: sevenDaysAgo } } });

      let sectorCountsText = '';
      let activeChainStatusText = '';

      for (const sector of SECTORS) {
        const count = await prisma.ledgerRecord.count({ where: { sector: sector } });
        const check = await verifyChain(sector, prisma);
        const health = check.valid ? 'VALID' : '🚨 TAMPER DETECTED';
        
        sectorCountsText += `- ${sector}: ${count} records\n`;
        activeChainStatusText += `- ${sector}: ${health}\n`;
      }

      const weeklyStatsContent = `
        OneID Bangladesh Weekly Summary:

        Users:
        - New identity registrations (last 7 days): ${newUsersCount}

        Ledger Records & Health:
        ${sectorCountsText}
        ${activeChainStatusText}
      `;

      for (const email of emails) {
        await sendSystemMail(email, '📊 Weekly OneID Admin Digest', weeklyStatsContent, "OneID Bangladesh Dashboard 🇧🇩");
      }

    } catch (err) {
      console.error('❌ Error sending weekly stats summary:', err);
    }
  });
}

// Backward compatibility imports mapping
export function startAuditCron() {
  startAllCrons();
}
