import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/index.js';
import { mapRating, ratingColumns } from '../util/ratings.js';
import { requireAuth, requireRole } from './auth.js';

const router = Router();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().nullable(),
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
      `
        SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at,
               reviewer.full_name AS reviewer_name, reviewer.role AS reviewer_role, pl.product_name
        FROM reviews r
        JOIN users reviewer ON reviewer.id = r.reviewer_id
        JOIN orders o ON o.id = r.order_id
        JOIN product_listings pl ON pl.id = o.listing_id
        WHERE r.reviewee_id = $1
        ORDER BY r.updated_at DESC
        LIMIT 100
      `,
      [idResult.data],
    );

    return res.status(200).json({
      user: { id: user.id, fullName: user.full_name, role: user.role, region: user.region, memberSince: user.created_at },
      rating: mapRating(user, 'user'),
      reviews: reviewsResult.rows.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reviewerName: review.reviewer_name,
        reviewerRole: review.reviewer_role,
        productName: review.product_name,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
      })),
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

    await pool.query(
      `
        INSERT INTO reviews (order_id, reviewer_id, reviewee_id, rating, comment)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (order_id, reviewer_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
      `,
      [idResult.data, req.user.sub, target.reviewee_id, input.data.rating, input.data.comment || null],
    );
    return res.status(200).json({ message: 'Recenzia a fost salvată.' });
  } catch (error) {
    console.error('Save review error:', error);
    return res.status(500).json({ message: 'Eroare la salvarea recenziei.' });
  }
});

export default router;
