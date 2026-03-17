// Email service for Londway Capital — Brevo transactional API
import axios from 'axios';

const BREVO_API_KEY = process.env.NEXT_PUBLIC_BREVO_API_KEY;
const SENDER = { name: 'Londway Capital', email: 'londwayfond@gmail.com' };

/** Generate a cryptographically secure 6-digit code */
export function generateSecureCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

function emailWrapper(headerLabel: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>Londway Capital</title></head>
<body style="margin:0;padding:0;background:#f0eff4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0eff4;padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <!-- Header -->
  <tr><td style="background:#060913;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
    <div style="display:inline-flex;align-items:center;gap:10px;">
      <div style="width:36px;height:36px;border-radius:8px;border:1.5px solid rgba(196,160,82,0.6);display:inline-flex;align-items:center;justify-content:center;">
        <span style="font-size:18px;">&#127963;</span>
      </div>
      <div style="text-align:left;">
        <div style="font-size:17px;font-weight:800;letter-spacing:0.08em;color:#ffffff;">LONDWAY <span style="color:#C4A052;">CAPITAL</span></div>
        <div style="font-size:9px;color:rgba(196,160,82,0.55);letter-spacing:0.18em;margin-top:1px;">PREMIUM PRIVATE BANKING</div>
      </div>
    </div>
    <div style="margin-top:14px;display:inline-block;background:rgba(196,160,82,0.12);border:1px solid rgba(196,160,82,0.22);border-radius:20px;padding:4px 14px;font-size:10px;font-weight:700;color:#C4A052;letter-spacing:0.12em;text-transform:uppercase;">${headerLabel}</div>
  </td></tr>
  <!-- Body -->
  <tr><td style="background:#ffffff;padding:36px 40px;">${body}</td></tr>
  <!-- Footer -->
  <tr><td style="background:#f8f7f4;border-radius:0 0 12px 12px;border-top:1px solid #ede9e0;padding:20px 40px;text-align:center;">
    <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;">&#128274; 256-bit SSL Encryption &nbsp;&middot;&nbsp; FDIC Insured &nbsp;&middot;&nbsp; SOC 2 Type II Certified</p>
    <p style="margin:0;font-size:11px;color:#9ca3af;">&copy; 2026 Londway Capital, Inc. &nbsp;&middot;&nbsp; <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;">support@londwaycapital.com</a></p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

/**
 * Send a verification code email.
 */
export async function sendVerificationCode(
  to: string, code: string, userName?: string
): Promise<{ success: boolean; error?: string }> {
  const firstName = userName ? userName.split(' ')[0] : 'Valued Client';
  const body = `
    <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0d1628;">Hello, ${firstName}</p>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;">We received a request to verify your identity. Enter the code below to continue — it expires in <strong style="color:#0d1628;">10 minutes</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <div style="background:#faf8f4;border:1.5px solid rgba(196,160,82,0.35);border-radius:12px;padding:28px 20px;display:inline-block;min-width:240px;text-align:center;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:#9ca3af;text-transform:uppercase;margin-bottom:10px;">Verification Code</div>
        <div style="font-size:44px;font-weight:800;color:#0d1628;letter-spacing:0.55em;font-family:'Courier New',Courier,monospace;padding-right:0;">${code}</div>
        <div style="margin-top:10px;font-size:12px;color:#C4A052;font-weight:600;">Valid for 10 minutes</div>
      </div>
    </td></tr></table>
    <p style="margin:24px 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">This is a one-time code. <strong style="color:#0d1628;">Do not share it</strong> with anyone — Londway Capital will never ask for your code.</p>
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">Didn't request this? <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;">Contact our security team</a> immediately.</p>`;

  const html = emailWrapper('Security Verification', body);

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: SENDER,
        to: [{ email: to, name: userName || '' }],
        replyTo: { email: 'support@londwaycapital.com', name: 'Londway Capital Support' },
        subject: `${code} is your Londway Capital verification code`,
        htmlContent: html,
        textContent: `Hello ${firstName},\n\nYour Londway Capital verification code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n© 2026 Londway Capital, Inc.`,
      },
      { headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' } }
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.response?.data?.message || error.message };
  }
}

/**
 * Send a welcome email after successful registration.
 */
