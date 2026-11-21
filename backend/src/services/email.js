import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const SUPPORT_EMAIL = env.supportEmail;

let transporter;
function transport() {
  if (!env.smtpHost) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      ...(env.smtpUser ? { auth: { user: env.smtpUser, pass: env.smtpPass } } : {}),
    });
  }
  return transporter;
}

function template({ code, purpose, ttlSeconds }) {
  const isReset = purpose === 'reset_password';
  const title = isReset ? 'Reset your TrackSense password' : 'Verify your TrackSense email';
  const action = isReset ? 'password reset' : 'verification';
  const duration = ttlSeconds < 120 ? '1 minute' : `${Math.round(ttlSeconds / 60)} minutes`;
  const text = [
    `${title}`,
    '',
    `Your TrackSense ${action} code is ${code}.`,
    `This code expires in ${duration}.`,
    '',
    'If you did not request this, you can safely ignore this email.',
    '',
    'TrackSense Support',
    SUPPORT_EMAIL,
  ].join('\n');
  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;background:#0A0F0D;padding:32px;color:#F0FDF4">
      <div style="max-width:520px;margin:0 auto;background:#111915;border:1px solid #2D4A38;border-radius:16px;padding:28px">
        <h1 style="margin:0 0 12px;font-size:22px;color:#F0FDF4">${title}</h1>
        <p style="margin:0 0 20px;color:#86EFAC;font-size:15px;line-height:1.6">
          Enter this code to continue. It expires in ${duration}.
        </p>
        <div style="letter-spacing:10px;font-size:32px;font-weight:700;color:#52B788;background:#1A2E22;border:1px solid #2D4A38;border-radius:12px;padding:18px;text-align:center">${code}</div>
        <p style="margin:24px 0 0;color:#92AB9C;font-size:13px;line-height:1.6">
          If you did not request this, you can safely ignore this email.
        </p>
        <p style="margin:16px 0 0;color:#92AB9C;font-size:13px">TrackSense Support · ${SUPPORT_EMAIL}</p>
      </div>
    </div>`;
  return { subject: title, text, html };
}

export async function sendOtpEmail({ to, code, purpose, ttlSeconds }) {
  const message = template({ code, purpose, ttlSeconds });
  const mailer = transport();
  if (!mailer) {
    // Local development remains usable without SMTP; production fails closed.
    if (env.production) {
      throw Object.assign(new Error('Email delivery is not configured. Contact support.'), { status: 503 });
    }
    console.info(`[TrackSense auth] ${purpose} code for ${to}: ${code} (expires in ${ttlSeconds}s)`);
    return { delivered: false };
  }
  await mailer.sendMail({ from: env.mailFrom, to, ...message });
  return { delivered: true };
}

export { SUPPORT_EMAIL };
