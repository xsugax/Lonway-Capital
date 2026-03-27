// ═══════════════════════════════════════════════════════════════════
// LONDWAY CAPITAL — PROFESSIONAL EMAIL SERVICE
// Bank-grade HTML email templates — @emailjs/browser SDK
// ═══════════════════════════════════════════════════════════════════
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_OTP = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_OTP || '';
const EMAILJS_TEMPLATE_WELCOME = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_WELCOME || '';
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

// Initialize EmailJS once
if (typeof window !== 'undefined' && EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

/** Generate a cryptographically secure 6-digit code */
export function generateSecureCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

// ── LC Monogram Logo (inline SVG — no external assets) ──
const LC_LOGO = `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
<td style="width:46px;height:46px;border:2px solid rgba(196,160,82,0.5);border-radius:12px;background:rgba(196,160,82,0.06);text-align:center;vertical-align:middle;font-size:19px;font-weight:bold;color:#C4A052;font-family:Georgia,'Times New Roman',serif;letter-spacing:2px;line-height:46px;">LC</td>
</tr></table>`;

// ── Shared email wrapper with bank-grade header/footer ──
function emailWrapper(headerLabel: string, body: string, preheader?: string): string {
  const yr = new Date().getFullYear();
  const preheaderHtml = preheader ? `<div style="display:none;font-size:1px;color:#f0eff4;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : '';

  return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<title>Londway Capital</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0;mso-table-rspace:0;}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
  body{height:100%!important;margin:0!important;padding:0!important;width:100%!important;}
  a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}
  @media only screen and (max-width:620px){.email-container{width:100%!important;max-width:100%!important;}.fluid{max-width:100%!important;height:auto!important;}.stack-column{display:block!important;width:100%!important;max-width:100%!important;}}
</style></head>
<body style="margin:0;padding:0;background:#EEEDF2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
${preheaderHtml}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEEDF2;">
<tr><td align="center" style="padding:32px 16px 40px;">

<!-- ═══════ EMAIL CONTAINER ═══════ -->
<table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 2px 24px rgba(0,0,0,0.06);">

  <!-- ═══ HEADER — Dark navy with LC monogram ═══ -->
  <tr><td style="background:#0D1628;padding:32px 44px 28px;text-align:center;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
      <td style="vertical-align:middle;padding-right:14px;">${LC_LOGO}</td>
      <td style="vertical-align:middle;text-align:left;">
        <div style="font-size:20px;font-weight:800;letter-spacing:0.06em;color:#FFFFFF;line-height:1.2;">LONDWAY <span style="color:#C4A052;">CAPITAL</span></div>
        <div style="font-size:8px;color:rgba(196,160,82,0.5);letter-spacing:3.5px;text-transform:uppercase;margin-top:3px;font-weight:700;">PREMIUM PRIVATE BANKING</div>
      </td>
    </tr></table>
    <div style="margin-top:18px;">
      <span style="display:inline-block;background:rgba(196,160,82,0.1);border:1px solid rgba(196,160,82,0.2);border-radius:20px;padding:5px 18px;font-size:9px;font-weight:800;color:#C4A052;letter-spacing:1.5px;text-transform:uppercase;">${headerLabel}</span>
    </div>
  </td></tr>

  <!-- ═══ GOLD ACCENT BAR ═══ -->
  <tr><td style="background:linear-gradient(90deg,#C4A052,#D4B76A,#C4A052);height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- ═══ BODY ═══ -->
  <tr><td style="background:#FFFFFF;padding:40px 44px;">${body}</td></tr>

  <!-- ═══ FOOTER — Institutional ═══ -->
  <tr><td style="background:#F8F7F4;border-top:1px solid #EDE9E0;padding:28px 44px 20px;">

    <!-- Security badges row -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding:0 10px;font-size:10px;color:#9CA3AF;font-weight:600;white-space:nowrap;">&#128274; 256-bit SSL</td>
        <td style="padding:0 10px;font-size:10px;color:#9CA3AF;font-weight:600;white-space:nowrap;">&#127970; FDIC Insured</td>
        <td style="padding:0 10px;font-size:10px;color:#9CA3AF;font-weight:600;white-space:nowrap;">&#9989; SOC 2 Type II</td>
        <td style="padding:0 10px;font-size:10px;color:#9CA3AF;font-weight:600;white-space:nowrap;">&#128737; PCI DSS</td>
      </tr></table>
    </td></tr></table>

    <!-- Divider -->
    <div style="height:1px;background:#E5E1D8;margin-bottom:16px;"></div>

    <!-- Bank details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="vertical-align:top;width:50%;padding-right:16px;">
        <div style="font-size:11px;font-weight:800;color:#374151;letter-spacing:0.03em;margin-bottom:5px;">Londway Capital Holdings Ltd.</div>
        <div style="font-size:10px;color:#9CA3AF;line-height:1.7;">
          456 Financial District, Suite 2100<br>
          New York, NY 10005, United States
        </div>
      </td>
      <td style="vertical-align:top;width:50%;text-align:right;">
        <div style="font-size:10px;color:#9CA3AF;line-height:1.7;">
          Tel: <a href="tel:+12125550180" style="color:#9CA3AF;text-decoration:none;">+1 (212) 555-0180</a><br>
          <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">support@londwaycapital.com</a><br>
          <a href="https://londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">londwaycapital.com</a>
        </div>
      </td>
    </tr></table>

    <!-- Regulatory disclaimer -->
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid #E5E1D8;">
      <p style="margin:0 0 8px;font-size:9px;color:#B0ADA6;line-height:1.7;text-align:center;">This email and any attachments are confidential and intended solely for the named recipient. If you have received this email in error, please notify us immediately and delete it. Londway Capital will never ask for your password, PIN, or full card number via email.</p>
      <p style="margin:0;font-size:9px;color:#B0ADA6;line-height:1.7;text-align:center;">
        &copy; ${yr} Londway Capital Holdings Ltd. &middot; Member FDIC &middot; Equal Housing Lender &#127968;<br>
        <a href="https://londwaycapital.com/privacy" style="color:#C4A052;text-decoration:none;font-size:9px;">Privacy Policy</a> &nbsp;&middot;&nbsp;
        <a href="https://londwaycapital.com/terms" style="color:#C4A052;text-decoration:none;font-size:9px;">Terms of Service</a> &nbsp;&middot;&nbsp;
        <a href="https://londwaycapital.com/security" style="color:#C4A052;text-decoration:none;font-size:9px;">Security Center</a>
      </p>
    </div>

  </td></tr>

</table>
<!-- ═══════ /EMAIL CONTAINER ═══════ -->

</td></tr></table>
</body></html>`;
}

/**
 * Send an email via the @emailjs/browser SDK.
 */
async function sendViaEmailJS(
  to: string, toName: string, subject: string, htmlContent: string, templateId: string
): Promise<{ success: boolean; error?: string }> {
  if (!EMAILJS_SERVICE_ID || !templateId || !EMAILJS_PUBLIC_KEY) {
    console.warn(
      '[Londway Email] EmailJS not configured.\n' +
      'Add these four secrets to your GitHub repository → Settings → Secrets → Actions:\n' +
      '  NEXT_PUBLIC_EMAILJS_SERVICE_ID\n' +
      '  NEXT_PUBLIC_EMAILJS_TEMPLATE_OTP\n' +
      '  NEXT_PUBLIC_EMAILJS_TEMPLATE_WELCOME\n' +
      '  NEXT_PUBLIC_EMAILJS_PUBLIC_KEY\n' +
      'Then re-run the deploy workflow to bake them into the build.',
    );
    return { success: false, error: 'Email service not configured' };
  }
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    await emailjs.send(EMAILJS_SERVICE_ID, templateId, {
      to_email: to,
      to_name: toName,
      from_name: 'Londway Capital',
      subject,
      html_content: htmlContent,
      reply_to: 'support@londwaycapital.com',
    });
    console.info(`[Londway Email] ✓ Sent "${subject}" → ${to}`);
    return { success: true };
  } catch (error: any) {
    const msg = error?.text || error?.message || 'Email sending failed';
    console.error(`[Londway Email] ✗ Failed "${subject}" → ${to}:`, msg);
    return { success: false, error: msg };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════

/**
 * Send a verification code email.
 */
export async function sendVerificationCode(
  to: string, code: string, userName?: string
): Promise<{ success: boolean; error?: string }> {
  const firstName = userName ? userName.split(' ')[0] : 'Valued Client';

  const body = `
    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Security Verification</p>
    <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0D1628;">Hello, ${firstName}</p>
    <p style="margin:0 0 28px;font-size:14px;color:#6B7280;line-height:1.7;">We received a request to verify your identity. Enter the security code below to continue — it expires in <strong style="color:#0D1628;">10 minutes</strong>.</p>

    <!-- OTP Code Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:#FAF8F4;border:2px solid rgba(196,160,82,0.3);border-radius:14px;overflow:hidden;">
        <tr><td style="padding:28px 40px 8px;text-align:center;">
          <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#C4A052;text-transform:uppercase;margin-bottom:12px;">One-Time Security Code</div>
          <div style="font-size:48px;font-weight:900;color:#0D1628;letter-spacing:12px;font-family:'Courier New',Courier,monospace;line-height:1;">${code}</div>
        </td></tr>
        <tr><td style="padding:12px 40px 24px;text-align:center;">
          <div style="display:inline-block;background:rgba(196,160,82,0.1);border-radius:20px;padding:4px 16px;">
            <span style="font-size:11px;color:#C4A052;font-weight:700;">&#9201; Valid for 10 minutes</span>
          </div>
        </td></tr>
      </table>
    </td></tr></table>

    <!-- Security Warning -->
    <div style="margin-top:28px;background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:16px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:top;padding-right:10px;font-size:16px;">&#128274;</td>
        <td>
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#92400E;">Security Notice</p>
          <p style="margin:0;font-size:12px;color:#92400E;line-height:1.6;">This is a one-time code. <strong>Do not share it</strong> with anyone — Londway Capital will never ask for your verification code by phone, email, or text.</p>
        </td>
      </tr></table>
    </div>

    <p style="margin:20px 0 0;font-size:11px;color:#9CA3AF;line-height:1.6;text-align:center;">Didn't request this code? <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">Contact our security team</a> immediately.</p>`;

  const html = emailWrapper('Security Verification', body, `${code} is your Londway Capital verification code. Do not share this code.`);
  const subject = `${code} — Your Londway Capital Verification Code`;
  return sendViaEmailJS(to, userName || '', subject, html, EMAILJS_TEMPLATE_OTP);
}

/**
 * Send a welcome email after successful registration.
 */
export async function sendWelcomeEmail(
  to: string, userName: string, accountNumber?: string
): Promise<{ success: boolean; error?: string }> {
  const firstName = userName.split(' ')[0];
  const accNo = accountNumber || `LC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const body = `
    <!-- Welcome hero -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#ECFDF5;border:2px solid #86EFAC;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:14px;">&#10003;</div>
      <p style="margin:0 0 4px;font-size:24px;font-weight:900;color:#0D1628;">Welcome to Londway Capital</p>
      <p style="margin:0;font-size:14px;color:#6B7280;">Your premier private banking experience begins today.</p>
    </div>

    <!-- Greeting -->
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">Dear ${firstName}, thank you for choosing Londway Capital. Your account has been successfully created, verified, and is now fully active. You have access to our complete suite of private banking services.</p>

    <!-- Account Details Card -->
    <div style="background:#FAF8F4;border:1px solid #E5E1D8;border-radius:12px;overflow:hidden;margin-bottom:28px;">
      <div style="background:#0D1628;padding:12px 24px;">
        <span style="font-size:10px;font-weight:800;letter-spacing:2px;color:#C4A052;text-transform:uppercase;">Your Account Summary</span>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;width:45%;border-bottom:1px solid #EDE9E0;">Account Holder</td><td style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${userName}</td></tr>
        <tr style="background:#FDFBF6;"><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Account Reference</td><td style="padding:14px 24px;font-size:14px;font-weight:800;color:#C4A052;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #EDE9E0;">${accNo}</td></tr>
        <tr><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Account Type</td><td style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">Premium Checking</td></tr>
        <tr style="background:#FDFBF6;"><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Account Status</td><td style="padding:14px 24px;font-size:13px;font-weight:800;color:#16A34A;text-align:right;border-bottom:1px solid #EDE9E0;">&#10003; Active &amp; Verified</td></tr>
        <tr><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">KYC Level</td><td style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">Full Verification</td></tr>
        <tr style="background:#FDFBF6;"><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Date Opened</td><td style="padding:14px 24px;font-size:13px;font-weight:600;color:#6B7280;text-align:right;">${dateStr}</td></tr>
      </table>
    </div>

    <!-- What's available -->
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:18px 22px;margin-bottom:28px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:800;color:#15803D;letter-spacing:0.5px;text-transform:uppercase;">What You Can Do Now</p>
      <p style="margin:0;font-size:13px;color:#15803D;line-height:1.8;">
        &#8226; Fund your account via domestic or international transfer<br>
        &#8226; Send & receive wire transfers worldwide<br>
        &#8226; Manage investments, vaults, and crypto deposits<br>
        &#8226; Access real-time financial insights and health scores<br>
        &#8226; Download professional account statements (PDF & CSV)
      </p>
    </div>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:24px;">
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://londwaycapital.com" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="17%" stroke="f" fillcolor="#C4A052"><w:anchorlock/><center style="color:#060913;font-family:Helvetica,sans-serif;font-size:14px;font-weight:bold;">Access Your Dashboard &rarr;</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <a href="https://londwaycapital.com" style="display:inline-block;background:linear-gradient(135deg,#C4A052,#A8873E);color:#060913;font-size:14px;font-weight:800;text-decoration:none;border-radius:10px;padding:14px 36px;letter-spacing:0.04em;box-shadow:0 2px 8px rgba(196,160,82,0.3);">Access Your Dashboard &rarr;</a>
      <!--<![endif]-->
    </td></tr></table>

    <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6;text-align:center;">Your dedicated private banking team is available 24/7 at <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">support@londwaycapital.com</a> or <a href="tel:+12125550180" style="color:#C4A052;text-decoration:none;font-weight:600;">+1 (212) 555-0180</a>.</p>`;

  const html = emailWrapper('Account Confirmed', body, `Welcome to Londway Capital, ${firstName}. Your account ${accNo} is now active and verified.`);
  const subject = `Welcome to Londway Capital — Your Account is Ready`;
  return sendViaEmailJS(to, userName, subject, html, EMAILJS_TEMPLATE_WELCOME);
}

/**
 * Send a transfer confirmation email (pending review).
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
  const typeLabel = type === 'international' ? 'International Wire Transfer' : 'Domestic ACH Transfer';
  const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

  const body = `
    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:rgba(196,160,82,0.08);border:2px solid rgba(196,160,82,0.25);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:24px;margin-bottom:14px;">&#128176;</div>
      <p style="margin:0 0 4px;font-size:22px;font-weight:900;color:#0D1628;">Transfer Submitted</p>
      <p style="margin:0;font-size:14px;color:#6B7280;">Your transfer instruction has been received.</p>
    </div>

    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">Dear ${firstName}, we have received your transfer instruction and it is currently under compliance review. You will be notified once it has been processed.</p>

    <!-- Amount Highlight -->
    <div style="text-align:center;background:#FAF8F4;border:2px solid rgba(196,160,82,0.25);border-radius:14px;padding:24px 20px;margin-bottom:24px;">
      <div style="font-size:9px;font-weight:800;color:#9CA3AF;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Transfer Amount</div>
      <div style="font-size:36px;font-weight:900;color:#0D1628;letter-spacing:0.02em;line-height:1;">${amountFmt}</div>
      <div style="margin-top:8px;font-size:12px;color:#6B7280;font-weight:600;">${typeLabel}</div>
    </div>

    <!-- Transfer Details Card -->
    <div style="background:#FAF8F4;border:1px solid #E5E1D8;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div style="background:#0D1628;padding:12px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="font-size:10px;font-weight:800;letter-spacing:2px;color:#C4A052;text-transform:uppercase;">Transfer Details</td>
          <td style="font-size:10px;color:rgba(255,255,255,0.4);text-align:right;">${dateStr}</td>
        </tr></table>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;width:40%;border-bottom:1px solid #EDE9E0;">Reference</td><td style="padding:14px 24px;font-size:14px;font-weight:800;color:#C4A052;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #EDE9E0;">${ref}</td></tr>
        <tr style="background:#FDFBF6;"><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Recipient</td><td style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${recipient}</td></tr>
        <tr><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Amount</td><td style="padding:14px 24px;font-size:16px;font-weight:800;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${amountFmt}</td></tr>
        <tr style="background:#FDFBF6;"><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Type</td><td style="padding:14px 24px;font-size:13px;color:#6B7280;font-weight:600;text-align:right;border-bottom:1px solid #EDE9E0;">${typeLabel}</td></tr>
        <tr><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Status</td><td style="padding:14px 24px;text-align:right;"><span style="display:inline-block;background:rgba(196,160,82,0.1);border:1px solid rgba(196,160,82,0.3);border-radius:20px;padding:5px 14px;font-size:10px;font-weight:800;color:#C4A052;letter-spacing:0.5px;">&#9202; PENDING REVIEW</span></td></tr>
      </table>
    </div>

    <!-- What Happens Next -->
    <div style="background:#FFF8F0;border:1px solid #FDE9C3;border-radius:10px;padding:18px 22px;margin-bottom:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:top;padding-right:10px;font-size:16px;">&#128337;</td>
        <td>
          <p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#92400E;letter-spacing:0.3px;">What Happens Next?</p>
          <p style="margin:0;font-size:12px;color:#92400E;line-height:1.7;">Our compliance team reviews all transfers within <strong>1–2 business hours</strong>. For international wires, allow up to <strong>24 hours</strong>. You will receive a confirmation email and in-app notification once your transfer is approved and processed.</p>
        </td>
      </tr></table>
    </div>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:20px;">
      <a href="https://londwaycapital.com/transfer" style="display:inline-block;background:linear-gradient(135deg,#C4A052,#A8873E);color:#060913;font-size:13px;font-weight:800;text-decoration:none;border-radius:10px;padding:13px 32px;letter-spacing:0.04em;box-shadow:0 2px 8px rgba(196,160,82,0.3);">Track Your Transfer &rarr;</a>
    </td></tr></table>

    <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6;text-align:center;">If you did not initiate this transfer, contact us immediately at <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">support@londwaycapital.com</a> or call <a href="tel:+12125550180" style="color:#C4A052;text-decoration:none;font-weight:600;">+1 (212) 555-0180</a>.</p>`;

  const html = emailWrapper('Transfer Notice', body, `Transfer ${ref} for ${amountFmt} to ${recipient} is pending compliance review.`);
  const subject = `Transfer ${ref} Received — Pending Review | Londway Capital`;
  return sendViaEmailJS(to, userName, subject, html, EMAILJS_TEMPLATE_WELCOME);
}

/**
 * Send a professional transfer receipt email.
 */
export async function sendTransferReceipt(
  to: string,
  userName: string,
  ref: string,
  amount: number,
  currency: string,
  recipient: string,
  type: 'local' | 'international',
  account?: string,
): Promise<{ success: boolean; error?: string }> {
  const firstName = userName.split(' ')[0];
  const amountFmt = `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const typeLabel = type === 'international' ? 'International Wire Transfer' : 'Domestic ACH Transfer';
  const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
  const receiptNo = `RCT-${Date.now().toString(36).toUpperCase().slice(-8)}`;

  const body = `
    <!-- Success Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#ECFDF5;border:2px solid #86EFAC;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:14px;">&#10003;</div>
      <p style="margin:0 0 4px;font-size:24px;font-weight:900;color:#0D1628;">Transfer Successful</p>
      <p style="margin:0;font-size:14px;color:#6B7280;">Your transfer has been processed and completed.</p>
    </div>

    <!-- Amount Highlight -->
    <div style="text-align:center;background:#FAF8F4;border:2px solid rgba(196,160,82,0.25);border-radius:14px;padding:26px 20px;margin-bottom:28px;">
      <div style="font-size:9px;font-weight:800;color:#9CA3AF;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Amount Transferred</div>
      <div style="font-size:38px;font-weight:900;color:#0D1628;letter-spacing:0.02em;line-height:1;">${amountFmt}</div>
      <div style="margin-top:10px;font-size:12px;color:#6B7280;font-weight:600;">${typeLabel}</div>
    </div>

    <!-- Receipt Details Card -->
    <div style="background:#FAF8F4;border:1px solid #E5E1D8;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div style="background:#0D1628;padding:12px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="font-size:10px;font-weight:800;letter-spacing:2px;color:#C4A052;text-transform:uppercase;">Transfer Receipt</td>
          <td style="font-size:10px;color:rgba(255,255,255,0.4);text-align:right;">${dateStr}</td>
        </tr></table>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;width:40%;border-bottom:1px solid #EDE9E0;">Receipt No.</td><td style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #EDE9E0;">${receiptNo}</td></tr>
        <tr style="background:#FDFBF6;"><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Reference</td><td style="padding:14px 24px;font-size:14px;font-weight:800;color:#C4A052;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #EDE9E0;">${ref}</td></tr>
        <tr><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Sender</td><td style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${userName}</td></tr>
        <tr style="background:#FDFBF6;"><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Recipient</td><td style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${recipient}</td></tr>
        ${account ? `<tr><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Recipient Account</td><td style="padding:14px 24px;font-size:13px;color:#6B7280;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #EDE9E0;">${account}</td></tr>` : ''}
        <tr${account ? ' style="background:#FDFBF6;"' : ''}><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Amount</td><td style="padding:14px 24px;font-size:16px;font-weight:800;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${amountFmt}</td></tr>
        <tr style="background:#FDFBF6;"><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Type</td><td style="padding:14px 24px;font-size:13px;color:#6B7280;font-weight:600;text-align:right;border-bottom:1px solid #EDE9E0;">${typeLabel}</td></tr>
        <tr><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Date &amp; Time</td><td style="padding:14px 24px;font-size:13px;color:#6B7280;text-align:right;border-bottom:1px solid #EDE9E0;">${dateStr}</td></tr>
        <tr style="background:#FDFBF6;"><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Status</td><td style="padding:14px 24px;text-align:right;"><span style="display:inline-block;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:20px;padding:5px 14px;font-size:10px;font-weight:800;color:#16A34A;letter-spacing:0.5px;">&#10003; COMPLETED</span></td></tr>
      </table>
    </div>

    <!-- Confirmation Note -->
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#15803D;line-height:1.7;">Dear ${firstName}, this receipt confirms your transfer of <strong>${amountFmt}</strong> to <strong>${recipient}</strong> has been successfully processed. Please retain this receipt for your records.</p>
    </div>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:20px;">
      <a href="https://londwaycapital.com/transfer" style="display:inline-block;background:linear-gradient(135deg,#C4A052,#A8873E);color:#060913;font-size:13px;font-weight:800;text-decoration:none;border-radius:10px;padding:13px 32px;letter-spacing:0.04em;box-shadow:0 2px 8px rgba(196,160,82,0.3);">View Transfer History &rarr;</a>
    </td></tr></table>

    <p style="margin:0;font-size:10px;color:#9CA3AF;line-height:1.6;text-align:center;">This is an automated receipt from Londway Capital. For questions about this transfer, contact <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">support@londwaycapital.com</a>.</p>`;

  const html = emailWrapper('Transfer Receipt', body, `Receipt: ${amountFmt} to ${recipient}. Ref: ${ref}. Transfer processed successfully.`);
  const subject = `Receipt: ${amountFmt} to ${recipient} — ${ref} | Londway Capital`;
  return sendViaEmailJS(to, userName, subject, html, EMAILJS_TEMPLATE_WELCOME);
}
