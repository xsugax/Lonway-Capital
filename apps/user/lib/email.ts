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
