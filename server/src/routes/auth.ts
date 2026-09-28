import { NextFunction, Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createHash, randomInt } from 'node:crypto';
import { z } from 'zod';
import { pool } from '../db/index.js';
import { comparePassword, hashPassword, signToken, verifyToken } from '../util/auth.js';
import { sendPasswordResetCode, sendVerificationCode } from '../util/email.js';
import { notifyAdminsPendingUser } from '../util/notifications.js';

const router = Router();

const limitReached = { message: 'Prea multe încercări. Încearcă din nou peste câteva minute.' };

// Limitează încercările de parole ghicite.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: limitReached });
// Limitează rutele care trimit emailuri, ca să nu poată fi folosite pentru spam.
const emailLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false, message: limitReached });

const passwordSchema = z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere').max(128);

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Numele este prea scurt'),
  email: z.string().trim().email('Email invalid'),
  password: passwordSchema,
  role: z.enum(['seller', 'distributor']),
  phone: z.string().trim().optional().or(z.literal('')),
  region: z.string().trim().optional().or(z.literal('')),
});

const loginSchema = z.object({
  email: z.string().trim().email('Email invalid'),
  password: z.string().min(1, 'Parola este obligatorie'),
});

const verificationSchema = z.object({
  email: z.string().trim().email('Email invalid'),
  code: z.string().trim().regex(/^\d{6}$/, 'Codul trebuie să aibă 6 cifre'),
});

const emailOnlySchema = z.object({ email: z.string().trim().email('Email invalid') });

const resetPasswordSchema = verificationSchema.extend({ password: passwordSchema });

const hashVerificationCode = (code: string) => createHash('sha256').update(code).digest('hex');

const generateCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

