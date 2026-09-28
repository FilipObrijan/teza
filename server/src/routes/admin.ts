import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/index.js';
import { requireAuth, requireRole } from './auth.js';

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
        SELECT id, full_name, email, role, status, phone, region, created_at, updated_at
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
               u.full_name AS seller_name, u.email AS seller_email
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
    const result = await pool.query(
      `
        UPDATE product_listings
        SET status = $1::listing_status
        WHERE id = $2
        RETURNING id, product_name, variety, quantity_kg, price_per_kg, region, status
      `,
      [statusResult.data, idResult.data],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Anunțul nu a fost găsit.' });
    }

    return res.status(200).json({ listing: result.rows[0] });
  } catch (error) {
    console.error('Update listing status error:', error);
    return res.status(500).json({ message: 'Eroare la actualizarea anunțului.' });
  }
});

export default router;