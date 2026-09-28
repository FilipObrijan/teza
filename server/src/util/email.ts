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

export const sendVerificationCode = async (email: string, code: string) => {
  if (!transporter || !env.smtpFrom) {
    if (env.nodeEnv !== 'production') {
      console.info(`[email verification] ${email}: ${code}`);
      return;
    }

    throw new Error('SMTP email verification is not configured.');
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to: email,
    subject: 'Codul tău de verificare AgroHub',
    text: `Codul tău de verificare este ${code}. Expiră în 15 minute.`,
    html: `<p>Codul tău de verificare AgroHub este:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p><p>Codul expiră în 15 minute.</p>`,
  });
};