export async function sendWelcomeEmail(
  to: string, userName: string, accountNumber?: string
): Promise<{ success: boolean; error?: string }> {
  const firstName = userName.split(' ')[0];
  const accNo = accountNumber || `LC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const body = `
    <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0d1628;">Welcome to Londway Capital, ${firstName}</p>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;">Your account has been successfully created and verified. You now have access to our full suite of private banking services.</p>
    <div style="background:#faf8f4;border:1px solid rgba(196,160,82,0.25);border-radius:10px;padding:22px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;font-size:12px;color:#9ca3af;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Account Holder</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#0d1628;text-align:right;">${userName}</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;color:#9ca3af;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Account Reference</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#C4A052;text-align:right;font-family:'Courier New',monospace;">${accNo}</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;color:#9ca3af;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Account Status</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#16a34a;text-align:right;">&#10003; Active &amp; Verified</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;color:#9ca3af;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">KYC Level</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#0d1628;text-align:right;">Full Verification</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://londwaycapital.com" style="display:inline-block;background:linear-gradient(135deg,#C4A052,#a8873e);color:#060913;font-size:14px;font-weight:800;text-decoration:none;border-radius:8px;padding:14px 32px;letter-spacing:0.04em;">Access Your Dashboard &rarr;</a>
    </div>
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">If you have any questions, our private banking team is available 24/7 at <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;">support@londwaycapital.com</a>.</p>`;

  const html = emailWrapper('Account Confirmed', body);
  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: SENDER,
        to: [{ email: to, name: userName }],
        replyTo: { email: 'support@londwaycapital.com', name: 'Londway Capital Support' },
        subject: `Welcome to Londway Capital — Your account is ready`,
        htmlContent: html,
        textContent: `Welcome to Londway Capital, ${firstName}!\n\nYour account has been verified and is ready to use.\nVisit: https://londwaycapital.com\n\n© 2026 Londway Capital, Inc.`,
      },
      { headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' } }
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.response?.data?.message || error.message };
  }
}

/**
 * Send a transfer confirmation email.
 */
export async function sendTransferNotification(
  to: string,
  userName: string,
  ref: string,
  amount: number,
  currency: string,
  recipient: string,
  type: 'local' | 'international',
): Promise<{ success: boolean; error?: string }> {
  const firstName = userName.split(' ')[0];
  const amountFmt = `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const typeLabel = type === 'international' ? 'International Wire Transfer' : 'Domestic Transfer';
  const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

  const body = `
    <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0d1628;">Transfer Submitted</p>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;">Hello ${firstName}, your transfer instruction has been received and is under compliance review. You will be notified once it is processed.</p>
    <div style="background:#faf8f4;border:1px solid rgba(196,160,82,0.25);border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <div style="background:rgba(196,160,82,0.08);padding:12px 20px;border-bottom:1px solid rgba(196,160,82,0.15);">
        <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;color:#C4A052;text-transform:uppercase;">Transfer Details</span>
        <span style="float:right;font-size:11px;color:#9ca3af;">${dateStr}</span>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:4px 0;">
        <tr><td style="padding:10px 20px;font-size:12px;color:#9ca3af;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;width:40%;">Reference</td><td style="padding:10px 20px;font-size:13px;font-weight:800;color:#C4A052;text-align:right;font-family:'Courier New',monospace;">${ref}</td></tr>
        <tr style="background:#fdf9f3;"><td style="padding:10px 20px;font-size:12px;color:#9ca3af;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Recipient</td><td style="padding:10px 20px;font-size:13px;font-weight:600;color:#0d1628;text-align:right;">${recipient}</td></tr>
        <tr><td style="padding:10px 20px;font-size:12px;color:#9ca3af;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Amount</td><td style="padding:10px 20px;font-size:16px;font-weight:800;color:#0d1628;text-align:right;">${amountFmt}</td></tr>
        <tr style="background:#fdf9f3;"><td style="padding:10px 20px;font-size:12px;color:#9ca3af;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Type</td><td style="padding:10px 20px;font-size:13px;color:#6b7280;text-align:right;">${typeLabel}</td></tr>
        <tr><td style="padding:10px 20px;font-size:12px;color:#9ca3af;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Status</td><td style="padding:10px 20px;text-align:right;"><span style="display:inline-block;background:rgba(196,160,82,0.1);border:1px solid rgba(196,160,82,0.3);border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;color:#C4A052;letter-spacing:0.06em;">&#8987; PENDING REVIEW</span></td></tr>
      </table>
    </div>
    <div style="background:#fff8f0;border:1px solid #fde9c3;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;"><strong>What happens next?</strong> Our compliance team reviews all transfers within <strong>1–2 business hours</strong>. For international wires, allow up to 24 hours. You will receive a confirmation email once your transfer is approved and processed.</p>
    </div>
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">If you did not initiate this transfer, contact us immediately at <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;">support@londwaycapital.com</a> or call your relationship manager.</p>`;

  const html = emailWrapper('Transfer Notice', body);
  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: SENDER,
        to: [{ email: to, name: userName }],
        replyTo: { email: 'support@londwaycapital.com', name: 'Londway Capital Support' },
        subject: `Transfer ${ref} received — pending review`,
        htmlContent: html,
        textContent: `Hello ${firstName},\n\nYour transfer of ${amountFmt} to ${recipient} (Ref: ${ref}) has been submitted and is under review.\n\nExpected processing: 1–2 business hours.\n\n© 2026 Londway Capital, Inc.`,
      },
      { headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' } }
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.response?.data?.message || error.message };
  }
}
