import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/index.js';
import { notifyNewReview, notifyReviewReply } from '../util/notifications.js';
import { mapRating, ratingColumns } from '../util/ratings.js';
import { requireAuth, requireRole } from './auth.js';

const router = Router();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().nullable(),
});

const replySchema = z.object({ reply: z.string().trim().min(1).max(1000) });

// Coloanele comune pentru afișarea unei recenzii, cu ambele părți și produsul comenzii.
export const REVIEW_COLUMNS = `
  r.id, r.order_id, r.rating, r.comment, r.reply, r.reply_at, r.created_at, r.updated_at,
  r.reviewer_id, reviewer.full_name AS reviewer_name, reviewer.role AS reviewer_role,
  r.reviewee_id, reviewee.full_name AS reviewee_name, reviewee.role AS reviewee_role,
  pl.product_name
`;
export const REVIEW_JOINS = `
  JOIN users reviewer ON reviewer.id = r.reviewer_id
  JOIN users reviewee ON reviewee.id = r.reviewee_id
  JOIN orders o ON o.id = r.order_id
  JOIN product_listings pl ON pl.id = o.listing_id
`;
export const mapReview = (review: Record<string, any>) => ({
  id: review.id,
  orderId: review.order_id,
  rating: review.rating,
  comment: review.comment,
  reply: review.reply,
  replyAt: review.reply_at,
  reviewerId: review.reviewer_id,
  reviewerName: review.reviewer_name,
  reviewerRole: review.reviewer_role,
  revieweeId: review.reviewee_id,
  revieweeName: review.reviewee_name,
  revieweeRole: review.reviewee_role,
  productName: review.product_name,
  createdAt: review.created_at,
  updatedAt: review.updated_at,
});

// Doar comenzile acceptate pot fi evaluate: așa recenziile vin numai de la parteneri reali.
const REVIEWABLE_STATUSES = ['confirmed', 'completed'];

// Partenerul pe care îl evaluează utilizatorul curent, pentru o comandă la care participă.
const getReviewTarget = async (orderId: string, userId: string, role: 'seller' | 'distributor') => {
  const result = await pool.query(
    `
      SELECT o.status, CASE WHEN $2 = 'seller' THEN o.distributor_id ELSE pl.seller_id END AS reviewee_id
      FROM orders o
      JOIN product_listings pl ON pl.id = o.listing_id
      WHERE o.id = $1 AND ($2 = 'seller' AND pl.seller_id = $3 OR $2 = 'distributor' AND o.distributor_id = $3)
    `,
    [orderId, role, userId],
  );
  return result.rows[0] as { status: string; reviewee_id: string } | undefined;
};

// Public: recenziile primite de un vânzător sau distribuitor, cele mai noi primele.
router.get('/users/:id/reviews', async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ message: 'ID invalid.' });

  try {
    const userResult = await pool.query(
      `SELECT id, full_name, role, region, created_at, ${ratingColumns('users.id', 'user')} FROM users WHERE id = $1 AND role <> 'admin'`,
      [idResult.data],
    );
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });

    const reviewsResult = await pool.query(
      `SELECT ${REVIEW_COLUMNS} FROM reviews r ${REVIEW_JOINS} WHERE r.reviewee_id = $1 ORDER BY r.updated_at DESC LIMIT 100`,
      [idResult.data],
    );

    return res.status(200).json({
      user: { id: user.id, fullName: user.full_name, role: user.role, region: user.region, memberSince: user.created_at },
      rating: mapRating(user, 'user'),
      reviews: reviewsResult.rows.map(mapReview),
    });
  } catch (error) {
    console.error('List reviews error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea recenziilor.' });
  }
});

// Recenzia lăsată de utilizatorul curent pentru o comandă (pentru editare).
router.get('/orders/:id/review', requireAuth, requireRole(['seller', 'distributor']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  if (!idResult.success || !req.user || req.user.role === 'admin') return res.status(400).json({ message: 'ID invalid.' });

  try {
    const target = await getReviewTarget(idResult.data, req.user.sub, req.user.role);
    if (!target) return res.status(404).json({ message: 'Comanda nu a fost găsită.' });

    const result = await pool.query('SELECT rating, comment FROM reviews WHERE order_id = $1 AND reviewer_id = $2', [idResult.data, req.user.sub]);
    return res.status(200).json({ review: result.rows[0] ?? null });
  } catch (error) {
    console.error('Get own review error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea recenziei.' });
  }
});

