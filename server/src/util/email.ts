import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = env.smtpHost
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPassword } : undefined,
    })
  : null;

// Brevo trimite prin HTTPS, util pe hosting-uri care blochează porturile SMTP (ex. Render free).
const sendWithBrevo = async (to: string, subject: string, text: string, html: string) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.brevoApiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'AgroHub', email: env.smtpFrom },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo email failed: ${response.status} ${await response.text()}`);
  }
};

export const sendVerificationCode = async (email: string, code: string) => {
  const subject = 'Codul tău de verificare AgroHub';
  const text = `Codul tău de verificare este ${code}. Expiră în 15 minute.`;
  const html = `<p>Codul tău de verificare AgroHub este:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>Codul expiră în 15 minute.</p>`;

  if (env.brevoApiKey && env.smtpFrom) {
    await sendWithBrevo(email, subject, text, html);
    return;
  }

  if (!transporter || !env.smtpFrom) {
    if (env.nodeEnv !== 'production') {
      console.info(`[email verification] ${email}: ${code}`);
      return;
    }

    throw new Error('Email verification is not configured (set BREVO_API_KEY or SMTP_HOST, plus SMTP_FROM).');
  }

  await transporter.sendMail({ from: env.smtpFrom, to: email, subject, text, html });
};
