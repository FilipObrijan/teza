import { z } from 'zod';
import { pool } from '../db/index.js';
import { checkListingWithAI, isAIConfigured } from './ai-moderation.js';
import {
  EmailContent,
  formatNumber,
  getAdminEmails,
  notifyDistributorsNewListing,
  roleLabel,
  runInBackground,
  sendToAll,
} from './notifications.js';
import { mapRating, ratingColumns } from './ratings.js';

// ---------- Setări (modificabile de admin din panou) ----------

export const moderationSettingsSchema = z.object({
  autoApproveUsers: z.boolean(),
  autoApproveListings: z.boolean(),
  aiCheckListings: z.boolean(),
  // Vânzător de încredere: atâtea anunțuri aprobate înainte, sau o notă medie bună din destule recenzii.
  minApprovedListings: z.number().int().min(0).max(100),
  minRating: z.number().min(1).max(5),
  minReviews: z.number().int().min(1).max(100),
  // Prețul trebuie să fie între aceste multipluri ale medianei pentru același produs.
  priceRatioMin: z.number().min(0).max(1),
  priceRatioMax: z.number().min(1).max(100),
  maxQuantityKg: z.number().positive(),
  maxListingsPerHour: z.number().int().min(1).max(1000),
  bannedWords: z.array(z.string().trim().min(1).max(50)).max(200),
  // Peste atâtea evenimente pe zi nu mai trimitem emailuri individuale, ci doar rezumatul zilnic.
  digestThreshold: z.number().int().min(0).max(10000),
  // Ora (România/Moldova) la care se trimite rezumatul și începe o „zi” nouă pentru numărătoare.
  digestHour: z.number().int().min(0).max(23),
});

export type ModerationSettings = z.infer<typeof moderationSettingsSchema>;

export const DEFAULT_MODERATION_SETTINGS: ModerationSettings = {
  autoApproveUsers: true,
  autoApproveListings: true,
  aiCheckListings: true,
  minApprovedListings: 3,
  minRating: 4,
  minReviews: 3,
  priceRatioMin: 0.3,
  priceRatioMax: 3,
  maxQuantityKg: 1_000_000,
  maxListingsPerHour: 5,
  bannedWords: ['casino', 'bitcoin', 'crypto', 'viagra', 'credit rapid'],
  digestThreshold: 10,
  digestHour: 20,
};

export const getModerationSettings = async (): Promise<ModerationSettings> => {
  const result = await pool.query(`SELECT value FROM app_settings WHERE key = 'moderation'`);
  const parsed = moderationSettingsSchema.safeParse({ ...DEFAULT_MODERATION_SETTINGS, ...(result.rows[0]?.value ?? {}) });
  return parsed.success ? parsed.data : DEFAULT_MODERATION_SETTINGS;
};

