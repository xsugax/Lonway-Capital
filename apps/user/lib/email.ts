// Email notification utility for Londway Capital using Brevo (formerly Sendinblue)
// Sends professional email notifications from londwayfond@gmail.com

import axios from 'axios';

const BREVO_API_KEY = process.env.NEXT_PUBLIC_BREVO_API_KEY;
const BANK_EMAIL = 'londwayfond@gmail.com';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendBankEmail({ to, subject, html, text }: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await axios.post(
      BREVO_API_URL,
      {
        sender: { name: 'Londway Capital', email: BANK_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || '',
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
 * Send a 6-digit verification code to the user's email via Brevo.
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
        <div style="font-size: 10px; color: #445; letter-spacing: 0.06em;">🔒 256-bit SSL · FDIC Insured · SOC 2 Type II</div>
        <div style="font-size: 10px; color: #334; margin-top: 4px;">© 2026 Londway Capital, Inc. All rights reserved.</div>
      </div>
    </div>
  `;
  return sendBankEmail({
    to,
    subject: `${code} — Your Londway Capital Verification Code`,
    html,
    text: `Your Londway Capital verification code is: ${code}. This code expires in 10 minutes.`,
  });
}
