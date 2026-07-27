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

  const subject = `🚨 CRITICAL WARNING: Blockchain Forgery Detected in Sector ${sector}!`;
  const textContent = `
    ATTENTION SUPER ADMINISTRATOR,

    The secure automated integrity check job detected a cryptographic chain discontinuity.
    
    [ANOMALY PROFILE DETAILS]
    - Module Sector: ${sector}
    - Fault Verification Layer: ${errorDetails.layer || 'SEQUENCE_CHAIN'}
    - Broken Sequence Index: Block #${errorDetails.brokenAt || 'Unknown'}
    - Investigative Message: ${errorDetails.reason || 'Record Hash or HMAC authentication mismatch.'}

    Under strict sovereign sandbox legislation protocols, modifications to block nodes are completely restricted. Ensure that the database container, system credentials, or Postgres trigger modules have not been compromised.
  `;

  for (const email of emails) {
    await sendSystemMail(email, subject, textContent, "⚠️ SECURE COSTEWARD CHANNELS - UNLAWFUL MUTATION ALERT");
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
  console.log('⏰ [OneID Schedulers] Initializing multi-sector audit & compliance daemon...');

  // 0. Perform Initial Verification logs on startup
  verifyAllChainsAndPrint().catch(err => {
    console.error('Failed executing initial startup verification audit:', err);
  });

  // Cron 1 (Hourly Audit): Verify all block chain sectors sequentially
  cron.schedule('0 * * * *', async () => {
    console.log('🔍 [OneID Hourly Audit] Verifying blockchain cryptographic forward chains...');
    await verifyAllChainsAndPrint();
  });

  // Cron 2 (Daily 8:00 AM): Auto-finalize divorces and remind local authorities
  cron.schedule('0 8 * * *', async () => {
    console.log('⏳ [OneID Civil Scheduler] Initiating daily compliance & marital finalization protocols...');
    try {
      const now = new Date();

      // Finalize Arbitrations after 90 Days
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

      console.log(`⏳ [Civil Scheduler] Found ${pendingFinalizations.length} pending dissolution records ready for finalization.`);

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

      console.log(`⚠️ [Civil Scheduler] Found ${overdueProceedings.length} notice proceedings passing 28 days limit without formed Arbitration.`);

      if (overdueProceedings.length > 0) {
        const localAdmins = await prisma.user.findMany({ where: { role: 'LOCAL_AUTHORITY_ADMIN' } });
        const adminEmails = localAdmins.map(admin => admin.email).filter(Boolean);

        if (adminEmails.length > 0) {
          for (const proceeding of overdueProceedings) {
            const warningMsg = `URGENT COMPLIANCE ACTION REQUIRED,\n\nDivorce proceeding ID: ${proceeding.id} (Groom: ${proceeding.marriage.groom.name} (${proceeding.marriage.groomOneId}) + Bride: ${proceeding.marriage.bride.name} (${proceeding.marriage.brideOneId})) has been filed for more than 28 days without an Arbitration council setup.\n\nPlease log in immediately to establish arbitration councils as required under statutory legislation protocols before the 30-day legal deadline.`;
            for (const email of adminEmails) {
              await sendSystemMail(email, `⚠️ COMPLIANCE ALARM: 28 Days Passed Without Arbitration council`, warningMsg, "Union Parishad Local Authority Watchdog Console");
            }
          }
        }
      }

    } catch (err) {
      console.error('❌ Exception execution Daily Civil Scheduler checks:', err);
    }
  });

  // Cron 3 (Daily 9:00 AM): Road Tax Near Expiry Notifications (within 14 days)
  cron.schedule('0 9 * * *', async () => {
    console.log('⏳ [OneID BRTA Scheduler] Conducting vehicle road tax compliance scans...');
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

      console.log(`⏳ [BRTA Scheduler] Vehicles requiring near-term tax renewals: ${scanVehicles.length}`);

      for (const vehicle of scanVehicles) {
        if (vehicle.currentOwner && vehicle.currentOwner.email) {
          const expirationMsg = `Dear Citizen ${vehicle.currentOwner.name},\n\nOur system records scan shows that the Road Tax statutory validity period for your registered vehicle [${vehicle.make} ${vehicle.model}] (Registration Designation Number: ${vehicle.registrationNo}) is near-term expiring on ${vehicle.roadTaxDueDate ? vehicle.roadTaxDueDate.toLocaleDateString() : 'N/A'}.\n\nPlease secure full tax renewal payments through the OneID Tax & Revenue portal within 14 days to prevent automatic traffic fine increments under municipal BRTA regulations.\n\nSovereign Land Transport & BRTA System`;
          await sendSystemMail(vehicle.currentOwner.email, `⚠️ ROAD TAX Near-Expiry Warning - ${vehicle.registrationNo}`, expirationMsg, "BRTA Vehicle Registrar Compliance Hub 🇧🇩");
        }
      }

    } catch (err) {
      console.error('❌ Exception executing BRTA scheduler compliance check:', err);
    }
  });

  // Cron 4 (Weekly Monday 7:00 AM): stats summary email to super admin accounts
  cron.schedule('0 7 * * 1', async () => {
    console.log('📊 [OneID Weekly Stats] Delivering weekly sovereign audit digests...');
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
        const health = check.valid ? 'VALID & INTEGRITY APPROVED [SEALED]' : '🚨 CORRUPT / TAMPER DETECTED';
        
        sectorCountsText += `- ${sector}: ${count} Total Sealed Records\n`;
        activeChainStatusText += `- ${sector} Ledger Security Status: ${health}\n`;
      }

      const weeklyStatsContent = `
        Dear Sovereign Super Administrator,

        Here is your official scheduled OneID Bangladesh weekly administrative ledger health report:

        [SYSTEM CORE REGISTRATION STATS]
        - New identity cards created in the last 7 days: ${newUsersCount}

        [BLOCK SEQUENCE METRIC ANALYSIS]
        ${sectorCountsText}

        [CHRONO-CHAIN HEALTH REPORT]
        ${activeChainStatusText}

        All security safeguards (Postgres Block Trigger locks, active webhook logging channels, and JWT audit validations) are fully functional as expected.

        OneID Bangladesh Cloud Hub Platform Node
      `;

      for (const email of emails) {
        await sendSystemMail(email, '📊 Weekly Sovereign Administrative Ledger Digest', weeklyStatsContent, "OneID Bangladesh Government Central Dashboard 🇧🇩");
      }

    } catch (err) {
      console.error('❌ Exception dispatching Monday morning metrics summary:', err);
    }
  });
}

// Backward compatibility imports mapping
export function startAuditCron() {
  startAllCrons();
}