export const saveModerationSettings = async (settings: ModerationSettings) => {
  await pool.query(
    `
      INSERT INTO app_settings (key, value, updated_at) VALUES ('moderation', $1, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [JSON.stringify(settings)],
  );
};

// ---------- „Ziua” de moderare: de la ora rezumatului până a doua zi la aceeași oră ----------

const TIME_ZONE = 'Europe/Bucharest';

// Începutul zilei de moderare care conține momentul `at`; `hourParam` e parametrul SQL cu ora rezumatului.
const windowStartSql = (hourParam: string, at = 'NOW()') => `
  ((date_trunc('day', ((${at}) AT TIME ZONE '${TIME_ZONE}') - make_interval(hours => ${hourParam}::int))
    + make_interval(hours => ${hourParam}::int)) AT TIME ZONE '${TIME_ZONE}')
`;

const formatDateTime = (value: Date) => value.toLocaleString('ro-RO', { timeZone: TIME_ZONE, dateStyle: 'short', timeStyle: 'short' });

// ---------- Jurnalul deciziilor și emailurile către admin ----------

type ModerationEvent = {
  subjectType: 'user' | 'listing';
  subjectId: string;
  outcome: 'auto_approved' | 'pending';
  reasons: string[];
  aiChecked?: boolean;
  edited?: boolean;
};

const describeEvent = async (event: ModerationEvent): Promise<EmailContent | null> => {
  const reasonLines = event.reasons.length ? [`Motiv: ${event.reasons.join(' ')}`] : [];

  if (event.subjectType === 'user') {
    const user = (await pool.query('SELECT full_name, email, role, region FROM users WHERE id = $1', [event.subjectId])).rows[0];
    if (!user) return null;
    const details = [`Nume: ${user.full_name}`, `Email: ${user.email}`, ...(user.region ? [`Regiune: ${user.region}`] : [])];

    return event.outcome === 'auto_approved'
      ? {
          subject: `Cont nou aprobat automat: ${user.full_name}`,
          lines: [`Un cont nou de ${roleLabel(user.role)} a fost aprobat automat, după verificarea emailului.`, ...details, 'Dacă pare suspect, îl poți bloca din Panou admin → Automatizare.'],
        }
      : {
          subject: `Cont nou de aprobat: ${user.full_name}`,
          lines: [`Un cont nou de ${roleLabel(user.role)} așteaptă aprobarea ta.`, ...details, ...reasonLines],
        };
  }

  const listing = (await pool.query(
    `
      SELECT pl.product_name, pl.variety, pl.quantity_kg, pl.price_per_kg, pl.region, u.full_name AS seller_name
      FROM product_listings pl JOIN users u ON u.id = pl.seller_id
      WHERE pl.id = $1
    `,
    [event.subjectId],
  )).rows[0];
  if (!listing) return null;
  const details = [
    `Produs: ${listing.product_name} (${listing.variety})`,
    `Cantitate: ${formatNumber(listing.quantity_kg)} kg, ${formatNumber(listing.price_per_kg)} lei/kg`,
    `Regiune: ${listing.region}`,
  ];

  return event.outcome === 'auto_approved'
    ? {
        subject: `Anunț publicat automat: ${listing.product_name}`,
        lines: [`Anunțul lui ${listing.seller_name} a trecut toate verificările${event.aiChecked ? ', inclusiv cea cu AI,' : ''} și a fost publicat.`, ...details],
      }
    : {
        subject: `${event.edited ? 'Anunț modificat' : 'Anunț nou'} de aprobat: ${listing.product_name}`,
        lines: [`${listing.seller_name} a ${event.edited ? 'modificat' : 'publicat'} un anunț care așteaptă aprobarea ta.`, ...details, ...reasonLines],
      };
};

// Salvează decizia și anunță adminul: email individual până la pragul zilnic, apoi doar rezumatul.
const recordEvent = async (event: ModerationEvent) => {
  await pool.query(
    `INSERT INTO moderation_events (subject_type, subject_id, outcome, reasons, ai_checked, edited) VALUES ($1, $2, $3, $4, $5, $6)`,
    [event.subjectType, event.subjectId, event.outcome, event.reasons, event.aiChecked ?? false, event.edited ?? false],
  );

  runInBackground('admins/moderation-event', async () => {
    const settings = await getModerationSettings();
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM moderation_events WHERE created_at >= ${windowStartSql('$1')}`,
      [settings.digestHour],
    );
    const count = Number(countResult.rows[0].count);
    const admins = await getAdminEmails();

    if (count <= settings.digestThreshold) {
      const content = await describeEvent(event);
      if (content) await sendToAll(admins, content);
    } else if (count === settings.digestThreshold + 1) {
      await sendToAll(admins, {
        subject: 'Multă activitate azi: trecem pe rezumatul zilnic',
        lines: [
          `Au fost deja peste ${settings.digestThreshold} conturi și anunțuri noi de la ora ${settings.digestHour}:00.`,
          `Până la ora ${settings.digestHour}:00 nu mai primești emailuri pentru fiecare în parte; le găsești pe toate în rezumatul zilnic.`,
          'Între timp, cele care așteaptă decizia ta apar în Panou admin.',
        ],
      });
    }
  });
};

// ---------- Conturi ----------

// Apelat după ce adresa de email a unui cont nou a fost verificată (cu cod sau prin Google). Întoarce statusul final.
export const moderateVerifiedUser = async (userId: string): Promise<string | undefined> => {
  const current = (await pool.query('SELECT status FROM users WHERE id = $1', [userId])).rows[0];
  if (current?.status !== 'pending') return current?.status;

  const settings = await getModerationSettings();
  if (!settings.autoApproveUsers) {
    await recordEvent({ subjectType: 'user', subjectId: userId, outcome: 'pending', reasons: ['Aprobarea automată a conturilor este oprită.'] });
    return 'pending';
  }

  const updated = await pool.query(`UPDATE users SET status = 'approved' WHERE id = $1 AND status = 'pending'`, [userId]);
  if (updated.rowCount === 0) return (await pool.query('SELECT status FROM users WHERE id = $1', [userId])).rows[0]?.status;

  await recordEvent({ subjectType: 'user', subjectId: userId, outcome: 'auto_approved', reasons: [] });
  return 'approved';
};

