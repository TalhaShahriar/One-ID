import { createTransporter } from '../utils/email.js';

const APP_URL = process.env.APP_URL || 'https://ais-dev-5sfmltgosgf4qvwnuoipps-754067182761.asia-east1.run.app';
const EMAIL_USER = process.env.EMAIL_USER || 'no-reply@votechain.gov.bd';

/**
 * Sends BCC emails in batches of 50 to maintain rate compliance.
 */
async function sendBatchEmail({ bccEmails, subject, htmlBody }) {
  const transporter = createTransporter();
  const batchSize = 50;

  if (!bccEmails || bccEmails.length === 0) {
    console.log(`ℹ️ [Email Dispatcher] Empty subscriber list for "${subject}". Aborting.`);
    return;
  }

  console.log(`📡 [Email Dispatcher] Initializing batch outbox. Total recipients count: ${bccEmails.length}. Subject: "${subject}"`);

  for (let i = 0; i < bccEmails.length; i += batchSize) {
    const batch = bccEmails.slice(i, i + batchSize);
    
    console.log(`📧 [OUTGOING EMAIL BATCH] Sending to: [${batch.join(', ')}]`);

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Election Commission of Bangladesh" <${EMAIL_USER}>`,
          to: EMAIL_USER, // Self-to keep it secure
          bcc: batch,
          subject: subject,
          html: htmlBody
        });
        console.log(`✓ [Email Dispatcher] Successfully delivered batch index starting at ${i}.`);
      } catch (err) {
        console.error(`❌ [Email Dispatcher] SMTP Failure at batch index starting at ${i}:`, err);
      }
    } else {
      console.log(`ℹ️ [Simulator Log Only] Email template content:\n${htmlBody}`);
    }
  }
}

/**
 * 1. sendElectionOpenNotification
 * Batches announcements indicating ballot box has opened.
 */
export async function sendElectionOpenNotification(election, voterEmails) {
  const subject = `🗳️ Voting is now open — ${election.title}`;
  const startStr = new Date(election.start_at).toLocaleString();
  const endStr = new Date(election.end_at).toLocaleString();
  
  const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: left;">
        <div style="text-align: center; font-size: 26px; font-weight: bold; color: #006a4e; margin-bottom: 24px; letter-spacing: -0.025em;">
          OneID Bangladesh 🇧🇩
        </div>
        <div style="height: 1px; background-color: #f1f5f9; margin-bottom: 28px;"></div>
        
        <h2 style="font-size: 20px; color: #1e293b; margin-top: 0; margin-bottom: 12px; font-weight: 800;">Secure Polling Commenced</h2>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
          The designated ballot window for <strong>${election.title}</strong> is now officially <strong>OPEN</strong>. Registered citizens residing under the constituency scope may now cast their digitized ballots securely.
        </p>

        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
          <div style="font-size: 13px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Polling Specifics</div>
          <p style="font-size: 14px; color: #1e293b; margin: 4px 0;"><strong>Electoral Unit:</strong> ${election.administrative_unit}</p>
          <p style="font-size: 14px; color: #1e293b; margin: 4px 0;"><strong>Constituency Scope:</strong> ${election.constituency_scope}</p>
          <p style="font-size: 14px; color: #1e293b; margin: 4px 0;"><strong>Opened On:</strong> ${startStr}</p>
          <p style="font-size: 14px; color: #1e293b; margin: 4px 0;"><strong>Closing Date:</strong> ${endStr}</p>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${APP_URL}/elections" style="background-color: #006a4e; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 14px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(0, 106, 78, 0.25);">
            Cast Your Vote →
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; line-height: 1.6; margin-bottom: 0;">
          🔒 <strong>Note on Security:</strong> Votes are aggregated into decentralized nodes with custom SHA-256 links. Your identity remains strictly anonymous. Do not share your 2FA OTP with third parties.
        </p>
        <div style="height: 1px; background-color: #f1f5f9; margin: 28px 0;"></div>
        <p style="font-size: 10px; color: #94a3b8; text-align: center; margin: 0;">
          OneID Bangladesh Platform • Secure E-Governance and Verification
        </p>
      </div>
    </div>
  `;

  await sendBatchEmail({ bccEmails: voterEmails, subject, htmlBody });
}

/**
 * 2. sendElectionCloseNotification
 * Batches notifications indicating ballot box closes.
 */
export async function sendElectionCloseNotification(election, voterEmails) {
  const subject = `🔒 Voting has closed — ${election.title}`;
  
  const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: left;">
        <div style="text-align: center; font-size: 26px; font-weight: bold; color: #006a4e; margin-bottom: 24px; letter-spacing: -0.025em;">
          OneID Bangladesh 🇧🇩
        </div>
        <div style="height: 1px; background-color: #f1f5f9; margin-bottom: 28px;"></div>
        
        <h2 style="font-size: 20px; color: #1e293b; margin-top: 0; margin-bottom: 12px; font-weight: 800;">Ballot Seal Complete</h2>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
          The voting process for <strong>${election.title}</strong> has concluded. The blockchain vote ledger has been locked, and all vote tallies are sealed securely.
        </p>

        <p style="font-size: 14px; color: #334155; line-height: 1.5; margin-bottom: 30px;">
          Our nodes are currently auditing individual chain links. Once certified, final results will be published directly on the platform for public review.
        </p>

        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${APP_URL}/elections" style="background-color: #1e293b; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 14px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(30, 41, 59, 0.25);">
            View Election Board
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; line-height: 1.6; margin-bottom: 0;">
          All voter receipts generated can be verified on the voter dashboard using your unique ballot UUID.
        </p>
        <div style="height: 1px; background-color: #f1f5f9; margin: 28px 0;"></div>
        <p style="font-size: 10px; color: #94a3b8; text-align: center; margin: 0;">
          OneID Bangladesh Platform • Secure E-Governance and Verification
        </p>
      </div>
    </div>
  `;

  await sendBatchEmail({ bccEmails: voterEmails, subject, htmlBody });
}

