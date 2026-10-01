import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/index.js';
import { requireAuth, requireRole } from './auth.js';
import { REVIEW_COLUMNS, REVIEW_JOINS, mapReview } from './reviews.js';
import { aiProviderName, isAIConfigured } from '../util/ai-moderation.js';
import { getModerationSettings, moderationSettingsSchema, saveModerationSettings, sendDigestNow } from '../util/moderation.js';
import { notifyDistributorsNewListing } from '../util/notifications.js';

const router = Router();

const userStatusSchema = z.enum(['approved', 'rejected', 'blocked']);
const listingStatusSchema = z.enum(['active', 'paused', 'archived']);

router.use(requireAuth, requireRole(['admin']));

router.get('/users', async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;

  if (status && !['pending', 'approved', 'rejected', 'blocked'].includes(status)) {
    return res.status(400).json({ message: 'Status de utilizator invalid.' });
  }

  try {
    const result = await pool.query(
      `
        SELECT id, full_name, email, role, status, phone, region, created_at, updated_at, email_verified_at,
               (SELECT reasons FROM moderation_events me WHERE me.subject_id = users.id ORDER BY me.created_at DESC LIMIT 1) AS moderation_reasons
        FROM users
        WHERE ($1::user_status IS NULL OR status = $1::user_status)
        ORDER BY created_at ASC
      `,
      [status ?? null],
    );

    return res.status(200).json({
      users: result.rows.map((user) => ({
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        region: user.region,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        emailVerified: Boolean(user.email_verified_at),
        moderationReasons: user.moderation_reasons ?? [],
      })),
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea utilizatorilor.' });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  const statusResult = userStatusSchema.safeParse(req.body?.status);

  if (!idResult.success || !statusResult.success) {
    return res.status(400).json({
      message: 'ID sau status invalid.',
      allowedStatuses: userStatusSchema.options,
    });
  }

  try {
    const result = await pool.query(
      `
        UPDATE users
        SET status = $1
        WHERE id = $2
        RETURNING id, full_name, email, role, status, phone, region, created_at, updated_at
      `,
      [statusResult.data, idResult.data],
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
    }

    return res.status(200).json({
      message: 'Statusul utilizatorului a fost actualizat.',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        region: user.region,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({ message: 'Eroare la actualizarea statusului.' });
  }
});

router.get('/listings', async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : 'pending';

  if (!['pending', 'active', 'paused', 'archived'].includes(status)) {
    return res.status(400).json({ message: 'Status de anunț invalid.' });
  }

  try {
    const result = await pool.query(
      `
        SELECT pl.id, pl.product_name, pl.variety, pl.quantity_kg, pl.price_per_kg,
               pl.region, pl.harvest_date, pl.delivery_terms, pl.image_url, pl.status, pl.created_at,
               u.full_name AS seller_name, u.email AS seller_email,
               (SELECT reasons FROM moderation_events me WHERE me.subject_id = pl.id ORDER BY me.created_at DESC LIMIT 1) AS moderation_reasons
        FROM product_listings pl
        JOIN users u ON u.id = pl.seller_id
        WHERE pl.status = $1::listing_status
        ORDER BY pl.created_at ASC
      `,
      [status],
    );

    return res.status(200).json({
      listings: result.rows.map((listing) => ({
        id: listing.id,
        productName: listing.product_name,
        variety: listing.variety,
        quantityKg: Number(listing.quantity_kg),
        pricePerKg: Number(listing.price_per_kg),
        region: listing.region,
        harvestDate: listing.harvest_date,
        deliveryTerms: listing.delivery_terms,
        imageUrl: listing.image_url,
        status: listing.status,
        sellerName: listing.seller_name,
        sellerEmail: listing.seller_email,
        createdAt: listing.created_at,
        moderationReasons: listing.moderation_reasons ?? [],
      })),
    });
  } catch (error) {
    console.error('List pending listings error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea anunțurilor.' });
  }
});

router.patch('/listings/:id/status', async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  const statusResult = listingStatusSchema.safeParse(req.body?.status);

  if (!idResult.success || !statusResult.success) {
    return res.status(400).json({ message: 'ID sau status de anunț invalid.' });
  }

  try {
    // CTE-ul vede statusul de dinainte de UPDATE, ca să știm dacă anunțul tocmai a fost aprobat.
    const result = await pool.query(
      `
        WITH previous AS (SELECT status FROM product_listings WHERE id = $2)
        UPDATE product_listings
        SET status = $1::listing_status,
            approved_at = CASE WHEN $1::listing_status = 'active' THEN COALESCE(approved_at, NOW()) ELSE approved_at END
        WHERE id = $2
        RETURNING id, product_name, variety, quantity_kg, price_per_kg, region, status,
                  (SELECT status FROM previous) AS previous_status
      `,
      [statusResult.data, idResult.data],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Anunțul nu a fost găsit.' });
    }

    const { previous_status: previousStatus, ...listing } = result.rows[0];

    if (previousStatus === 'pending' && listing.status === 'active') {
      notifyDistributorsNewListing(listing.id);
    }

    return res.status(200).json({ listing });
  } catch (error) {
    console.error('Update listing status error:', error);
    return res.status(500).json({ message: 'Eroare la actualizarea anunțului.' });
  }
});

// Moderarea recenziilor: cele mai noi primele, cu căutare după nume, produs sau text.
router.get('/reviews', async (req, res) => {
  const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';

  try {
    const result = await pool.query(
      `
        SELECT ${REVIEW_COLUMNS} FROM reviews r ${REVIEW_JOINS}
        WHERE $1 = '' OR CONCAT_WS(' ', reviewer.full_name, reviewee.full_name, pl.product_name, r.comment, r.reply) ILIKE '%' || $1 || '%'
        ORDER BY r.updated_at DESC
        LIMIT 100
      `,
      [search],
    );
    return res.status(200).json({ reviews: result.rows.map(mapReview) });
  } catch (error) {
    console.error('Admin list reviews error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea recenziilor.' });
  }
});

