import nodemailer from 'nodemailer';

/**
 * Creates email transport based on SMTP settings from environment variables.
 * Automatically falls back to log outputs if SMTP credentials are missing.
 * @returns {any} Nodemailer transporter instance or null if fallback is active.
 */
export function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('⚠️ SMTP credentials not found (EMAIL_USER & EMAIL_PASS). Mail outbox will log locally.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });
}

/**
 * Sends a 6-digit verification OTP email with beautiful OneID Bangladesh branding.
 * @param {string} email - Destination email address.
 * @param {string} name - Voter / User name.
 * @param {string} otp - 6-digit verification code.
 * @returns {Promise<boolean>} True if sent successfully or simulated.
 */
export async function sendOTPEmail(email, name, otp) {
  const transporter = createTransporter();
  
  const subject = `[OneID Bangladesh] Secure Verification Token Challenge: ${otp}`;
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="font-size: 24px; font-weight: bold; color: #006A4E; margin-bottom: 24px; letter-spacing: -0.025em;">
          OneID Bangladesh 🛡️
        </div>
        <div style="height: 1px; background-color: #f1f5f9; margin-bottom: 24px;"></div>
        <h2 style="font-size: 18px; color: #1e293b; margin-top: 0; margin-bottom: 8px;">Hi ${name},</h2>
        <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px;">
          You requested a secure verification challenge. Please enter the following 6-digit access code to authorize your action:
        </p>
        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px 24px; font-size: 32px; font-weight: bold; letter-spacing: 0.25em; color: #006A4E; display: inline-block; margin-bottom: 24px;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 0;">
          ⏰ This dynamic verification code is valid for <strong>5 minutes</strong> only.<br>
          If you did not initiate this request, please ignore this notice.
        </p>
        <div style="height: 1px; background-color: #f1f5f9; margin: 24px 0;"></div>
        <p style="font-size: 10px; color: #94a3b8; margin: 0;">
          OneID Bangladesh Platform • Secure E-Governance and Verification
        </p>
      </div>
    </div>
  `;

  console.log(`📡 [OUTGOING EMAIL] To: ${email} | Subject: "${subject}" | OTP: ${otp}`);

  if (!transporter) {
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"OneID Bangladesh Node" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to deliver OTP email to ${email}:`, error);
    return false;
  }
}

/**
 * Sends a candidacy approval confirmation email.
 * @param {string} email - Destination candidate email address.
 * @param {string} name - Candidate name.
 * @param {string} electionTitle - Associated election title.
 * @returns {Promise<boolean>} True if sent successfully or simulated.
 */
export async function sendCandidateApprovalEmail(email, name, electionTitle) {
  const transporter = createTransporter();
  const subject = `[OneID Voting] Candidacy Application Approved!`;
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="font-size: 24px; font-weight: bold; color: #16a34a; margin-bottom: 24px; letter-spacing: -0.025em;">
          OneID Bangladesh 🎉
        </div>
        <div style="height: 1px; background-color: #f1f5f9; margin-bottom: 24px;"></div>
        <h2 style="font-size: 18px; color: #1e293b; margin-top: 0; margin-bottom: 8px;">Dearest ${name},</h2>
        <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px;">
          Congratulations! Your application for candidacy in <strong>${electionTitle}</strong> has been approved by the authorities.
        </p>
        <p style="font-size: 14px; color: #1e293b; font-weight: 500; margin-bottom: 24px;">
          You can now start campaigning and track live constituency trends on your candidate dashboard.
        </p>
        <div style="height: 1px; background-color: #f1f5f9; margin: 24px 0;"></div>
        <p style="font-size: 10px; color: #94a3b8; margin: 0;">
          OneID Bangladesh Platform • Secure E-Governance and Verification
        </p>
      </div>
    </div>
  `;

  console.log(`📡 [OUTGOING EMAIL] To: ${email} | Subject: "${subject}" | Candidacy APPROVED for ${electionTitle}`);

  if (!transporter) {
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"OneID Bangladesh Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to deliver candidate approval email to ${email}:`, error);
    return false;
  }
}