// ---------- Anunțuri ----------

const URL_PATTERN = /(https?:\/\/|www\.)|\b[a-z0-9-]+\.(com|ro|md|net|org|info|ru|eu)\b/i;
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// Numere de telefon: încep cu + sau 0 și au cel puțin 9 cifre (datele calendaristice nu se potrivesc).
const PHONE_PATTERN = /(?:\+|\b0)\d(?:[\s.\-]?\d){7,}/;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type ListingRow = Record<string, any>;

const evaluateRules = (listing: ListingRow, settings: ModerationSettings, edited: boolean) => {
  const reasons: string[] = [];

  // Un anunț deja aprobat, editat ulterior, nu mai trece prin verificarea de încredere.
  if (!(edited && listing.approved_at)) {
    const rating = mapRating(listing, 'seller');
    const trustedByListings = listing.approved_count >= settings.minApprovedListings;
    const trustedByRating = rating.count >= settings.minReviews && (rating.average ?? 0) >= settings.minRating;
    if (!trustedByListings && !trustedByRating) {
      reasons.push(`Vânzător nou: are ${listing.approved_count} din ${settings.minApprovedListings} anunțuri aprobate necesare.`);
    }
  }

  const price = Number(listing.price_per_kg);
  if (price <= 0) {
    reasons.push('Prețul este 0.');
  } else if (listing.price_samples >= 3 && Number(listing.median_price) > 0) {
    const median = Number(listing.median_price);
    const ratio = price / median;
    if (ratio < settings.priceRatioMin || ratio > settings.priceRatioMax) {
      reasons.push(`Preț neobișnuit: ${formatNumber(price)} lei/kg, față de mediana de ${formatNumber(median)} lei/kg pentru ${listing.product_name}.`);
    }
  }

  if (Number(listing.quantity_kg) > settings.maxQuantityKg) {
    reasons.push(`Cantitate foarte mare: ${formatNumber(listing.quantity_kg)} kg (limita este ${formatNumber(settings.maxQuantityKg)} kg).`);
  }

  const text = [listing.product_name, listing.variety, listing.region, listing.delivery_terms].filter(Boolean).join(' \n ');
  if (URL_PATTERN.test(text)) reasons.push('Textul conține un link.');
  if (EMAIL_PATTERN.test(text)) reasons.push('Textul conține o adresă de email.');
  if (PHONE_PATTERN.test(text)) reasons.push('Textul conține un număr de telefon.');
  const bannedWord = settings.bannedWords.find((word) => new RegExp(`(^|[^\\p{L}])${escapeRegExp(word)}($|[^\\p{L}])`, 'iu').test(text));
  if (bannedWord) reasons.push(`Textul conține un cuvânt interzis („${bannedWord}”).`);

  if (!edited && listing.recent_count > settings.maxListingsPerHour) {
    reasons.push(`Prea multe anunțuri într-o oră: ${listing.recent_count} (limita este ${settings.maxListingsPerHour}).`);
  }

  return reasons;
};

export type ListingModeration = { status: string; reasons: string[] };