// Lasă sau modifică recenzia pentru partenerul unei comenzi acceptate.
router.post('/orders/:id/review', requireAuth, requireRole(['seller', 'distributor']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  const input = reviewSchema.safeParse(req.body);
  if (!idResult.success || !input.success || !req.user || req.user.role === 'admin') {
    return res.status(400).json({ message: 'Alege între 1 și 5 stele; comentariul poate avea cel mult 1000 de caractere.' });
  }

  try {
    const target = await getReviewTarget(idResult.data, req.user.sub, req.user.role);
    if (!target) return res.status(404).json({ message: 'Comanda nu a fost găsită.' });
    if (!REVIEWABLE_STATUSES.includes(target.status)) {
      return res.status(400).json({ message: 'Poți lăsa o recenzie doar pentru o comandă acceptată.' });
    }

    // La editare, rândul se schimbă (și se trimite email) doar dacă nota sau comentariul diferă.
    const saved = await pool.query(
      `
        INSERT INTO reviews (order_id, reviewer_id, reviewee_id, rating, comment)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (order_id, reviewer_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
        WHERE (reviews.rating, reviews.comment) IS DISTINCT FROM (EXCLUDED.rating, EXCLUDED.comment)
        RETURNING id, (xmax = 0) AS inserted
      `,
      [idResult.data, req.user.sub, target.reviewee_id, input.data.rating, input.data.comment || null],
    );
    if (saved.rows[0]) notifyNewReview(saved.rows[0].id, { updated: !saved.rows[0].inserted });
    return res.status(200).json({ message: 'Recenzia a fost salvată.' });
  } catch (error) {
    console.error('Save review error:', error);
    return res.status(500).json({ message: 'Eroare la salvarea recenziei.' });
  }
});

// Recenziile mele: cele primite (la care pot răspunde) și cele lăsate de mine.
router.get('/me/reviews', requireAuth, requireRole(['seller', 'distributor']), async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Autentificare necesară.' });

  try {
    const [ratingResult, receivedResult, givenResult] = await Promise.all([
      pool.query(`SELECT ${ratingColumns('users.id', 'user')} FROM users WHERE id = $1`, [req.user.sub]),
      pool.query(`SELECT ${REVIEW_COLUMNS} FROM reviews r ${REVIEW_JOINS} WHERE r.reviewee_id = $1 ORDER BY r.updated_at DESC`, [req.user.sub]),
      pool.query(`SELECT ${REVIEW_COLUMNS} FROM reviews r ${REVIEW_JOINS} WHERE r.reviewer_id = $1 ORDER BY r.updated_at DESC`, [req.user.sub]),
    ]);

    return res.status(200).json({
      rating: mapRating(ratingResult.rows[0] ?? {}, 'user'),
      received: receivedResult.rows.map(mapReview),
      given: givenResult.rows.map(mapReview),
    });
  } catch (error) {
    console.error('My reviews error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea recenziilor.' });
  }
});

// Răspunsul public al celui evaluat; se poate modifica oricând.
router.put('/reviews/:id/reply', requireAuth, requireRole(['seller', 'distributor']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  const input = replySchema.safeParse(req.body);
  if (!idResult.success || !input.success || !req.user) {
    return res.status(400).json({ message: 'Răspunsul trebuie să aibă între 1 și 1000 de caractere.' });
  }

  try {
    const existing = await pool.query('SELECT reply FROM reviews WHERE id = $1 AND reviewee_id = $2', [idResult.data, req.user.sub]);
    if (!existing.rows[0]) return res.status(404).json({ message: 'Recenzia nu a fost găsită.' });

    if (existing.rows[0].reply !== input.data.reply) {
      await pool.query('UPDATE reviews SET reply = $1, reply_at = NOW() WHERE id = $2', [input.data.reply, idResult.data]);
      notifyReviewReply(idResult.data);
    }
    return res.status(200).json({ message: 'Răspunsul a fost publicat.' });
  } catch (error) {
    console.error('Save reply error:', error);
    return res.status(500).json({ message: 'Eroare la salvarea răspunsului.' });
  }
});

router.delete('/reviews/:id/reply', requireAuth, requireRole(['seller', 'distributor']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  if (!idResult.success || !req.user) return res.status(400).json({ message: 'ID invalid.' });

  try {
    const result = await pool.query('UPDATE reviews SET reply = NULL, reply_at = NULL WHERE id = $1 AND reviewee_id = $2', [idResult.data, req.user.sub]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Recenzia nu a fost găsită.' });
    return res.status(200).json({ message: 'Răspunsul a fost șters.' });
  } catch (error) {
    console.error('Delete reply error:', error);
    return res.status(500).json({ message: 'Eroare la ștergerea răspunsului.' });
  }
});

export default router;