router.delete('/reviews/:id', async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ message: 'ID invalid.' });

  try {
    const result = await pool.query('DELETE FROM reviews WHERE id = $1', [idResult.data]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Recenzia nu a fost găsită.' });
    return res.status(200).json({ message: 'Recenzia a fost ștearsă.' });
  } catch (error) {
    console.error('Admin delete review error:', error);
    return res.status(500).json({ message: 'Eroare la ștergerea recenziei.' });
  }
});

// Doar răspunsul, când recenzia e în regulă dar răspunsul e abuziv.
router.delete('/reviews/:id/reply', async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ message: 'ID invalid.' });

  try {
    const result = await pool.query('UPDATE reviews SET reply = NULL, reply_at = NULL WHERE id = $1', [idResult.data]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Recenzia nu a fost găsită.' });
    return res.status(200).json({ message: 'Răspunsul a fost șters.' });
  } catch (error) {
    console.error('Admin delete reply error:', error);
    return res.status(500).json({ message: 'Eroare la ștergerea răspunsului.' });
  }
});

// ---------- Aprobare automată ----------

router.get('/moderation/settings', async (_req, res) => {
  try {
    return res.status(200).json({ settings: await getModerationSettings(), aiConfigured: isAIConfigured(), aiProvider: aiProviderName() });
  } catch (error) {
    console.error('Get moderation settings error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea setărilor.' });
  }
});

router.put('/moderation/settings', async (req, res) => {
  const input = moderationSettingsSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ message: 'Setări invalide.', errors: input.error.flatten().fieldErrors });
  }
  if (input.data.priceRatioMin >= input.data.priceRatioMax) {
    return res.status(400).json({ message: 'Limita minimă de preț trebuie să fie mai mică decât cea maximă.' });
  }

  try {
    await saveModerationSettings({ ...input.data, bannedWords: [...new Set(input.data.bannedWords.map((word) => word.toLowerCase()))] });
    return res.status(200).json({ settings: await getModerationSettings(), aiConfigured: isAIConfigured(), aiProvider: aiProviderName() });
  } catch (error) {
    console.error('Save moderation settings error:', error);
    return res.status(500).json({ message: 'Eroare la salvarea setărilor.' });
  }
});

// Ultimele decizii automate, cu statusul actual al contului sau anunțului (ca adminul să poată reveni asupra lor).
router.get('/moderation/events', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT me.id, me.subject_type, me.subject_id, me.outcome, me.reasons, me.ai_checked, me.edited, me.created_at,
             u.full_name AS user_name, u.email AS user_email, u.role AS user_role, u.status AS user_status,
             pl.product_name, pl.variety, pl.status AS listing_status, seller.full_name AS seller_name
      FROM moderation_events me
      LEFT JOIN users u ON me.subject_type = 'user' AND u.id = me.subject_id
      LEFT JOIN product_listings pl ON me.subject_type = 'listing' AND pl.id = me.subject_id
      LEFT JOIN users seller ON seller.id = pl.seller_id
      ORDER BY me.created_at DESC
      LIMIT 50
    `);

    return res.status(200).json({
      events: result.rows.map((event) => ({
        id: event.id,
        subjectType: event.subject_type,
        subjectId: event.subject_id,
        outcome: event.outcome,
        reasons: event.reasons,
        aiChecked: event.ai_checked,
        edited: event.edited,
        createdAt: event.created_at,
        title: event.subject_type === 'user' ? event.user_name : event.product_name ? `${event.product_name} / ${event.variety}` : null,
        detail: event.subject_type === 'user' ? event.user_email : event.seller_name,
        role: event.user_role,
        currentStatus: event.subject_type === 'user' ? event.user_status : event.listing_status,
      })),
    });
  } catch (error) {
    console.error('List moderation events error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea activității.' });
  }
});

router.post('/moderation/digest', async (_req, res) => {
  try {
    const count = await sendDigestNow();
    return res.status(200).json({ message: `Rezumatul a fost trimis pe email (${count} ${count === 1 ? 'eveniment' : 'evenimente'} azi).` });
  } catch (error) {
    console.error('Send digest error:', error);
    return res.status(500).json({ message: 'Eroare la trimiterea rezumatului.' });
  }
});

export default router;
