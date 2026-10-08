import crypto from 'node:crypto';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const AUTH_SECRET = process.env.AUTH_SECRET || 'house_of_gargi_vedic_auth_secret_2026';
const resendApiKey = process.env.RESEND_API_KEY || '';
const NOREPLY_EMAIL = process.env.NOREPLY_EMAIL || 'noreply@gargisaha.com';

const resend = new Resend(resendApiKey);

export function generateHmacToken(email: string, otp: string, expiresAt: number): string {
  const payload = `${email.toLowerCase().trim()}:${otp.trim()}:${expiresAt}`;
  return crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
}

export function verifyHmacToken(email: string, otp: string, expiresAt: number, token: string): boolean {
  if (Date.now() > expiresAt) return false;
  const expectedToken = generateHmacToken(email, otp, expiresAt);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim();

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>House of Gargi Access Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #FBF6EE; font-family: 'Georgia', serif; color: #241A15;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FBF6EE; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border: 1.5px solid #E4D3AE; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="background-color: #7A2331; height: 4px;">&nbsp;</td>
              </tr>
              <tr>
                <td align="center" style="padding: 36px 32px 20px 32px; text-align: center; border-bottom: 1px solid #F4EDE0;">
                  <div style="font-size: 11px; letter-spacing: 0.26em; text-transform: uppercase; color: #B88E18; font-weight: 700; margin-bottom: 8px;">
                    ✦ ATELIER ACCESS ✦
                  </div>
                  <h1 style="margin: 0; font-size: 27px; color: #7A2331; font-weight: 500; font-family: 'Georgia', serif;">
                    House of Gargi
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 32px 28px 32px; text-align: center;">
                  <p style="margin: 0 0 20px 0; font-size: 15px; color: #5C5043; line-height: 1.6;">
                    Here is your single-use verification code to sign into your House of Gargi patron suite.
                  </p>
                  <div style="background-color: #FAF5EC; border: 1.5px dashed #C9A227; border-radius: 6px; padding: 18px 24px; margin: 24px auto; display: inline-block;">
                    <span style="font-family: 'Courier New', monospace; font-size: 34px; font-weight: 700; letter-spacing: 0.35em; color: #7A2331;">
                      ${otp}
                    </span>
                  </div>
                  <p style="margin: 16px 0 0 0; font-size: 12.5px; color: #8C7B70;">
                    Code expires in 10 minutes. If you did not request this, you may ignore this transmission.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #241A15; padding: 22px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #FAF7F2; opacity: 0.75;">
                    &copy; 2026 House of Gargi Atelier. Handcrafted Heritage, Worn Today.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: `House of Gargi <${NOREPLY_EMAIL}>`,
      to: [cleanEmail],
      subject: `Your Atelier Access Code: ${otp}`,
      html: emailHtml,
    });
    if (error) {
      console.error('[Resend Error]:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Email Dispatch Failed]:', err);
    return false;
  }
}
