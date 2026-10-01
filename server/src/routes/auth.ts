import { NextFunction, Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { createHash, randomInt } from 'node:crypto';
import { z } from 'zod';
import { env } from '../config/env.js';
import { pool } from '../db/index.js';
import { comparePassword, hashPassword, signToken, verifyToken } from '../util/auth.js';
import { sendPasswordResetCode, sendVerificationCode } from '../util/email.js';
import { getModerationSettings, moderateVerifiedUser } from '../util/moderation.js';

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

type SessionUser = {
  id: string;
  full_name: string;
  email: string;
  role: 'seller' | 'distributor' | 'admin';
  status: string;
  phone: string | null;
  region: string | null;
  email_verified_at: string | null;
  created_at: string;
};

// Răspunsul comun pentru orice logare reușită (parolă sau Google): contul trebuie să fie aprobat.
const sendSession = (res: Response, user: SessionUser) => {
  if (user.status !== 'approved') {
    return res.status(403).json({ message: 'Contul nu este încă aprobat de administrator.' });
  }

  return res.status(200).json({
    token: signToken({ sub: user.id, email: user.email, role: user.role }),
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
};

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

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autentificare lipsă.' });
  }

  let payload: ReturnType<typeof verifyToken>;
  try {
    payload = verifyToken(authHeader.slice(7));
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ message: 'Token invalid sau expirat.' });
  }

  // Un cont blocat de admin pierde accesul imediat, nu abia când îi expiră tokenul.
  try {
    const result = await pool.query('SELECT status FROM users WHERE id = $1', [payload.sub]);
    if (result.rows[0]?.status !== 'approved') {
      return res.status(403).json({ message: 'Contul tău nu este activ. Contactează administratorul.' });
    }
  } catch (error) {
    console.error('Account status check failed:', error);
    return res.status(500).json({ message: 'Eroare la verificarea contului.' });
  }

  req.user = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  };

  return next();
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
    const { autoApproveUsers } = await getModerationSettings();

    return res.status(201).json({
      verificationRequired: true,
      message: autoApproveUsers
        ? 'Cont creat. Introdu codul primit pe email ca să-l activezi.'
        : 'Cont creat. Verifică emailul cu codul primit, apoi așteaptă aprobarea administratorului.',
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

    if (!user.password_hash) {
      return res.status(401).json({ message: 'Acest cont folosește logarea cu Google. Apasă „Continuă cu Google” sau setează o parolă din „Ai uitat parola?”.' });
    }

    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email sau parolă incorecte.' });
    }

    if (!user.email_verified_at) {
      return res.status(403).json({ message: 'Verifică mai întâi adresa de email.' });
    }

    return sendSession(res, user);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Eroare la autentificare.' });
  }
});

const googleSchema = z.object({
  credential: z.string().min(10),
  // Rolul se cere doar la prima logare, când contul e creat.
  role: z.enum(['seller', 'distributor']).optional(),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  region: z.string().trim().max(100).optional().or(z.literal('')),
});

const googleClient = new OAuth2Client();

router.post('/google', loginLimiter, async (req, res) => {
  if (!env.googleClientId) {
    return res.status(503).json({ message: 'Logarea cu Google nu este configurată.' });
  }

  const input = googleSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ message: 'Date invalide pentru logarea cu Google.' });
  }

  // Tokenul vine de la Google prin browser; verificăm semnătura și că a fost emis pentru aplicația noastră.
  let payload: TokenPayload | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: input.data.credential, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch (error) {
    console.error('Google token verification failed:', error);
    return res.status(401).json({ message: 'Autentificarea cu Google a eșuat. Încearcă din nou.' });
  }

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    return res.status(401).json({ message: 'Contul Google nu are o adresă de email verificată.' });
  }

  const googleSub = payload.sub;
  const email = payload.email.toLowerCase();
  const fullName = (payload.name ?? email.split('@')[0]).slice(0, 150);

  try {
    const existingResult = await pool.query(
      `
        SELECT id, full_name, email, role, status, phone, region, email_verified_at, created_at, google_sub
        FROM users
        WHERE google_sub = $1 OR email = $2
        ORDER BY (google_sub = $1) DESC NULLS LAST
        LIMIT 1
      `,
      [googleSub, email],
    );
    const existing = existingResult.rows[0];

    if (existing) {
      if (existing.google_sub && existing.google_sub !== googleSub) {
        return res.status(409).json({ message: 'Adresa de email este deja legată de alt cont Google.' });
      }

      // Cont creat cu email și parolă: îl legăm de Google. Google a verificat deja adresa de email.
      const wasUnverified = !existing.email_verified_at;
      const linked = await pool.query(
        `
          UPDATE users SET google_sub = $1, email_verified_at = COALESCE(email_verified_at, NOW())
          WHERE id = $2
          RETURNING id, full_name, email, role, status, phone, region, email_verified_at, created_at
        `,
        [googleSub, existing.id],
      );
      const user = linked.rows[0];
      if (wasUnverified) user.status = (await moderateVerifiedUser(existing.id)) ?? user.status;
      return sendSession(res, user);
    }

    // Cont nou: clientul trebuie să ne spună întâi rolul (vânzător sau distribuitor).
    if (!input.data.role) {
      return res.status(200).json({ needsRole: true, fullName, email });
    }

    const created = await pool.query(
      `
        INSERT INTO users (full_name, email, password_hash, role, phone, region, status, email_verified_at, google_sub)
        VALUES ($1, $2, NULL, $3, $4, $5, 'pending', NOW(), $6)
        RETURNING id, full_name, email, role, status, phone, region, email_verified_at, created_at
      `,
      [fullName, email, input.data.role, input.data.phone || null, input.data.region || null, googleSub],
    );
    const user = created.rows[0];
    user.status = (await moderateVerifiedUser(user.id)) ?? user.status;
    if (user.status === 'approved') return sendSession(res, user);

    return res.status(201).json({
      pendingApproval: true,
      message: 'Cont creat cu Google. Vei putea intra după ce administratorul îl aprobă.',
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ message: 'Eroare la logarea cu Google.' });
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
    const status = await moderateVerifiedUser(token.user_id);
    return res.status(200).json({
      approved: status === 'approved',
      message: status === 'approved'
        ? 'Email verificat. Contul este activ, te poți autentifica.'
        : 'Email verificat. Contul așteaptă aprobarea administratorului.',
    });
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
