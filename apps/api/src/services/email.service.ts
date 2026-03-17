import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as https from 'https';

interface StoredCode {
  code: string;
  expiresAt: number;
}

@Injectable()
export class EmailService {
  private codes = new Map<string, StoredCode>();
  private logger = new Logger('EmailService');
  private readonly CODE_TTL = 10 * 60 * 1000; // 10 minutes

  generateAndSendCode(email: string, userName?: string): Promise<{ success: boolean; error?: string }> {
    const code = String(crypto.randomInt(100000, 999999));

    this.codes.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + this.CODE_TTL,
    });

    this.cleanupExpired();
    this.logger.log(`Verification code generated for ${email}`);

    return this.sendVerificationEmail(email, code, userName);
  }

  verifyCode(email: string, code: string): { valid: boolean; error?: string } {
    const stored = this.codes.get(email.toLowerCase());
    if (!stored) return { valid: false, error: 'No verification code found. Please request a new one.' };
    if (Date.now() > stored.expiresAt) {
      this.codes.delete(email.toLowerCase());
      return { valid: false, error: 'Code has expired. Please request a new one.' };
    }
    if (stored.code !== code) return { valid: false, error: 'Invalid verification code.' };

    // One-time use — delete after successful verification
    this.codes.delete(email.toLowerCase());
    this.logger.log(`Verification code verified for ${email}`);
    return { valid: true };
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [key, val] of this.codes) {
      if (now > val.expiresAt) this.codes.delete(key);
    }
  }

  private sendVerificationEmail(to: string, code: string, userName?: string): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      this.logger.error('BREVO_API_KEY not set');
      return Promise.resolve({ success: false, error: 'Email service not configured' });
    }

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
        <div style="font-size: 10px; color: #445; letter-spacing: 0.06em;">&#128274; 256-bit SSL &middot; FDIC Insured &middot; SOC 2 Type II</div>
        <div style="font-size: 10px; color: #334; margin-top: 4px;">&copy; 2026 Londway Capital, Inc. All rights reserved.</div>
      </div>
    </div>`;

    const payload = JSON.stringify({
      sender: { name: 'Londway Capital', email: 'londwayfond@gmail.com' },
      to: [{ email: to }],
      subject: `${code} — Your Londway Capital Verification Code`,
      htmlContent: html,
      textContent: `Your Londway Capital verification code is: ${code}. This code expires in 10 minutes.`,
    });

    return new Promise((resolve) => {
      const req = https.request({
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true });
          } else {
            try {
              const parsed = JSON.parse(data);
              this.logger.error(`Brevo error: ${parsed.message}`);
              resolve({ success: false, error: parsed.message || 'Email sending failed' });
            } catch {
              resolve({ success: false, error: 'Email sending failed' });
            }
          }
        });
      });
      req.on('error', (err) => {
        this.logger.error(`Brevo request error: ${err.message}`);
        resolve({ success: false, error: err.message });
      });
      req.write(payload);
      req.end();
    });
  }
}
