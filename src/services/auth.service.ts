import crypto from 'node:crypto';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const AUTH_SECRET = process.env.AUTH_SECRET || (process.env.NODE_ENV !== 'production' ? 'house_of_gargi_dev_auth_secret_only' : '');
if (process.env.NODE_ENV === 'production' && !AUTH_SECRET) {
  throw new Error('[FATAL] Missing required AUTH_SECRET in production environment.');
}
const resendApiKey = process.env.RESEND_API_KEY || '';
const NOREPLY_EMAIL = process.env.NOREPLY_EMAIL || 'noreply@gargisaha.com';

const resend = new Resend(resendApiKey);

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function generateHmacToken(email: string, otp: string, expiresAt: number): string {
  const payload = `${email.toLowerCase().trim()}:${otp.trim()}:${expiresAt}`;
  return crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
}

export function verifyHmacToken(email: string, otp: string, expiresAt: number, token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (Date.now() > expiresAt) return false;
  const expectedToken = generateHmacToken(email, otp, expiresAt);
  const bufToken = Buffer.from(token);
  const bufExpected = Buffer.from(expectedToken);
  if (bufToken.length !== bufExpected.length) return false;
  return crypto.timingSafeEqual(bufToken, bufExpected);
}

export async function isTokenUsed(token: string): Promise<boolean> {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { supabase } = await import('../db/supabase.js');
    const { data, error } = await supabase
      .from('otp_used_tokens')
      .select('token_hash')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error) {
      // Table might not exist yet if migration 0017 has not been run
      return false;
    }
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function recordUsedToken(token: string, email: string): Promise<void> {
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { supabase } = await import('../db/supabase.js');
    await supabase.from('otp_used_tokens').insert({
      token_hash: tokenHash,
      user_email: email.toLowerCase().trim(),
      used_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[OTP Hardening] Warning recording used token:', err);
  }
}

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim();

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>House of Gargi Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #FBF6EE; font-family: 'Georgia', -apple-system, BlinkMacSystemFont, 'Segoe UI', serif; color: #241A15; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FBF6EE; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border: 1.5px solid #E4D3AE; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(43, 31, 24, 0.05);">
              <tr>
                <td style="background-color: #7A2331; height: 5px; line-height: 5px; font-size: 5px;">&nbsp;</td>
              </tr>
              <tr>
                <td align="center" style="padding: 34px 32px 20px 32px; text-align: center; border-bottom: 1px solid #F4EDE0;">
                  <a href="https://gargisaha.com" target="_blank" style="text-decoration: none; display: inline-block;">
                    <img 
                      src="https://wlivgkosmbfgjtecvznj.supabase.co/storage/v1/object/public/images/logo-email.png" 
                      alt="House of Gargi" 
                      width="200" 
                      style="display: block; margin: 0 auto; width: 200px; height: auto; max-width: 100%; border: 0;"
                    />
                  </a>
                  <div style="font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #7A2331; font-weight: 700; margin-top: 14px;">
                    HOUSE OF GARGI PORTAL
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 36px 32px 28px 32px; text-align: center;">
                  <p style="margin: 0 0 22px 0; font-size: 15px; color: #4A3C33; line-height: 1.65;">
                    Here is your single-use verification code to sign into your House of Gargi account.
                  </p>
                  <div style="background-color: #FAF7F2; border: 1.5px solid #D4AF37; border-radius: 8px; padding: 18px 28px; margin: 16px auto 24px; display: inline-block;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 0.35em; color: #7A2331; display: inline-block; padding-left: 10px;">
                      ${otp}
                    </span>
                  </div>
                  <p style="margin: 16px 0 0 0; font-size: 12.5px; color: #8C7B70; line-height: 1.5;">
                    This code expires in <strong>10 minutes</strong>. If you did not request this, you may safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="border-top: 1px solid #EAE2D5; background-color: #FAF7F2; padding: 20px 24px; text-align: center; font-size: 12px; color: #8C7B70;">
                  <p style="margin: 0;">
                    Secure authentication dispatched from <a href="mailto:noreply@gargisaha.com" style="color: #7A2331; text-decoration: underline; font-weight: 600;">noreply@gargisaha.com</a>
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
      subject: `Your House of Gargi Verification Code: ${otp}`,
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

