import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { hashPassword } from '../util/auth.js';
import { pool } from './index.js';

// Funcționează atât din src/db (tsx) cât și din dist/db (node), ambele la același nivel.
const schemaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../database/schema.sql');

export async function migrate() {
  const existing = await pool.query(`SELECT to_regclass('public.users') AS table_name`);

  if (!existing.rows[0].table_name) {
    console.log('Database is empty, applying database/schema.sql');
    await pool.query(await fs.readFile(schemaPath, 'utf8'));
  }

  // Imaginile se păstrează în baza de date, ca să supraviețuiască repornirilor pe hosting fără disc persistent.
  await pool.query('ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS image_data BYTEA');

  if (env.adminEmail && env.adminPassword) {
    await pool.query(
      `
        INSERT INTO users (full_name, email, password_hash, role, status, email_verified_at)
        VALUES ('Administrator', $1, $2, 'admin', 'approved', NOW())
        ON CONFLICT (email) DO NOTHING
      `,
      [env.adminEmail.toLowerCase(), await hashPassword(env.adminPassword)],
    );
  }
}