// Decide dacă un anunț nou (sau unul editat) se publică automat sau așteaptă adminul.
export const moderateListing = async (listingId: string, { edited = false } = {}): Promise<ListingModeration | null> => {
  const settings = await getModerationSettings();
  const listing = (await pool.query(
    `
      SELECT pl.id, pl.seller_id, pl.product_name, pl.variety, pl.quantity_kg, pl.price_per_kg, pl.unit_measure,
             pl.region, pl.delivery_terms, pl.status, pl.approved_at, pl.image_data,
             (SELECT COUNT(*)::int FROM product_listings p WHERE p.seller_id = pl.seller_id AND p.approved_at IS NOT NULL AND p.id <> pl.id) AS approved_count,
             (SELECT COUNT(*)::int FROM product_listings p WHERE p.seller_id = pl.seller_id AND p.created_at > NOW() - INTERVAL '1 hour') AS recent_count,
             (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY p.price_per_kg) FROM product_listings p
               WHERE LOWER(TRIM(p.product_name)) = LOWER(TRIM(pl.product_name)) AND p.approved_at IS NOT NULL AND p.id <> pl.id) AS median_price,
             (SELECT COUNT(*)::int FROM product_listings p
               WHERE LOWER(TRIM(p.product_name)) = LOWER(TRIM(pl.product_name)) AND p.approved_at IS NOT NULL AND p.id <> pl.id) AS price_samples,
             ${ratingColumns('pl.seller_id', 'seller')}
      FROM product_listings pl
      WHERE pl.id = $1
    `,
    [listingId],
  )).rows[0];
  if (!listing) return null;

  if (!settings.autoApproveListings) {
    // Cu aprobarea automată oprită, editările rămân ca înainte (fără verificare).
    if (edited) return { status: listing.status, reasons: [] };
    const reasons = ['Aprobarea automată a anunțurilor este oprită.'];
    await recordEvent({ subjectType: 'listing', subjectId: listingId, outcome: 'pending', reasons });
    return { status: 'pending', reasons };
  }

  const reasons = evaluateRules(listing, settings, edited);
  let aiChecked = false;

  // AI-ul rulează doar dacă regulile gratuite au trecut, ca să nu plătim pentru anunțuri respinse oricum.
  if (reasons.length === 0 && settings.aiCheckListings && isAIConfigured()) {
    try {
      const verdict = await checkListingWithAI(
        {
          productName: listing.product_name,
          variety: listing.variety,
          region: listing.region,
          deliveryTerms: listing.delivery_terms,
          quantityKg: Number(listing.quantity_kg),
          pricePerKg: Number(listing.price_per_kg),
          unitMeasure: listing.unit_measure,
        },
        listing.image_data ?? null,
      );
      aiChecked = true;
      if (!verdict.approve) reasons.push(`AI: ${verdict.reason || 'nu a aprobat anunțul.'}`);
    } catch (error) {
      console.error('AI moderation failed:', error);
      reasons.push('Verificarea AI nu a răspuns, așa că anunțul așteaptă verificarea manuală.');
    }
  }

  if (reasons.length === 0) {
    await pool.query(
      `UPDATE product_listings SET status = 'active', approved_at = COALESCE(approved_at, NOW()) WHERE id = $1 AND status IN ('pending', 'active')`,
      [listingId],
    );
    if (listing.status === 'pending') {
      notifyDistributorsNewListing(listingId);
      await recordEvent({ subjectType: 'listing', subjectId: listingId, outcome: 'auto_approved', reasons: [], aiChecked, edited });
    }
    return { status: 'active', reasons: [] };
  }

  await pool.query(`UPDATE product_listings SET status = 'pending' WHERE id = $1 AND status IN ('pending', 'active')`, [listingId]);
  await recordEvent({ subjectType: 'listing', subjectId: listingId, outcome: 'pending', reasons, aiChecked, edited });
  return { status: 'pending', reasons };
};

// ---------- Rezumatul zilnic ----------

const loadDigestEvents = async (windowStart: Date, windowEnd: Date) => (await pool.query(
  `
    SELECT me.subject_type, me.subject_id, me.outcome, me.reasons,
           COALESCE(u.full_name, pl.product_name || ' / ' || pl.variety) AS title,
           u.role AS user_role, u.status AS user_status, pl.status AS listing_status, seller.full_name AS seller_name
    FROM moderation_events me
    LEFT JOIN users u ON me.subject_type = 'user' AND u.id = me.subject_id
    LEFT JOIN product_listings pl ON me.subject_type = 'listing' AND pl.id = me.subject_id
    LEFT JOIN users seller ON seller.id = pl.seller_id
    WHERE me.created_at >= $1 AND me.created_at < $2
    ORDER BY me.created_at
  `,
  [windowStart, windowEnd],
)).rows;

