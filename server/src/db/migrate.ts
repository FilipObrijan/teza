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

  // Codurile au doar 6 cifre, deci doi utilizatori pot primi același cod; unicitatea ar strica înregistrarea.
  await pool.query('ALTER TABLE email_verification_tokens DROP CONSTRAINT IF EXISTS email_verification_tokens_token_hash_key');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id)');

  // Până unde a citit fiecare participant fiecare conversație (pentru mesajele necitite).
  const readsTable = await pool.query(`SELECT to_regclass('public.order_message_reads') AS table_name`);
  if (!readsTable.rows[0].table_name) {
    await pool.query(`
      CREATE TABLE order_message_reads (
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (order_id, user_id)
      )
    `);
    // Conversațiile existente pornesc ca citite, altfel toate ar apărea brusc ca necitite la prima lansare.
    await pool.query(`
      INSERT INTO order_message_reads (order_id, user_id)
      SELECT o.id, o.distributor_id FROM orders o
      UNION
      SELECT o.id, pl.seller_id FROM orders o JOIN product_listings pl ON pl.id = o.listing_id
    `);
  }

  // Momentul în care utilizatorul și-a șters conversația; mesajele de dinainte nu i se mai arată.
  await pool.query('ALTER TABLE order_message_reads ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ');

  // Când i s-a trimis ultima oară un email despre mesaje noi (cel mult unul până citește conversația).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_message_notifications (
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (order_id, user_id)
    )
  `);

  // Recenzii verificate: fiecare parte a unei comenzi acceptate o poate evalua pe cealaltă, o singură dată per comandă.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (order_id, reviewer_id)
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id)');
  // Răspunsul public al celui evaluat (ca pe Google Maps).
  await pool.query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply TEXT');
  await pool.query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply_at TIMESTAMPTZ');

  // Logarea cu Google: contul se leagă de identificatorul Google, iar parola devine opțională.
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255) UNIQUE');
  await pool.query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');

  // Aprobarea automată: setările adminului, jurnalul deciziilor și rezumatele zilnice deja trimise.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key VARCHAR(100) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS moderation_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject_type VARCHAR(20) NOT NULL CHECK (subject_type IN ('user', 'listing')),
      subject_id UUID NOT NULL,
      outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('auto_approved', 'pending')),
      reasons TEXT[] NOT NULL DEFAULT '{}',
      ai_checked BOOLEAN NOT NULL DEFAULT false,
      edited BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_moderation_events_created ON moderation_events(created_at)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_moderation_events_subject ON moderation_events(subject_id)');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_digests (
      window_start TIMESTAMPTZ PRIMARY KEY,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Când a fost aprobat un anunț (de admin sau automat): așa știm câte anunțuri aprobate are un vânzător.
  await pool.query('ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ');
  await pool.query(`UPDATE product_listings SET approved_at = created_at WHERE approved_at IS NULL AND status IN ('active', 'paused')`);

  // Ștergerea unei comenzi o ascunde doar din istoricul celui care o șterge.
  await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS hidden_for_seller_at TIMESTAMPTZ');
  await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS hidden_for_distributor_at TIMESTAMPTZ');

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
