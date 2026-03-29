// ═══════════════════════════════════════════════════════════════════
// LONDWAY CAPITAL — EXTRAORDINARY EMAIL SERVICE
// Bank-grade HTML emails with dark mode, animations, device
// fingerprinting, time-aware greetings — @emailjs/browser SDK
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

/** Time-of-day greeting — "Good morning", "Good afternoon", "Good evening" */
function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Generate a short device fingerprint from user agent */
export function getDeviceInfo(): { browser: string; os: string; summary: string } {
  if (typeof navigator === 'undefined') return { browser: 'Unknown', os: 'Unknown', summary: 'Unknown Device' };
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/') && !ua.includes('Chromium/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

  let os = 'Unknown OS';
  if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os, summary: `${browser} on ${os}` };
}

/** Generate a session security hash for audit display */
function securityHash(): string {
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ── LC Monogram Logo (inline HTML — no external assets) ──
const LC_LOGO = `<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
<td style="width:46px;height:46px;border:2px solid rgba(196,160,82,0.5);border-radius:12px;background:rgba(196,160,82,0.06);text-align:center;vertical-align:middle;font-size:19px;font-weight:bold;color:#C4A052;font-family:Georgia,'Times New Roman',serif;letter-spacing:2px;line-height:46px;">LC</td>
</tr></table>`;

// ── Shared email wrapper with dark mode, animations, institutional footer ──
function emailWrapper(headerLabel: string, body: string, preheader?: string): string {
  const yr = new Date().getFullYear();
  const preheaderHtml = preheader ? `<div style="display:none;font-size:1px;color:#f0eff4;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : '';

  return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Londway Capital</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  :root{color-scheme:light dark;supported-color-schemes:light dark;}
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0;mso-table-rspace:0;}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
  body{height:100%!important;margin:0!important;padding:0!important;width:100%!important;}
  a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}

  /* ── Gold shimmer animation (Apple Mail, iOS Mail, some Android) ── */
  @keyframes goldShimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
  @-webkit-keyframes goldShimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
  .lc-accent-bar{
    background:linear-gradient(90deg,#C4A052 0%,#D4B76A 25%,#F5E6B8 50%,#D4B76A 75%,#C4A052 100%);
    background-size:200% 100%;
    -webkit-animation:goldShimmer 3s ease-in-out infinite;
    animation:goldShimmer 3s ease-in-out infinite;
  }

  /* ── Pulse animation for security badges ── */
  @keyframes subtlePulse{0%,100%{opacity:1;}50%{opacity:0.7;}}
  .lc-live-badge{-webkit-animation:subtlePulse 2s ease-in-out infinite;animation:subtlePulse 2s ease-in-out infinite;}

  /* ── Dark mode support (Apple Mail, Outlook.com, Hey, Fastmail) ── */
  @media (prefers-color-scheme:dark){
    .lc-body-bg{background:#0B0F1A!important;}
    .lc-card-bg{background:#111827!important;}
    .lc-card-body{background:#1A1F2E!important;color:#E5E7EB!important;}
    .lc-footer-bg{background:#0F1420!important;border-color:#1F2937!important;}
    .lc-text-primary{color:#F3F4F6!important;}
    .lc-text-secondary{color:#9CA3AF!important;}
    .lc-text-muted{color:#6B7280!important;}
    .lc-info-card{background:#1E293B!important;border-color:#334155!important;}
    .lc-detail-row{border-color:#1F2937!important;}
    .lc-detail-alt{background:#111827!important;}
    .lc-detail-header{background:#060A14!important;}
    .lc-divider{background:#1F2937!important;}
    .lc-warn-card{background:#422006!important;border-color:#78350F!important;}
    .lc-warn-text{color:#FCD34D!important;}
    .lc-success-card{background:#052E16!important;border-color:#14532D!important;}
    .lc-success-text{color:#86EFAC!important;}
    .lc-disclaimer{color:#4B5563!important;}
    .lc-badge-text{color:#6B7280!important;}
  }

  /* ── Responsive ── */
  @media only screen and (max-width:620px){
    .email-container{width:100%!important;max-width:100%!important;}
    .fluid{max-width:100%!important;height:auto!important;}
    .stack-column{display:block!important;width:100%!important;max-width:100%!important;}
    .lc-pad{padding-left:24px!important;padding-right:24px!important;}
  }
</style></head>
<body class="lc-body-bg" style="margin:0;padding:0;background:#EEEDF2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
${preheaderHtml}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="lc-body-bg" style="background:#EEEDF2;">
<tr><td align="center" style="padding:32px 16px 40px;">

<!-- ═══════ EMAIL CONTAINER ═══════ -->
<table role="presentation" class="email-container lc-card-bg" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08);background:#FFFFFF;">

  <!-- ═══ HEADER — Dark navy with LC monogram ═══ -->
  <tr><td style="background:#0D1628;padding:32px 44px 28px;text-align:center;" class="lc-pad">
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

  <!-- ═══ ANIMATED GOLD ACCENT BAR ═══ -->
  <tr><td class="lc-accent-bar" style="background:linear-gradient(90deg,#C4A052,#D4B76A,#C4A052);height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- ═══ BODY ═══ -->
  <tr><td class="lc-card-body lc-pad" style="background:#FFFFFF;padding:40px 44px;">${body}</td></tr>

  <!-- ═══ FOOTER — Institutional ═══ -->
  <tr><td class="lc-footer-bg lc-pad" style="background:#F8F7F4;border-top:1px solid #EDE9E0;padding:28px 44px 20px;">

    <!-- Security badges row -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td class="lc-badge-text" style="padding:0 10px;font-size:10px;color:#9CA3AF;font-weight:600;white-space:nowrap;">&#128274; 256-bit SSL</td>
        <td class="lc-badge-text" style="padding:0 10px;font-size:10px;color:#9CA3AF;font-weight:600;white-space:nowrap;">&#127970; FDIC Insured</td>
        <td class="lc-badge-text" style="padding:0 10px;font-size:10px;color:#9CA3AF;font-weight:600;white-space:nowrap;">&#9989; SOC 2 Type II</td>
        <td class="lc-badge-text" style="padding:0 10px;font-size:10px;color:#9CA3AF;font-weight:600;white-space:nowrap;">&#128737; PCI DSS</td>
      </tr></table>
    </td></tr></table>

    <!-- Divider -->
    <div class="lc-divider" style="height:1px;background:#E5E1D8;margin-bottom:16px;"></div>

    <!-- Bank details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="vertical-align:top;width:50%;padding-right:16px;">
        <div class="lc-text-primary" style="font-size:11px;font-weight:800;color:#374151;letter-spacing:0.03em;margin-bottom:5px;">Londway Capital Holdings Ltd.</div>
        <div class="lc-text-muted" style="font-size:10px;color:#9CA3AF;line-height:1.7;">
          456 Financial District, Suite 2100<br>
          New York, NY 10005, United States
        </div>
      </td>
      <td style="vertical-align:top;width:50%;text-align:right;">
        <div class="lc-text-muted" style="font-size:10px;color:#9CA3AF;line-height:1.7;">
          Tel: <a href="tel:+12125550180" style="color:#9CA3AF;text-decoration:none;">+1 (212) 555-0180</a><br>
          <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">support@londwaycapital.com</a><br>
          <a href="https://londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">londwaycapital.com</a>
        </div>
      </td>
    </tr></table>

    <!-- Regulatory disclaimer -->
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid #E5E1D8;" class="lc-divider">
      <p class="lc-disclaimer" style="margin:0 0 8px;font-size:9px;color:#B0ADA6;line-height:1.7;text-align:center;">This email and any attachments are confidential and intended solely for the named recipient. If you have received this email in error, please notify us immediately and delete it. Londway Capital will never ask for your password, PIN, or full card number via email.</p>
      <p class="lc-disclaimer" style="margin:0;font-size:9px;color:#B0ADA6;line-height:1.7;text-align:center;">
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
    // Generate plain text fallback for better deliverability
    const textContent = htmlContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&middot;/g, '·')
      .replace(/&copy;/g, '©')
      .replace(/&rarr;/g, '→')
      .replace(/&#\d+;/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 2000);
    await emailjs.send(EMAILJS_SERVICE_ID, templateId, {
      to_email: to,
      to_name: toName,
      from_name: 'Londway Capital',
      subject,
      html_content: htmlContent,
      text_content: textContent,
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
// EMAIL TEMPLATES — Existing (Enhanced) + New Extraordinary Templates
// ═══════════════════════════════════════════════════════════════════

/**
 * Send a verification code email.
 */
export async function sendVerificationCode(
  to: string, code: string, userName?: string
): Promise<{ success: boolean; error?: string }> {
  const firstName = userName ? userName.split(' ')[0] : 'Valued Client';
  const greeting = timeGreeting();

  const body = `
    <p class="lc-text-secondary" style="margin:0 0 4px;font-size:14px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Security Verification</p>
    <p class="lc-text-primary" style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0D1628;">${greeting}, ${firstName}</p>
    <p class="lc-text-secondary" style="margin:0 0 28px;font-size:14px;color:#6B7280;line-height:1.7;">We received a request to verify your identity. Enter the security code below to continue — it expires in <strong class="lc-text-primary" style="color:#0D1628;">10 minutes</strong>.</p>

    <!-- OTP Code Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="lc-info-card" style="background:#FAF8F4;border:2px solid rgba(196,160,82,0.3);border-radius:14px;overflow:hidden;">
        <tr><td style="padding:28px 40px 8px;text-align:center;">
          <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#C4A052;text-transform:uppercase;margin-bottom:12px;">One-Time Security Code</div>
          <div class="lc-text-primary" style="font-size:48px;font-weight:900;color:#0D1628;letter-spacing:12px;font-family:'Courier New',Courier,monospace;line-height:1;">${code}</div>
        </td></tr>
        <tr><td style="padding:12px 40px 24px;text-align:center;">
          <div class="lc-live-badge" style="display:inline-block;background:rgba(196,160,82,0.1);border-radius:20px;padding:4px 16px;">
            <span style="font-size:11px;color:#C4A052;font-weight:700;">&#9201; Valid for 10 minutes</span>
          </div>
        </td></tr>
      </table>
    </td></tr></table>

    <!-- Security Warning -->
    <div class="lc-warn-card" style="margin-top:28px;background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:16px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:top;padding-right:10px;font-size:16px;">&#128274;</td>
        <td>
          <p class="lc-warn-text" style="margin:0 0 4px;font-size:12px;font-weight:700;color:#92400E;">Security Notice</p>
          <p class="lc-warn-text" style="margin:0;font-size:12px;color:#92400E;line-height:1.6;">This is a one-time code. <strong>Do not share it</strong> with anyone — Londway Capital will never ask for your verification code by phone, email, or text.</p>
        </td>
      </tr></table>
    </div>

    <p class="lc-text-muted" style="margin:20px 0 0;font-size:11px;color:#9CA3AF;line-height:1.6;text-align:center;">Didn't request this code? <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">Contact our security team</a> immediately.</p>`;

  const html = emailWrapper('Security Verification', body, `${code} is your Londway Capital verification code. Do not share this code.`);
  const subject = `${code} is your Londway Capital verification code`;
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
      <p class="lc-text-primary" style="margin:0 0 4px;font-size:24px;font-weight:900;color:#0D1628;">Welcome to Londway Capital</p>
      <p class="lc-text-secondary" style="margin:0;font-size:14px;color:#6B7280;">Your premier private banking experience begins today.</p>
    </div>

    <!-- Greeting -->
    <p class="lc-text-primary" style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">Dear ${firstName}, thank you for choosing Londway Capital. Your account has been successfully created, verified, and is now fully active. You have access to our complete suite of private banking services.</p>

    <!-- Account Details Card -->
    <div class="lc-info-card" style="background:#FAF8F4;border:1px solid #E5E1D8;border-radius:12px;overflow:hidden;margin-bottom:28px;">
      <div class="lc-detail-header" style="background:#0D1628;padding:12px 24px;">
        <span style="font-size:10px;font-weight:800;letter-spacing:2px;color:#C4A052;text-transform:uppercase;">Your Account Summary</span>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;width:45%;border-bottom:1px solid #EDE9E0;">Account Holder</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${userName}</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Account Reference</td><td class="lc-detail-row" style="padding:14px 24px;font-size:14px;font-weight:800;color:#C4A052;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #EDE9E0;">${accNo}</td></tr>
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Account Type</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">Premium Checking</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Account Status</td><td class="lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:800;color:#16A34A;text-align:right;border-bottom:1px solid #EDE9E0;">&#10003; Active &amp; Verified</td></tr>
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">KYC Level</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">Full Verification</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Date Opened</td><td class="lc-text-secondary" style="padding:14px 24px;font-size:13px;font-weight:600;color:#6B7280;text-align:right;">${dateStr}</td></tr>
      </table>
    </div>

    <!-- What's available -->
    <div class="lc-success-card" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:18px 22px;margin-bottom:28px;">
      <p class="lc-success-text" style="margin:0 0 8px;font-size:12px;font-weight:800;color:#15803D;letter-spacing:0.5px;text-transform:uppercase;">What You Can Do Now</p>
      <p class="lc-success-text" style="margin:0;font-size:13px;color:#15803D;line-height:1.8;">
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

    <p class="lc-text-muted" style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6;text-align:center;">Your dedicated private banking team is available 24/7 at <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">support@londwaycapital.com</a> or <a href="tel:+12125550180" style="color:#C4A052;text-decoration:none;font-weight:600;">+1 (212) 555-0180</a>.</p>`;

  const html = emailWrapper('Account Confirmed', body, `Welcome to Londway Capital, ${firstName}. Your account ${accNo} is now active and verified.`);
  const subject = `Welcome to Londway Capital — your account is ready`;
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
      <p class="lc-text-primary" style="margin:0 0 4px;font-size:22px;font-weight:900;color:#0D1628;">Transfer Submitted</p>
      <p class="lc-text-secondary" style="margin:0;font-size:14px;color:#6B7280;">Your transfer instruction has been received.</p>
    </div>

    <p class="lc-text-primary" style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">Dear ${firstName}, we have received your transfer instruction and it is currently under compliance review. You will be notified once it has been processed.</p>

    <!-- Amount Highlight -->
    <div class="lc-info-card" style="text-align:center;background:#FAF8F4;border:2px solid rgba(196,160,82,0.25);border-radius:14px;padding:24px 20px;margin-bottom:24px;">
      <div class="lc-text-muted" style="font-size:9px;font-weight:800;color:#9CA3AF;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Transfer Amount</div>
      <div class="lc-text-primary" style="font-size:36px;font-weight:900;color:#0D1628;letter-spacing:0.02em;line-height:1;">${amountFmt}</div>
      <div class="lc-text-secondary" style="margin-top:8px;font-size:12px;color:#6B7280;font-weight:600;">${typeLabel}</div>
    </div>

    <!-- Transfer Details Card -->
    <div class="lc-info-card" style="background:#FAF8F4;border:1px solid #E5E1D8;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div class="lc-detail-header" style="background:#0D1628;padding:12px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="font-size:10px;font-weight:800;letter-spacing:2px;color:#C4A052;text-transform:uppercase;">Transfer Details</td>
          <td style="font-size:10px;color:rgba(255,255,255,0.4);text-align:right;">${dateStr}</td>
        </tr></table>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;width:40%;border-bottom:1px solid #EDE9E0;">Reference</td><td class="lc-detail-row" style="padding:14px 24px;font-size:14px;font-weight:800;color:#C4A052;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #EDE9E0;">${ref}</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Recipient</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${recipient}</td></tr>
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Amount</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:16px;font-weight:800;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${amountFmt}</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Type</td><td class="lc-text-secondary lc-detail-row" style="padding:14px 24px;font-size:13px;color:#6B7280;font-weight:600;text-align:right;border-bottom:1px solid #EDE9E0;">${typeLabel}</td></tr>
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Status</td><td class="lc-detail-row" style="padding:14px 24px;text-align:right;"><span class="lc-live-badge" style="display:inline-block;background:rgba(196,160,82,0.1);border:1px solid rgba(196,160,82,0.3);border-radius:20px;padding:5px 14px;font-size:10px;font-weight:800;color:#C4A052;letter-spacing:0.5px;">&#9202; PENDING REVIEW</span></td></tr>
      </table>
    </div>

    <!-- What Happens Next -->
    <div class="lc-warn-card" style="background:#FFF8F0;border:1px solid #FDE9C3;border-radius:10px;padding:18px 22px;margin-bottom:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:top;padding-right:10px;font-size:16px;">&#128337;</td>
        <td>
          <p class="lc-warn-text" style="margin:0 0 4px;font-size:12px;font-weight:800;color:#92400E;letter-spacing:0.3px;">What Happens Next?</p>
          <p class="lc-warn-text" style="margin:0;font-size:12px;color:#92400E;line-height:1.7;">Our compliance team reviews all transfers within <strong>1–2 business hours</strong>. For international wires, allow up to <strong>24 hours</strong>. You will receive a confirmation email and in-app notification once your transfer is approved and processed.</p>
        </td>
      </tr></table>
    </div>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:20px;">
      <a href="https://londwaycapital.com/transfer#history" style="display:inline-block;background:linear-gradient(135deg,#C4A052,#A8873E);color:#060913;font-size:13px;font-weight:800;text-decoration:none;border-radius:10px;padding:13px 32px;letter-spacing:0.04em;box-shadow:0 2px 8px rgba(196,160,82,0.3);">Track Your Transfer &rarr;</a>
    </td></tr></table>

    <p class="lc-text-muted" style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6;text-align:center;">If you did not initiate this transfer, contact us immediately at <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">support@londwaycapital.com</a> or call <a href="tel:+12125550180" style="color:#C4A052;text-decoration:none;font-weight:600;">+1 (212) 555-0180</a>.</p>`;

  const html = emailWrapper('Transfer Notice', body, `Transfer ${ref} for ${amountFmt} to ${recipient} is pending compliance review.`);
  const subject = `Transfer ${ref} received — pending review`;
  return sendViaEmailJS(to, userName, subject, html, EMAILJS_TEMPLATE_WELCOME);
}

/**
 * Send a professional transfer receipt email with security hash.
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
  const verifyHash = securityHash();

  const body = `
    <!-- Success Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#ECFDF5;border:2px solid #86EFAC;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:14px;">&#10003;</div>
      <p class="lc-text-primary" style="margin:0 0 4px;font-size:24px;font-weight:900;color:#0D1628;">Transfer Successful</p>
      <p class="lc-text-secondary" style="margin:0;font-size:14px;color:#6B7280;">Your transfer has been processed and completed.</p>
    </div>

    <!-- Amount Highlight -->
    <div class="lc-info-card" style="text-align:center;background:#FAF8F4;border:2px solid rgba(196,160,82,0.25);border-radius:14px;padding:26px 20px;margin-bottom:28px;">
      <div class="lc-text-muted" style="font-size:9px;font-weight:800;color:#9CA3AF;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Amount Transferred</div>
      <div class="lc-text-primary" style="font-size:38px;font-weight:900;color:#0D1628;letter-spacing:0.02em;line-height:1;">${amountFmt}</div>
      <div class="lc-text-secondary" style="margin-top:10px;font-size:12px;color:#6B7280;font-weight:600;">${typeLabel}</div>
    </div>

    <!-- Receipt Details Card -->
    <div class="lc-info-card" style="background:#FAF8F4;border:1px solid #E5E1D8;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div class="lc-detail-header" style="background:#0D1628;padding:12px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="font-size:10px;font-weight:800;letter-spacing:2px;color:#C4A052;text-transform:uppercase;">Transfer Receipt</td>
          <td style="font-size:10px;color:rgba(255,255,255,0.4);text-align:right;">${dateStr}</td>
        </tr></table>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;width:40%;border-bottom:1px solid #EDE9E0;">Receipt No.</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #EDE9E0;">${receiptNo}</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Reference</td><td class="lc-detail-row" style="padding:14px 24px;font-size:14px;font-weight:800;color:#C4A052;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #EDE9E0;">${ref}</td></tr>
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Sender</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${userName}</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Recipient</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${recipient}</td></tr>
        ${account ? `<tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Recipient Account</td><td class="lc-text-secondary lc-detail-row" style="padding:14px 24px;font-size:13px;color:#6B7280;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #EDE9E0;">${account}</td></tr>` : ''}
        <tr${account ? ' class="lc-detail-alt" style="background:#FDFBF6;"' : ''}><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Amount</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:16px;font-weight:800;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${amountFmt}</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Type</td><td class="lc-text-secondary lc-detail-row" style="padding:14px 24px;font-size:13px;color:#6B7280;font-weight:600;text-align:right;border-bottom:1px solid #EDE9E0;">${typeLabel}</td></tr>
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Date &amp; Time</td><td class="lc-text-secondary lc-detail-row" style="padding:14px 24px;font-size:13px;color:#6B7280;text-align:right;border-bottom:1px solid #EDE9E0;">${dateStr}</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Status</td><td class="lc-detail-row" style="padding:14px 24px;text-align:right;"><span style="display:inline-block;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:20px;padding:5px 14px;font-size:10px;font-weight:800;color:#16A34A;letter-spacing:0.5px;">&#10003; COMPLETED</span></td></tr>
      </table>
    </div>

    <!-- Verification Hash -->
    <div class="lc-info-card" style="text-align:center;background:#F8F7F4;border:1px solid #E5E1D8;border-radius:8px;padding:12px 20px;margin-bottom:24px;">
      <span class="lc-text-muted" style="font-size:9px;font-weight:700;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;">Verification Hash: </span>
      <span style="font-size:11px;font-weight:800;color:#C4A052;font-family:'Courier New',monospace;letter-spacing:1px;">${verifyHash}</span>
    </div>

    <!-- Confirmation Note -->
    <div class="lc-success-card" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p class="lc-success-text" style="margin:0;font-size:13px;color:#15803D;line-height:1.7;">Dear ${firstName}, this receipt confirms your transfer of <strong>${amountFmt}</strong> to <strong>${recipient}</strong> has been successfully processed. Please retain this receipt for your records.</p>
    </div>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:20px;">
      <a href="https://londwaycapital.com/transfer" style="display:inline-block;background:linear-gradient(135deg,#C4A052,#A8873E);color:#060913;font-size:13px;font-weight:800;text-decoration:none;border-radius:10px;padding:13px 32px;letter-spacing:0.04em;box-shadow:0 2px 8px rgba(196,160,82,0.3);">View Transfer History &rarr;</a>
    </td></tr></table>

    <p class="lc-text-muted" style="margin:0;font-size:10px;color:#9CA3AF;line-height:1.6;text-align:center;">This is an automated receipt from Londway Capital. For questions about this transfer, contact <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">support@londwaycapital.com</a>.</p>`;

  const html = emailWrapper('Transfer Receipt', body, `Receipt: ${amountFmt} to ${recipient}. Ref: ${ref}. Transfer processed successfully.`);
  const subject = `Transfer receipt: ${amountFmt} to ${recipient} (${ref})`;
  return sendViaEmailJS(to, userName, subject, html, EMAILJS_TEMPLATE_WELCOME);
}

// ═══════════════════════════════════════════════════════════════════
// NEW EXTRAORDINARY EMAIL TEMPLATES
// Login alerts, password/PIN changes, account freeze, activity digest
// ═══════════════════════════════════════════════════════════════════

/**
 * Send a real-time login security alert with device fingerprinting.
 */
export async function sendLoginAlert(
  to: string,
  userName: string,
  deviceInfo?: { browser: string; os: string; summary: string },
): Promise<{ success: boolean; error?: string }> {
  const firstName = userName.split(' ')[0];
  const greeting = timeGreeting();
  const device = deviceInfo || getDeviceInfo();
  const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
  const sessionId = securityHash();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';

  const body = `
    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:rgba(59,130,246,0.08);border:2px solid rgba(59,130,246,0.25);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:24px;margin-bottom:14px;">&#128272;</div>
      <p class="lc-text-primary" style="margin:0 0 4px;font-size:22px;font-weight:900;color:#0D1628;">New Sign-In Detected</p>
      <p class="lc-text-secondary" style="margin:0;font-size:14px;color:#6B7280;">A new login to your account was recorded.</p>
    </div>

    <p class="lc-text-primary" style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">${greeting}, ${firstName}. We detected a new sign-in to your Londway Capital account. If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.</p>

    <!-- Session Details Card -->
    <div class="lc-info-card" style="background:#FAF8F4;border:1px solid #E5E1D8;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div class="lc-detail-header" style="background:#0D1628;padding:12px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="font-size:10px;font-weight:800;letter-spacing:2px;color:#C4A052;text-transform:uppercase;">Session Details</td>
          <td style="text-align:right;"><span class="lc-live-badge" style="display:inline-block;background:rgba(34,197,94,0.15);border-radius:10px;padding:2px 10px;font-size:9px;font-weight:800;color:#4ADE80;letter-spacing:0.5px;">&#9679; LIVE</span></td>
        </tr></table>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;width:40%;border-bottom:1px solid #EDE9E0;">Date &amp; Time</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${dateStr}</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Browser</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${device.browser}</td></tr>
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Operating System</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${device.os}</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Timezone</td><td class="lc-text-secondary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:600;color:#6B7280;text-align:right;border-bottom:1px solid #EDE9E0;">${tz}</td></tr>
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Session ID</td><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;font-weight:800;color:#C4A052;text-align:right;font-family:'Courier New',monospace;letter-spacing:1px;">${sessionId}</td></tr>
      </table>
    </div>

    <!-- Not You? Warning -->
    <div class="lc-warn-card" style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:18px 22px;margin-bottom:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:top;padding-right:10px;font-size:18px;">&#9888;&#65039;</td>
        <td>
          <p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#DC2626;letter-spacing:0.3px;">Wasn't You?</p>
          <p style="margin:0;font-size:12px;color:#991B1B;line-height:1.7;">If you don't recognize this sign-in, your account may be compromised. Change your password immediately and contact our security team at <a href="mailto:support@londwaycapital.com" style="color:#DC2626;font-weight:700;text-decoration:underline;">support@londwaycapital.com</a> or call <strong>+1 (212) 555-0180</strong>.</p>
        </td>
      </tr></table>
    </div>

    <!-- Security Tips -->
    <div class="lc-info-card" style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#0369A1;letter-spacing:0.5px;text-transform:uppercase;">Security Recommendations</p>
      <p style="margin:0;font-size:12px;color:#075985;line-height:1.8;">
        &#8226; Enable two-factor authentication for added security<br>
        &#8226; Use a unique, strong password for your banking account<br>
        &#8226; Never share your login credentials or PIN with anyone<br>
        &#8226; Review your recent transactions regularly
      </p>
    </div>

    <p class="lc-text-muted" style="margin:0;font-size:10px;color:#9CA3AF;line-height:1.6;text-align:center;">This is an automated security notification from Londway Capital. You receive this email each time someone signs in to your account.</p>`;

  const html = emailWrapper('Security Alert', body, `New sign-in to your Londway Capital account from ${device.summary} on ${dateStr}.`);
  const subject = `New sign-in to your Londway Capital account`;
  return sendViaEmailJS(to, userName, subject, html, EMAILJS_TEMPLATE_WELCOME);
}

/**
 * Send a password change confirmation email.
 */
export async function sendPasswordChangeAlert(
  to: string,
  userName: string,
): Promise<{ success: boolean; error?: string }> {
  const firstName = userName.split(' ')[0];
  const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
  const device = getDeviceInfo();
  const changeId = securityHash();

  const body = `
    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:rgba(249,115,22,0.08);border:2px solid rgba(249,115,22,0.25);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:24px;margin-bottom:14px;">&#128275;</div>
      <p class="lc-text-primary" style="margin:0 0 4px;font-size:22px;font-weight:900;color:#0D1628;">Password Changed</p>
      <p class="lc-text-secondary" style="margin:0;font-size:14px;color:#6B7280;">Your account password has been updated.</p>
    </div>

    <p class="lc-text-primary" style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">Dear ${firstName}, the password for your Londway Capital account was successfully changed. If you made this change, no further action is needed.</p>

    <!-- Change Details -->
    <div class="lc-info-card" style="background:#FAF8F4;border:1px solid #E5E1D8;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div class="lc-detail-header" style="background:#0D1628;padding:12px 24px;">
        <span style="font-size:10px;font-weight:800;letter-spacing:2px;color:#C4A052;text-transform:uppercase;">Change Details</span>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;width:40%;border-bottom:1px solid #EDE9E0;">Event</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">Password Reset</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Date &amp; Time</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${dateStr}</td></tr>
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Device</td><td class="lc-text-secondary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:600;color:#6B7280;text-align:right;border-bottom:1px solid #EDE9E0;">${device.summary}</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Change ID</td><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;font-weight:800;color:#C4A052;text-align:right;font-family:'Courier New',monospace;letter-spacing:1px;">${changeId}</td></tr>
      </table>
    </div>

    <!-- Warning -->
    <div class="lc-warn-card" style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:18px 22px;margin-bottom:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:top;padding-right:10px;font-size:18px;">&#128680;</td>
        <td>
          <p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#DC2626;letter-spacing:0.3px;">Didn't Make This Change?</p>
          <p style="margin:0;font-size:12px;color:#991B1B;line-height:1.7;">If you did not change your password, your account security may be at risk. Contact our security team <strong>immediately</strong> at <a href="mailto:support@londwaycapital.com" style="color:#DC2626;font-weight:700;text-decoration:underline;">support@londwaycapital.com</a> or call <strong>+1 (212) 555-0180</strong> to lock your account.</p>
        </td>
      </tr></table>
    </div>

    <p class="lc-text-muted" style="margin:0;font-size:10px;color:#9CA3AF;line-height:1.6;text-align:center;">This is an automated security notification. You will receive an alert whenever your account credentials are changed.</p>`;

  const html = emailWrapper('Security Alert', body, `Your Londway Capital password was changed on ${dateStr}. If this wasn't you, contact support immediately.`);
  const subject = `Your Londway Capital password was changed`;
  return sendViaEmailJS(to, userName, subject, html, EMAILJS_TEMPLATE_WELCOME);
}

/**
 * Send a PIN change alert email (from admin or user-initiated).
 */
export async function sendPinChangeAlert(
  to: string,
  userName: string,
  changedBy: 'user' | 'admin' = 'admin',
): Promise<{ success: boolean; error?: string }> {
  const firstName = userName.split(' ')[0];
  const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
  const changeId = securityHash();
  const initiator = changedBy === 'admin' ? 'Bank Administrator' : 'Account Holder';

  const body = `
    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:rgba(168,85,247,0.08);border:2px solid rgba(168,85,247,0.25);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:24px;margin-bottom:14px;">&#128273;</div>
      <p class="lc-text-primary" style="margin:0 0 4px;font-size:22px;font-weight:900;color:#0D1628;">PIN Updated</p>
      <p class="lc-text-secondary" style="margin:0;font-size:14px;color:#6B7280;">Your account PIN has been changed.</p>
    </div>

    <p class="lc-text-primary" style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">Dear ${firstName}, the security PIN for your Londway Capital account has been updated. Please use your new PIN for all future authentication.</p>

    <!-- Change Details -->
    <div class="lc-info-card" style="background:#FAF8F4;border:1px solid #E5E1D8;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div class="lc-detail-header" style="background:#0D1628;padding:12px 24px;">
        <span style="font-size:10px;font-weight:800;letter-spacing:2px;color:#C4A052;text-transform:uppercase;">PIN Change Details</span>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;width:40%;border-bottom:1px solid #EDE9E0;">Event</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">PIN Changed</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Date &amp; Time</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${dateStr}</td></tr>
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Changed By</td><td class="lc-text-secondary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:600;color:#6B7280;text-align:right;border-bottom:1px solid #EDE9E0;">${initiator}</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Change ID</td><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;font-weight:800;color:#C4A052;text-align:right;font-family:'Courier New',monospace;letter-spacing:1px;">${changeId}</td></tr>
      </table>
    </div>

    <!-- Warning -->
    <div class="lc-warn-card" style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:top;padding-right:10px;font-size:16px;">&#128274;</td>
        <td>
          <p class="lc-warn-text" style="margin:0 0 4px;font-size:12px;font-weight:700;color:#92400E;">Important</p>
          <p class="lc-warn-text" style="margin:0;font-size:12px;color:#92400E;line-height:1.6;">If you did not request this PIN change, contact our security team immediately. Never share your PIN with anyone.</p>
        </td>
      </tr></table>
    </div>

    <p class="lc-text-muted" style="margin:0;font-size:10px;color:#9CA3AF;line-height:1.6;text-align:center;">This is an automated security notification from Londway Capital.</p>`;

  const html = emailWrapper('Security Alert', body, `Your Londway Capital PIN was changed on ${dateStr} by ${initiator.toLowerCase()}.`);
  const subject = `Your Londway Capital PIN was updated`;
  return sendViaEmailJS(to, userName, subject, html, EMAILJS_TEMPLATE_WELCOME);
}

/**
 * Send an account frozen notification email.
 */
export async function sendAccountFrozenEmail(
  to: string,
  userName: string,
): Promise<{ success: boolean; error?: string }> {
  const firstName = userName.split(' ')[0];
  const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
  const caseId = `FRZ-${securityHash()}`;

  const body = `
    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:rgba(239,68,68,0.08);border:2px solid rgba(239,68,68,0.25);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:24px;margin-bottom:14px;">&#10060;</div>
      <p class="lc-text-primary" style="margin:0 0 4px;font-size:22px;font-weight:900;color:#0D1628;">Account Frozen</p>
      <p class="lc-text-secondary" style="margin:0;font-size:14px;color:#6B7280;">Your account has been temporarily restricted.</p>
    </div>

    <p class="lc-text-primary" style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">Dear ${firstName}, your Londway Capital account has been frozen as of <strong class="lc-text-primary" style="color:#0D1628;">${dateStr}</strong>. During this period, all transactions, transfers, and card usage will be suspended.</p>

    <!-- Status Card -->
    <div style="text-align:center;background:#FEF2F2;border:2px solid #FECACA;border-radius:14px;padding:24px 20px;margin-bottom:24px;">
      <div style="font-size:9px;font-weight:800;color:#DC2626;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Account Status</div>
      <div style="font-size:28px;font-weight:900;color:#DC2626;letter-spacing:0.04em;line-height:1;">&#128683; FROZEN</div>
      <div style="margin-top:10px;font-size:11px;color:#991B1B;font-weight:600;">All account activity has been suspended</div>
    </div>

    <!-- Details -->
    <div class="lc-info-card" style="background:#FAF8F4;border:1px solid #E5E1D8;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div class="lc-detail-header" style="background:#0D1628;padding:12px 24px;">
        <span style="font-size:10px;font-weight:800;letter-spacing:2px;color:#C4A052;text-transform:uppercase;">Freeze Details</span>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;width:40%;border-bottom:1px solid #EDE9E0;">Case Reference</td><td class="lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:800;color:#C4A052;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #EDE9E0;">${caseId}</td></tr>
        <tr class="lc-detail-alt" style="background:#FDFBF6;"><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #EDE9E0;">Effective Date</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#0D1628;text-align:right;border-bottom:1px solid #EDE9E0;">${dateStr}</td></tr>
        <tr><td class="lc-detail-row" style="padding:14px 24px;font-size:12px;color:#9CA3AF;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Restrictions</td><td class="lc-text-primary lc-detail-row" style="padding:14px 24px;font-size:13px;font-weight:700;color:#DC2626;text-align:right;">All Activity Suspended</td></tr>
      </table>
    </div>

    <!-- What You Can Do -->
    <div class="lc-info-card" style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:10px;padding:18px 22px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:800;color:#0369A1;letter-spacing:0.5px;text-transform:uppercase;">What Should I Do?</p>
      <p style="margin:0;font-size:12px;color:#075985;line-height:1.8;">
        &#8226; Contact your private banker to discuss this restriction<br>
        &#8226; Provide any requested identity verification documents<br>
        &#8226; Your funds remain safe and fully protected<br>
        &#8226; Existing scheduled payments may be temporarily paused
      </p>
    </div>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:20px;">
      <a href="mailto:support@londwaycapital.com?subject=Account%20Frozen%20-%20Case%20${encodeURIComponent(caseId)}" style="display:inline-block;background:linear-gradient(135deg,#DC2626,#B91C1C);color:#FFFFFF;font-size:13px;font-weight:800;text-decoration:none;border-radius:10px;padding:13px 32px;letter-spacing:0.04em;box-shadow:0 2px 8px rgba(220,38,38,0.3);">Contact Support Now &rarr;</a>
    </td></tr></table>

    <p class="lc-text-muted" style="margin:0;font-size:10px;color:#9CA3AF;line-height:1.6;text-align:center;">Reference this case ID when contacting support: <strong style="color:#C4A052;">${caseId}</strong></p>`;

  const html = emailWrapper('Account Notice', body, `Your Londway Capital account has been frozen. Case: ${caseId}. Contact support for assistance.`);
  const subject = `Your Londway Capital account requires attention (${caseId})`;
  return sendViaEmailJS(to, userName, subject, html, EMAILJS_TEMPLATE_WELCOME);
}

/**
 * Send an account unfrozen / restored notification email.
 */
export async function sendAccountUnfrozenEmail(
  to: string,
  userName: string,
): Promise<{ success: boolean; error?: string }> {
  const firstName = userName.split(' ')[0];
  const greeting = timeGreeting();
  const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

  const body = `
    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#ECFDF5;border:2px solid #86EFAC;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:14px;">&#10003;</div>
      <p class="lc-text-primary" style="margin:0 0 4px;font-size:22px;font-weight:900;color:#0D1628;">Account Restored</p>
      <p class="lc-text-secondary" style="margin:0;font-size:14px;color:#6B7280;">Your account is now fully active again.</p>
    </div>

    <p class="lc-text-primary" style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">${greeting}, ${firstName}. We're pleased to inform you that the restrictions on your Londway Capital account have been lifted. Your account is now fully active and all services have been restored.</p>

    <!-- Status Card -->
    <div class="lc-success-card" style="text-align:center;background:#F0FDF4;border:2px solid #86EFAC;border-radius:14px;padding:24px 20px;margin-bottom:24px;">
      <div class="lc-success-text" style="font-size:9px;font-weight:800;color:#16A34A;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Account Status</div>
      <div class="lc-success-text" style="font-size:28px;font-weight:900;color:#16A34A;letter-spacing:0.04em;line-height:1;">&#10003; ACTIVE</div>
      <div class="lc-success-text" style="margin-top:10px;font-size:11px;color:#15803D;font-weight:600;">All services have been restored — ${dateStr}</div>
    </div>

    <!-- Restored Services -->
    <div class="lc-success-card" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:18px 22px;margin-bottom:24px;">
      <p class="lc-success-text" style="margin:0 0 6px;font-size:11px;font-weight:800;color:#15803D;letter-spacing:0.5px;text-transform:uppercase;">Restored Services</p>
      <p class="lc-success-text" style="margin:0;font-size:12px;color:#15803D;line-height:1.8;">
        &#10003; Domestic &amp; international transfers<br>
        &#10003; Card payments and ATM withdrawals<br>
        &#10003; Online &amp; mobile banking access<br>
        &#10003; Investment and vault management<br>
        &#10003; Scheduled &amp; recurring payments resumed
      </p>
    </div>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:24px;">
      <a href="https://londwaycapital.com" style="display:inline-block;background:linear-gradient(135deg,#C4A052,#A8873E);color:#060913;font-size:14px;font-weight:800;text-decoration:none;border-radius:10px;padding:14px 36px;letter-spacing:0.04em;box-shadow:0 2px 8px rgba(196,160,82,0.3);">Access Your Dashboard &rarr;</a>
    </td></tr></table>

    <p class="lc-text-muted" style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6;text-align:center;">Thank you for your patience. If you have any questions, contact us at <a href="mailto:support@londwaycapital.com" style="color:#C4A052;text-decoration:none;font-weight:600;">support@londwaycapital.com</a> or <a href="tel:+12125550180" style="color:#C4A052;text-decoration:none;font-weight:600;">+1 (212) 555-0180</a>.</p>`;

  const html = emailWrapper('Account Restored', body, `Great news, ${firstName}! Your Londway Capital account has been fully restored and is now active.`);
  const subject = `Your Londway Capital account has been restored`;
  return sendViaEmailJS(to, userName, subject, html, EMAILJS_TEMPLATE_WELCOME);
}
