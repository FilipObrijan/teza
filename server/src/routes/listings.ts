import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import multer from 'multer';
import sharp from 'sharp';
import { pool } from '../db/index.js';
import { requireAuth, requireRole } from './auth.js';

const router = Router();
const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
fs.mkdirSync(uploadsDirectory, { recursive: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const storeUploadedImage = async (file: Express.Multer.File) => {
  const filename = `${crypto.randomUUID()}.webp`;
  await sharp(file.buffer).rotate().webp({ quality: 86 }).toFile(path.join(uploadsDirectory, filename));
  return `/uploads/${filename}`;
};

const listingStatusSchema = z.enum(['pending', 'active', 'paused', 'archived']);

const listingSchema = z.object({
  productName: z.string().trim().min(2).max(150),
  variety: z.string().trim().min(2).max(150),
  quantityKg: z.coerce.number().positive(),
  pricePerKg: z.coerce.number().nonnegative(),
  unitMeasure: z.string().trim().min(1).max(20).default('kg'),
  region: z.string().trim().min(2).max(100),
  harvestDate: z.string().date().optional().nullable(),
  deliveryTerms: z.string().trim().max(255).optional().nullable(),
});

const statusUpdateSchema = z.object({
  status: listingStatusSchema,
});

const stockUpdateSchema = z.object({
  deltaQuantityKg: z.number().refine((value) => value !== 0, 'Modificarea nu poate fi zero.'),
  reason: z.string().trim().min(2).max(100),
});

const mapListing = (listing: Record<string, unknown>) => ({
  id: listing.id,
  sellerId: listing.seller_id,
  sellerName: listing.seller_name,
  sellerEmail: listing.seller_email,
  sellerPhone: listing.seller_phone,
  productName: listing.product_name,
  variety: listing.variety,
  quantityKg: listing.quantity_kg,
  pricePerKg: listing.price_per_kg,
  unitMeasure: listing.unit_measure,
  region: listing.region,
  harvestDate: listing.harvest_date,
  deliveryTerms: listing.delivery_terms,
  imageUrl: listing.image_url,
  status: listing.status,
  createdAt: listing.created_at,
  updatedAt: listing.updated_at,
});

router.get('/', async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : 'active';
  const region = typeof req.query.region === 'string' ? req.query.region.trim() : null;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : null;

  if (!listingStatusSchema.safeParse(status).success) {
    return res.status(400).json({ message: 'Status de ofertă invalid.' });
  }

  try {
    const result = await pool.query(
      `
        SELECT pl.*, u.full_name AS seller_name, u.email AS seller_email, u.phone AS seller_phone
        FROM product_listings pl
        JOIN users u ON u.id = pl.seller_id
        WHERE pl.status = $1::listing_status
          AND ($2::text IS NULL OR pl.region ILIKE '%' || $2 || '%')
          AND ($3::text IS NULL OR pl.product_name ILIKE '%' || $3 || '%' OR pl.variety ILIKE '%' || $3 || '%')
        ORDER BY pl.created_at DESC
      `,
      [status, region || null, search || null],
    );

    return res.status(200).json({ listings: result.rows.map(mapListing) });
  } catch (error) {
    console.error('List listings error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea ofertelor.' });
  }
});

router.get('/:id/image', async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ message: 'ID invalid.' });

  try {
    const result = await pool.query('SELECT image_url FROM product_listings WHERE id = $1', [idResult.data]);
    const imageUrl = result.rows[0]?.image_url;
    if (!imageUrl) return res.status(404).json({ message: 'Oferta nu are fotografie.' });

    const filename = path.basename(String(imageUrl));
    return res.sendFile(path.join(uploadsDirectory, filename));
  } catch (error) {
    console.error('Get listing image error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea fotografiei.' });
  }
});

