import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? 'development';
const requiredEnv = nodeEnv === 'production' ? ['DATABASE_URL', 'JWT_SECRET'] : ['DATABASE_URL'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    if (nodeEnv === 'production') {
      throw new Error(`Missing environment variable: ${key}`);
    }
    console.warn(`Missing environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://agro_user:agro_password@localhost:5432/agro_b2b',
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET ?? 'local-dev-secret',
  // Listă separată prin virgulă, ex. "https://filipobrijan.github.io,http://localhost:5173". Gol = orice origine.
  corsOrigins: (process.env.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean),
  adminEmail: process.env.ADMIN_EMAIL ?? '',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  smtpFrom: process.env.SMTP_FROM ?? '',
};
