// Email verification utility for Londway Capital
// Calls Brevo API directly for static-hosted deployment (GitHub Pages)
// When backend is deployed, switch to server-side email via /email/send-code endpoint

import axios from 'axios';

const BREVO_API_KEY = process.env.NEXT_PUBLIC_BREVO_API_KEY;

/** Generate a cryptographically secure 6-digit code */
export function generateSecureCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

/**
 * Send a branded verification code email via Brevo.
 */
export async function sendVerificationCode(to: string, code: string, userName?: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #060913; color: #EAE0D0; border-radius: 16px; overflow: hidden; border: 1px solid rgba(196,160,82,0.15);">
      <div style="background: linear-gradient(135deg, #0d1020 0%, #12172e 100%); padding: 32px 28px 20px; text-align: center; border-bottom: 1px solid rgba(196,160,82,0.12);">
        <div style="font-size: 22px; font-weight: 800; letter-spacing: 0.05em; color: #fff;">
          LONDWAY <span style="color: #C4A052;">CAPITAL</span>
        </div>
        <div style="font-size: 11px; color: rgba(196,160,82,0.5); margin-top: 6px; letter-spacing: 0.12em;">PREMIUM PRIVATE BANKING</div>
      </div>
      <div style="padding: 32px 28px;">
        <p style="color: #A2B2BF; font-size: 14px; margin: 0 0 8px;">Hello${userName ? ' ' + userName : ''},</p>
        <p style="color: #A2B2BF; font-size: 14px; margin: 0 0 24px;">Your verification code is:</p>
        <div style="background: rgba(196,160,82,0.08); border: 1px solid rgba(196,160,82,0.2); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 36px; font-weight: 800; color: #C4A052; letter-spacing: 0.4em; font-family: 'Courier New', monospace;">${code}</div>
        </div>
        <p style="color: #667; font-size: 12px; margin: 0 0 6px;">This code expires in <strong style="color: #A2B2BF;">10 minutes</strong>.</p>
        <p style="color: #667; font-size: 12px; margin: 0;">If you didn't request this code, please ignore this email or contact support.</p>
      </div>
      <div style="padding: 16px 28px; border-top: 1px solid rgba(196,160,82,0.08); text-align: center;">
        <div style="font-size: 10px; color: #445; letter-spacing: 0.06em;">\uD83D\uDD12 256-bit SSL \u00B7 FDIC Insured \u00B7 SOC 2 Type II</div>
        <div style="font-size: 10px; color: #334; margin-top: 4px;">\u00A9 2026 Londway Capital, Inc. All rights reserved.</div>
      </div>
    </div>`;

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: 'Londway Capital', email: 'londwayfond@gmail.com' },
        to: [{ email: to }],
        subject: `${code} \u2014 Your Londway Capital Verification Code`,
        htmlContent: html,
        textContent: `Your Londway Capital verification code is: ${code}. This code expires in 10 minutes.`,
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.response?.data?.message || error.message };
  }
}

/**
 * Send a transfer confirmation email via Brevo.
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
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #060913; color: #EAE0D0; border-radius: 16px; overflow: hidden; border: 1px solid rgba(196,160,82,0.15);">
      <div style="background: linear-gradient(135deg, #0d1020 0%, #12172e 100%); padding: 32px 28px 20px; text-align: center; border-bottom: 1px solid rgba(196,160,82,0.12);">
        <div style="font-size: 22px; font-weight: 800; letter-spacing: 0.05em; color: #fff;">LONDWAY <span style="color: #C4A052;">CAPITAL</span></div>
        <div style="font-size: 11px; color: rgba(196,160,82,0.5); margin-top: 6px; letter-spacing: 0.12em;">TRANSFER CONFIRMATION</div>
      </div>
      <div style="padding: 32px 28px;">
        <p style="color: #A2B2BF; font-size: 14px; margin: 0 0 20px;">Hello ${userName},</p>
        <p style="color: #A2B2BF; font-size: 14px; margin: 0 0 20px;">Your transfer has been submitted and is pending compliance review.</p>
        <div style="background: rgba(196,160,82,0.06); border: 1px solid rgba(196,160,82,0.15); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: #667; font-size: 12px; padding: 6px 0;">Reference</td><td style="color: #C4A052; font-weight: 700; font-size: 13px; text-align: right; font-family: monospace;">${ref}</td></tr>
            <tr><td style="color: #667; font-size: 12px; padding: 6px 0;">Recipient</td><td style="color: #EAE0D0; font-size: 13px; text-align: right;">${recipient}</td></tr>
            <tr><td style="color: #667; font-size: 12px; padding: 6px 0;">Amount</td><td style="color: #EAE0D0; font-weight: 700; font-size: 15px; text-align: right;">${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
            <tr><td style="color: #667; font-size: 12px; padding: 6px 0;">Type</td><td style="color: #A2B2BF; font-size: 13px; text-align: right; text-transform: capitalize;">${type}</td></tr>
            <tr><td style="color: #667; font-size: 12px; padding: 6px 0;">Status</td><td style="color: #C4A052; font-weight: 700; font-size: 13px; text-align: right;">⏳ Pending Review</td></tr>
          </table>
        </div>
        <p style="color: #667; font-size: 12px; margin: 0;">Transfers are reviewed by Londway compliance within 1–2 hours. You will be notified once your transfer is approved.</p>
      </div>
      <div style="padding: 16px 28px; border-top: 1px solid rgba(196,160,82,0.08); text-align: center;">
        <div style="font-size: 10px; color: #445; letter-spacing: 0.06em;">🔒 256-bit SSL · FDIC Insured · SOC 2 Type II</div>
        <div style="font-size: 10px; color: #334; margin-top: 4px;">© 2026 Londway Capital, Inc. All rights reserved.</div>
      </div>
    </div>`;

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: 'Londway Capital', email: 'londwayfond@gmail.com' },
        to: [{ email: to }],
        subject: `Transfer ${ref} submitted — Londway Capital`,
        htmlContent: html,
        textContent: `Your transfer of ${currency} ${amount} to ${recipient} (Ref: ${ref}) is pending compliance review.`,
      },
      {
        headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      }
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.response?.data?.message || error.message };
  }
}