router.post('/', requireAuth, requireRole(['seller']), upload.single('image'), async (req, res) => {
  const input = listingSchema.safeParse(req.body);

  if (!input.success) {
    return res.status(400).json({
      message: 'Datele ofertei nu sunt valide.',
      errors: input.error.flatten().fieldErrors,
    });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Fotografia produsului este obligatorie.' });
  }

  try {
    const imageUrl = await storeUploadedImage(req.file);
    const sellerResult = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'seller' AND status = 'approved'`,
      [req.user?.sub],
    );

    if (sellerResult.rowCount === 0) {
      return res.status(403).json({ message: 'Contul de vânzător nu este aprobat.' });
    }

    const result = await pool.query(
      `
        INSERT INTO product_listings
          (seller_id, product_name, variety, quantity_kg, price_per_kg, unit_measure, region, harvest_date, delivery_terms, image_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
        RETURNING *
      `,
      [
        req.user?.sub,
        input.data.productName,
        input.data.variety,
        input.data.quantityKg,
        input.data.pricePerKg,
        input.data.unitMeasure,
        input.data.region,
        input.data.harvestDate ?? null,
        input.data.deliveryTerms ?? null,
        imageUrl,
      ],
    );

    return res.status(201).json({ listing: mapListing(result.rows[0]) });
  } catch (error) {
    console.error('Create listing error:', error);
    return res.status(500).json({ message: 'Eroare la crearea ofertei.' });
  }
});

router.patch('/:id', requireAuth, requireRole(['seller']), upload.single('image'), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  const input = listingSchema.safeParse(req.body);

  if (!idResult.success || !input.success) {
    return res.status(400).json({ message: 'ID sau date invalide pentru editarea ofertei.' });
  }

  try {
    const imageUrl = req.file ? await storeUploadedImage(req.file) : null;
    const result = await pool.query(
      `
        UPDATE product_listings
        SET product_name = $1,
            variety = $2,
            quantity_kg = $3,
            price_per_kg = $4,
            unit_measure = $5,
            region = $6,
            harvest_date = $7,
            delivery_terms = $8,
            image_url = COALESCE($9, image_url),
            updated_at = NOW()
          WHERE id = $10 AND seller_id = $11
        RETURNING *
      `,
      [
        input.data.productName,
        input.data.variety,
        input.data.quantityKg,
        input.data.pricePerKg,
        input.data.unitMeasure,
        input.data.region,
        input.data.harvestDate ?? null,
        input.data.deliveryTerms ?? null,
        imageUrl,
        idResult.data,
        req.user?.sub,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Oferta nu a fost găsită sau nu îți aparține.' });
    }

    return res.status(200).json({ listing: mapListing(result.rows[0]) });
  } catch (error) {
    console.error('Update listing error:', error);
    return res.status(500).json({ message: 'Eroare la editarea ofertei.' });
  }
});

router.delete('/:id', requireAuth, requireRole(['seller', 'admin']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({ message: 'ID invalid.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const listingResult = await client.query(
      `SELECT id FROM product_listings WHERE id = $1 AND ($2::user_role = 'admin' OR seller_id = $3) FOR UPDATE`,
      [idResult.data, req.user?.role, req.user?.sub],
    );

    if (listingResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Oferta nu a fost găsită sau nu îți aparține.' });
    }

    const orderResult = await client.query('SELECT 1 FROM orders WHERE listing_id = $1 LIMIT 1', [idResult.data]);
    if (orderResult.rowCount && orderResult.rowCount > 0) {
      await client.query(
        `UPDATE product_listings SET status = 'archived'::listing_status, updated_at = NOW() WHERE id = $1`,
        [idResult.data],
      );
      await client.query('COMMIT');
      return res.status(200).json({ message: 'Anunțul a fost arhivat și eliminat din lista ta.' });
    }

    await client.query('DELETE FROM product_listings WHERE id = $1', [idResult.data]);
    await client.query('COMMIT');
    return res.status(200).json({ message: 'Anunțul a fost șters.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete listing error:', error);
    return res.status(500).json({ message: 'Eroare la ștergerea ofertei.' });
  } finally {
    client.release();
  }
});

router.patch('/:id/status', requireAuth, requireRole(['seller', 'admin']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  const input = statusUpdateSchema.safeParse(req.body);

  if (!idResult.success || !input.success) {
    return res.status(400).json({ message: 'ID sau status invalid.' });
  }

  try {
    const result = await pool.query(
      `
        UPDATE product_listings
        SET status = $1::listing_status
        WHERE id = $2
          AND ($3::user_role = 'admin' OR seller_id = $4)
        RETURNING *
      `,
      [input.data.status, idResult.data, req.user?.role, req.user?.sub],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Oferta nu a fost găsită sau nu îți aparține.' });
    }

    return res.status(200).json({ listing: mapListing(result.rows[0]) });
  } catch (error) {
    console.error('Update listing status error:', error);
    return res.status(500).json({ message: 'Eroare la actualizarea ofertei.' });
  }
});

router.patch('/:id/stock', requireAuth, requireRole(['seller', 'admin']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  const input = stockUpdateSchema.safeParse(req.body);

  if (!idResult.success || !input.success) {
    return res.status(400).json({ message: 'ID sau modificare de stoc invalidă.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const listingResult = await client.query(
      `
        SELECT id, seller_id, quantity_kg
        FROM product_listings
        WHERE id = $1
          AND ($2::user_role = 'admin' OR seller_id = $3)
        FOR UPDATE
      `,
      [idResult.data, req.user?.role, req.user?.sub],
    );

    const listing = listingResult.rows[0];

    if (!listing) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Oferta nu a fost găsită sau nu îți aparține.' });
    }

    const newQuantity = Number(listing.quantity_kg) + input.data.deltaQuantityKg;

    if (newQuantity <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Stocul rezultat trebuie să fie mai mare decât zero.' });
    }

    const updatedListing = await client.query(
      `UPDATE product_listings SET quantity_kg = $1 WHERE id = $2 RETURNING *`,
      [newQuantity, idResult.data],
    );

    await client.query(
      `
        INSERT INTO inventory_events (listing_id, delta_quantity_kg, reason, created_by)
        VALUES ($1, $2, $3, $4)
      `,
      [idResult.data, input.data.deltaQuantityKg, input.data.reason, req.user?.sub],
    );

    await client.query('COMMIT');

    return res.status(200).json({
      listing: mapListing(updatedListing.rows[0]),
      stockChange: input.data.deltaQuantityKg,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update listing stock error:', error);
    return res.status(500).json({ message: 'Eroare la actualizarea stocului.' });
  } finally {
    client.release();
  }
});

export default router;