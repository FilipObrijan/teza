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

export const sendEmail = async ({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }) => {
  if (env.brevoApiKey && env.smtpFrom) {
    await sendWithBrevo(to, subject, text, html);
    return;
  }

  if (!transporter || !env.smtpFrom) {
    if (env.nodeEnv !== 'production') {
      console.info(`[email] ${to}: ${subject}\n${text}`);
      return;
    }

    throw new Error('Email is not configured (set BREVO_API_KEY or SMTP_HOST, plus SMTP_FROM).');
  }

  await transporter.sendMail({ from: env.smtpFrom, to, subject, text, html });
};

export const sendPasswordResetCode = (email: string, code: string) =>
  sendEmail({
    to: email,
    subject: 'Resetarea parolei AgroHub',
    text: `Codul pentru resetarea parolei este ${code}. Expiră în 15 minute. Dacă nu ai cerut resetarea, ignoră acest email.`,
    html: `<p>Codul pentru resetarea parolei AgroHub este:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>Codul expiră în 15 minute. Dacă nu ai cerut resetarea, ignoră acest email.</p>`,
  });

export const sendVerificationCode = (email: string, code: string) =>
  sendEmail({
    to: email,
    subject: 'Codul tău de verificare AgroHub',
    text: `Codul tău de verificare este ${code}. Expiră în 15 minute.`,
    html: `<p>Codul tău de verificare AgroHub este:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>Codul expiră în 15 minute.</p>`,
  });