/**
 * 3. sendElectionReminderNotification
 * 24 hours closing warnings.
 */
export async function sendElectionReminderNotification(election, voterEmails) {
  const subject = `⏰ Reminder: Only 24 hours left to vote in ${election.title}`;
  const endStr = new Date(election.end_at).toLocaleString();
  
  const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: left;">
        <div style="text-align: center; font-size: 26px; font-weight: bold; color: #006a4e; margin-bottom: 24px; letter-spacing: -0.025em;">
          OneID Bangladesh 🇧🇩
        </div>
        <div style="height: 1px; background-color: #f1f5f9; margin-bottom: 28px;"></div>
        
        <h2 style="font-size: 20px; color: #991b1b; margin-top: 0; margin-bottom: 12px; font-weight: 800;">Ballet Window Closing Warning</h2>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
          This is an automated notification warning that the election <strong>${election.title}</strong> is scheduled to close in exactly <strong>24 hours</strong>.
        </p>

        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
          <p style="font-size: 14px; color: #991b1b; margin: 0; font-weight: bold;">
            🔒 Voting Deadline: ${endStr}
          </p>
          <p style="font-size: 13px; color: #7f1d1d; margin: 8px 0 0 0; line-height: 1.5;">
            To ensure your voice representation is registered in the sovereign ballot ledger, please log in and authenticate your vote prior to the seal timestamp.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${APP_URL}/elections" style="background-color: #991b1b; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 14px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(153, 27, 27, 0.25);">
            Cast Ballot Immediately
          </a>
        </div>

        <div style="height: 1px; background-color: #f1f5f9; margin: 28px 0;"></div>
        <p style="font-size: 10px; color: #94a3b8; text-align: center; margin: 0;">
          OneID Bangladesh Platform • Secure E-Governance and Verification
        </p>
      </div>
    </div>
  `;

  await sendBatchEmail({ bccEmails: voterEmails, subject, htmlBody });
}