/**
 * Sends a candidacy rejection notification email.
 * @param {string} email - Destination candidate email address.
 * @param {string} name - Candidate name.
 * @param {string} reason - Rejection explanation.
 * @returns {Promise<boolean>} True if sent successfully or simulated.
 */
export async function sendCandidateRejectionEmail(email, name, reason) {
  const transporter = createTransporter();
  const subject = `[OneID Voting] Candidacy Application Notification`;
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 24px; letter-spacing: -0.025em;">
          OneID Bangladesh ⚠️
        </div>
        <div style="height: 1px; background-color: #f1f5f9; margin-bottom: 24px;"></div>
        <h2 style="font-size: 18px; color: #1e293b; margin-top: 0; margin-bottom: 8px;">Dear ${name},</h2>
        <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px;">
          Your application for candidacy has been reviewed. Your profile was not approved for this election cycle due to the following reason:
        </p>
        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 12px 16px; text-align: left; font-size: 13px; color: #991b1b; line-height: 1.5; margin-bottom: 24px;">
          <strong>Commission Note:</strong> ${reason}
        </div>
        <div style="height: 1px; background-color: #f1f5f9; margin: 24px 0;"></div>
        <p style="font-size: 10px; color: #94a3b8; margin: 0;">
          OneID Bangladesh Platform • Secure E-Governance and Verification
        </p>
      </div>
    </div>
  `;

  console.log(`📡 [OUTGOING EMAIL] To: ${email} | Subject: "${subject}" | Candidacy REJECTED. Reason: ${reason}`);

  if (!transporter) {
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"OneID Bangladesh Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to deliver candidate rejection email to ${email}:`, error);
    return false;
  }
}

/**
 * Sends election open announcements to a substantial bunch of users.
 * @param {string[]} emails - Array of targeted email addresses.
 * @param {string} electionTitle - Name of the election that just opened.
 * @returns {Promise<boolean>} True if all emails were delivered or recorded.
 */
export async function sendElectionOpenEmail(emails, electionTitle) {
  const transporter = createTransporter();
  const subject = `[OneID Voting] Secure Ballots Now Open: ${electionTitle}`;
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="font-size: 24px; font-weight: bold; color: #006A4E; margin-bottom: 24px; letter-spacing: -0.025em;">
          OneID Bangladesh 🗳️
        </div>
        <div style="height: 1px; background-color: #f1f5f9; margin-bottom: 24px;"></div>
        <h2 style="font-size: 18px; color: #1e293b; margin-top: 0; margin-bottom: 8px;">Nation Call to Ballot Box</h2>
        <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px;">
          The secure cryptographic voting doors for <strong>${electionTitle}</strong> are officially <strong>OPEN</strong>.
        </p>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">
          Cast your voting credentials from your nearest digital node and receive your cryptographic blockchain receipt instantly.
        </p>
        <div style="height: 1px; background-color: #f1f5f9; margin: 24px 0;"></div>
        <p style="font-size: 10px; color: #94a3b8; margin: 0;">
          OneID Bangladesh Platform • Secure E-Governance and Verification
        </p>
      </div>
    </div>
  `;

  console.log(`📡 [OUTGOING EMAIL LIST] To: [${emails.join(', ')}] | Subject: "${subject}" | Election OPENED.`);

  if (!transporter) {
    return true;
  }

  try {
    await Promise.all(
      emails.map((recipient) =>
        transporter.sendMail({
          from: `"OneID Bangladesh Platform" <${process.env.EMAIL_USER}>`,
          to: recipient,
          subject: subject,
          html: htmlContent,
        })
      )
    );
    return true;
  } catch (error) {
    console.error(`❌ Failed to deliver election opening notifications:`, error);
    return false;
  }
}