const issueVerificationCode = async (userId: string, email: string) => {
  const code = generateCode();
  await pool.query(
    `UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
    [userId],
  );
  await pool.query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
    [userId, hashVerificationCode(code)],
  );
  await sendVerificationCode(email, code);
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autentificare lipsă.' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    req.user = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ message: 'Token invalid sau expirat.' });
  }
};

export const requireRole = (roles: Array<'seller' | 'distributor' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Autentificare necesară.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Nu ai permisiunea necesară.' });
    }

    return next();
  };
};

router.post('/register', emailLimiter, async (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Datele introduse nu sunt valide.',
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { fullName, email, password, role, phone, region } = result.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);

    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ message: 'Există deja un utilizator cu acest email.' });
    }

    const passwordHash = await hashPassword(password);

    const userResult = await pool.query(
      `
        INSERT INTO users (full_name, email, password_hash, role, phone, region, status, email_verified_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', NULL)
        RETURNING id, full_name, email, role, status, phone, region, email_verified_at, created_at
      `,
      [fullName, normalizedEmail, passwordHash, role, phone || null, region || null],
    );

    const user = userResult.rows[0];
    await issueVerificationCode(user.id, user.email);

    return res.status(201).json({
      verificationRequired: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        region: user.region,
        emailVerifiedAt: user.email_verified_at,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Eroare la crearea contului.' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Datele de autentificare nu sunt valide.',
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { email, password } = result.data;

  try {
    const userResult = await pool.query(
      `
        SELECT id, full_name, email, password_hash, role, status, phone, region, email_verified_at, created_at
        FROM users
        WHERE email = $1
      `,
      [email.toLowerCase()],
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Email sau parolă incorecte.' });
    }

    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email sau parolă incorecte.' });
    }

    if (!user.email_verified_at) {
      return res.status(403).json({ message: 'Verifică mai întâi adresa de email.' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({
        message: 'Contul nu este încă aprobat de administrator.',
      });
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        region: user.region,
        emailVerifiedAt: user.email_verified_at,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Eroare la autentificare.' });
  }
});

router.post('/verify-email', loginLimiter, async (req, res) => {
  const result = verificationSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ message: 'Email sau cod invalid.' });
  }

  const normalizedEmail = result.data.email.toLowerCase();
  const tokenHash = hashVerificationCode(result.data.code);
  const client = await pool.connect();

  try {
    const tokenResult = await client.query(
      `
        SELECT evt.id, evt.user_id
        FROM email_verification_tokens evt
        JOIN users u ON u.id = evt.user_id
        WHERE u.email = $1
          AND evt.token_hash = $2
          AND evt.used_at IS NULL
          AND evt.expires_at > NOW()
          AND evt.attempts < 5
      `,
      [normalizedEmail, tokenHash],
    );

    if (tokenResult.rowCount === 0) {
      await client.query(
        `UPDATE email_verification_tokens evt SET attempts = attempts + 1 FROM users u WHERE evt.user_id = u.id AND u.email = $1 AND evt.used_at IS NULL AND evt.expires_at > NOW() AND evt.attempts < 5`,
        [normalizedEmail],
      );
      return res.status(400).json({ message: 'Cod invalid, expirat sau prea multe încercări.' });
    }

    const token = tokenResult.rows[0];
    await client.query('BEGIN');
    await client.query('UPDATE users SET email_verified_at = NOW() WHERE id = $1', [token.user_id]);
    await client.query('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1', [token.id]);
    await client.query('COMMIT');
    notifyAdminsPendingUser(token.user_id);
    return res.status(200).json({ message: 'Email verificat. Poți continua autentificarea.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.error('Verify email error:', error);
    return res.status(500).json({ message: 'Eroare la verificarea emailului.' });
  } finally {
    client.release();
  }
});

// Răspunsurile sunt identice indiferent dacă emailul există, ca să nu se poată afla cine are cont.
router.post('/resend-code', emailLimiter, async (req, res) => {
  const result = emailOnlySchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ message: 'Email invalid.' });
  }

  try {
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1 AND email_verified_at IS NULL',
      [result.data.email.toLowerCase()],
    );
    const user = userResult.rows[0];

    if (user) {
      await issueVerificationCode(user.id, user.email);
    }

    return res.status(200).json({ message: 'Dacă adresa are un cont neverificat, am trimis un cod nou.' });
  } catch (error) {
    console.error('Resend verification code error:', error);
    return res.status(500).json({ message: 'Eroare la trimiterea codului.' });
  }
});

router.post('/forgot-password', emailLimiter, async (req, res) => {
  const result = emailOnlySchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ message: 'Email invalid.' });
  }

  try {
    const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [result.data.email.toLowerCase()]);
    const user = userResult.rows[0];

    if (user) {
      const code = generateCode();
      await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [user.id]);
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
        [user.id, hashVerificationCode(code)],
      );
      await sendPasswordResetCode(user.email, code);
    }

    return res.status(200).json({ message: 'Dacă adresa are un cont, am trimis un cod pentru resetarea parolei.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Eroare la trimiterea codului.' });
  }
});

router.post('/reset-password', loginLimiter, async (req, res) => {
  const result = resetPasswordSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    return res.status(400).json({ message: errors.password?.[0] ?? 'Email sau cod invalid.' });
  }

  const normalizedEmail = result.data.email.toLowerCase();
  const client = await pool.connect();

  try {
    const tokenResult = await client.query(
      `
        SELECT prt.id, prt.user_id
        FROM password_reset_tokens prt
        JOIN users u ON u.id = prt.user_id
        WHERE u.email = $1
          AND prt.token_hash = $2
          AND prt.used_at IS NULL
          AND prt.expires_at > NOW()
          AND prt.attempts < 5
      `,
      [normalizedEmail, hashVerificationCode(result.data.code)],
    );

    if (tokenResult.rowCount === 0) {
      await client.query(
        `UPDATE password_reset_tokens prt SET attempts = attempts + 1 FROM users u WHERE prt.user_id = u.id AND u.email = $1 AND prt.used_at IS NULL AND prt.expires_at > NOW() AND prt.attempts < 5`,
        [normalizedEmail],
      );
      return res.status(400).json({ message: 'Cod invalid, expirat sau prea multe încercări.' });
    }

    const token = tokenResult.rows[0];
    const passwordHash = await hashPassword(result.data.password);
    await client.query('BEGIN');
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, token.user_id]);
    await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [token.id]);
    await client.query('COMMIT');
    return res.status(200).json({ message: 'Parola a fost schimbată. Acum te poți autentifica.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Eroare la resetarea parolei.' });
  } finally {
    client.release();
  }
});

router.get('/me', requireAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autentificare necesară.' });
  }

  try {
    const userResult = await pool.query(
      `
        SELECT id, full_name, email, role, status, phone, region, created_at
        FROM users
        WHERE id = $1
      `,
      [req.user.sub],
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        region: user.region,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea utilizatorului.' });
  }
});

export default router;