const sendDigest = async (windowStart: Date, windowEnd: Date, events: Array<Record<string, any>>) => {
  const count = (type: string, outcome: string) => events.filter((event) => event.subject_type === type && event.outcome === outcome).length;
  const queueResult = await pool.query(`
    SELECT (SELECT COUNT(*)::int FROM users WHERE status = 'pending' AND email_verified_at IS NOT NULL) AS users,
           (SELECT COUNT(*)::int FROM product_listings WHERE status = 'pending') AS listings
  `);
  const queue = queueResult.rows[0];

  const describe = (event: Record<string, any>) => (event.subject_type === 'user'
    ? `Cont: ${event.title ?? '(șters)'}${event.user_role ? ` (${roleLabel(event.user_role)})` : ''}`
    : `Anunț: ${event.title ?? '(șters)'}${event.seller_name ? ` de la ${event.seller_name}` : ''}`);
  const stillPending = events.filter((event) => event.outcome === 'pending' && (event.user_status === 'pending' || event.listing_status === 'pending'));
  const autoApproved = events.filter((event) => event.outcome === 'auto_approved');
  const limit = 25;

  await sendToAll(await getAdminEmails(), {
    subject: `Rezumatul zilei pe AgroHub: ${events.length} conturi și anunțuri noi`,
    lines: [
      `Activitatea între ${formatDateTime(windowStart)} și ${formatDateTime(windowEnd)}:`,
      `Conturi aprobate automat: ${count('user', 'auto_approved')}. Conturi trimise la verificare: ${count('user', 'pending')}.`,
      `Anunțuri publicate automat: ${count('listing', 'auto_approved')}. Anunțuri trimise la verificare: ${count('listing', 'pending')}.`,
      `Așteaptă acum decizia ta: ${queue.users} conturi și ${queue.listings} anunțuri.`,
      ...(stillPending.length ? ['De verificat:', ...stillPending.slice(0, limit).map((event) => `• ${describe(event)}: ${event.reasons.join(' ')}`)] : []),
      ...(stillPending.length > limit ? [`…și încă ${stillPending.length - limit}.`] : []),
      ...(autoApproved.length ? ['Aprobate automat:', ...autoApproved.slice(0, limit).map((event) => `• ${describe(event)}`)] : []),
      ...(autoApproved.length > limit ? [`…și încă ${autoApproved.length - limit}.`] : []),
    ],
  });
};

const sendDigestIfDue = async () => {
  const settings = await getModerationSettings();
  const windowResult = await pool.query(
    `SELECT ${windowStartSql('$1', `NOW() - INTERVAL '1 day'`)} AS window_start, ${windowStartSql('$1')} AS window_end`,
    [settings.digestHour],
  );
  const { window_start: windowStart, window_end: windowEnd } = windowResult.rows[0] as { window_start: Date; window_end: Date };

  const events = await loadDigestEvents(windowStart, windowEnd);
  // Rezumatul se „activează” doar în zilele în care s-a depășit pragul de emailuri individuale.
  if (events.length <= settings.digestThreshold) return;

  // Rezervăm atomic ziua, ca rezumatul să plece o singură dată chiar dacă rulează mai multe instanțe.
  const claim = await pool.query('INSERT INTO admin_digests (window_start) VALUES ($1) ON CONFLICT DO NOTHING RETURNING window_start', [windowStart]);
  if (claim.rowCount === 0) return;

  await sendDigest(windowStart, windowEnd, events);
};

// La cererea adminului: rezumatul zilei curente, de la ora rezumatului până acum, indiferent de prag.
export const sendDigestNow = async () => {
  const settings = await getModerationSettings();
  const windowResult = await pool.query(`SELECT ${windowStartSql('$1')} AS window_start, NOW() AS window_end`, [settings.digestHour]);
  const { window_start: windowStart, window_end: windowEnd } = windowResult.rows[0] as { window_start: Date; window_end: Date };
  const events = await loadDigestEvents(windowStart, windowEnd);
  await sendDigest(windowStart, windowEnd, events);
  return events.length;
};

// Verifică la câteva minute dacă a trecut ora rezumatului. Pe Render free, UptimeRobot ține serverul treaz;
// dacă totuși a dormit la ora respectivă, rezumatul pleacă la prima verificare după ce se trezește.
export const startDigestScheduler = () => {
  const tick = () => {
    sendDigestIfDue().catch((error) => console.error('Daily digest failed:', error));
  };
  setTimeout(tick, 30_000).unref();
  setInterval(tick, 5 * 60_000).unref();
};
