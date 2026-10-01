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
  // Adresa site-ului, folosită în linkurile din emailuri.
  siteUrl: process.env.SITE_URL ?? 'https://filipobrijan.github.io/teza/',
  adminEmail: process.env.ADMIN_EMAIL ?? '',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  smtpFrom: process.env.SMTP_FROM ?? '',
  brevoApiKey: process.env.BREVO_API_KEY ?? '',
  // Client ID-ul OAuth din Google Cloud Console; gol = logarea cu Google e dezactivată.
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  // Cheia de la console.anthropic.com pentru verificarea anunțurilor cu AI; gol = verificarea AI e dezactivată.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
  anthropicBaseUrl: (process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com').replace(/\/$/, ''),
};
