import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/index.js';
import { requireAuth, requireRole } from './auth.js';
import { notifyDistributorOrderStatus, notifySellerOrder } from '../util/notifications.js';

const router = Router();

const createOrderSchema = z.object({
  listingId: z.string().uuid(),
  quantityKg: z.number().positive(),
  notes: z.string().trim().max(500).optional().nullable(),
});

const orderStatusSchema = z.enum(['pending', 'confirmed', 'rejected']);
const messageSchema = z.object({ content: z.string().trim().min(1).max(2000) });
const editOrderSchema = z.object({
  quantityKg: z.number().positive(),
  notes: z.string().trim().max(500).optional().nullable(),
});

const getOrderParticipant = async (orderId: string, userId: string, role: 'seller' | 'distributor') => {
  const result = await pool.query(
    `
      SELECT o.id, o.distributor_id, pl.seller_id
      FROM orders o
      JOIN product_listings pl ON pl.id = o.listing_id
      WHERE o.id = $1 AND ($2 = 'seller' AND pl.seller_id = $3 OR $2 = 'distributor' AND o.distributor_id = $3)
    `,
    [orderId, role, userId],
  );
  return result.rows[0] as { id: string; distributor_id: string; seller_id: string } | undefined;
};

router.post('/', requireAuth, requireRole(['distributor']), async (req, res) => {
  const input = createOrderSchema.safeParse(req.body);

  if (!input.success) {
    return res.status(400).json({ message: 'Datele comenzii nu sunt valide.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const listingResult = await client.query(
      `
        SELECT id, seller_id, quantity_kg, price_per_kg
        FROM product_listings
        WHERE id = $1 AND status = 'active'
        FOR UPDATE
      `,
      [input.data.listingId],
    );
    const listing = listingResult.rows[0];

    if (!listing) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Oferta nu mai este disponibilă.' });
    }

    const availableQuantity = Number(listing.quantity_kg);
    if (input.data.quantityKg > availableQuantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Cantitatea maximă disponibilă este ${availableQuantity} kg.` });
    }

    const result = await client.query(
      `
        INSERT INTO orders (distributor_id, listing_id, ordered_quantity_kg, unit_price, total_amount, notes)
        VALUES ($1, $2, $3, $4, $3::numeric * $4::numeric, $5)
        RETURNING id, status, ordered_quantity_kg, total_amount, created_at
      `,
      [req.user?.sub, input.data.listingId, input.data.quantityKg, listing.price_per_kg, input.data.notes ?? null],
    );

    await client.query('COMMIT');
    notifySellerOrder(result.rows[0].id);
    return res.status(201).json({ order: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Eroare la trimiterea comenzii.' });
  } finally {
    client.release();
  }
});

router.patch('/:id/status', requireAuth, requireRole(['seller']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  const statusResult = orderStatusSchema.safeParse(req.body.status);

  if (!idResult.success || !statusResult.success) {
    return res.status(400).json({ message: 'ID sau status invalid.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      `
        SELECT o.id, o.status, o.listing_id, o.ordered_quantity_kg, pl.quantity_kg, pl.seller_id
        FROM orders o
        JOIN product_listings pl ON pl.id = o.listing_id
        WHERE o.id = $1 AND pl.seller_id = $2
        FOR UPDATE OF o, pl
      `,
      [idResult.data, req.user?.sub],
    );
    const order = orderResult.rows[0];

    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Cererea nu a fost găsită sau nu îți aparține.' });
    }

    if (order.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Această cerere a fost deja procesată.' });
    }

    if (statusResult.data === 'confirmed') {
      const availableQuantity = Number(order.quantity_kg);
      const orderedQuantity = Number(order.ordered_quantity_kg);

      if (orderedQuantity > availableQuantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Stoc insuficient. Mai sunt disponibile ${availableQuantity} kg.` });
      }

      await client.query(
        `
          UPDATE product_listings
          SET quantity_kg = quantity_kg - $1::numeric,
              status = CASE WHEN quantity_kg - $1::numeric = 0 THEN 'paused'::listing_status ELSE status END,
              updated_at = NOW()
          WHERE id = $2
        `,
        [orderedQuantity, order.listing_id],
      );
      await client.query(
        `INSERT INTO inventory_events (listing_id, delta_quantity_kg, reason, created_by) VALUES ($1, $2::numeric, $3, $4)`,
        [order.listing_id, -orderedQuantity, 'Comandă acceptată', req.user?.sub],
      );
    }

    const result = await client.query(
      `UPDATE orders SET status = $1::order_status, updated_at = NOW() WHERE id = $2 RETURNING id, status`,
      [statusResult.data, idResult.data],
    );

    await client.query('COMMIT');
    notifyDistributorOrderStatus(idResult.data);
    return res.status(200).json({ order: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update order status error:', error);
    return res.status(500).json({ message: 'Eroare la actualizarea cererii.' });
  } finally {
    client.release();
  }
});

router.get('/:id/messages', requireAuth, requireRole(['seller', 'distributor']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  if (!idResult.success || !req.user || req.user.role === 'admin') {
    return res.status(400).json({ message: 'ID sau participant invalid.' });
  }

  try {
    const order = await getOrderParticipant(idResult.data, req.user.sub, req.user.role);
    if (!order) return res.status(404).json({ message: 'Comanda nu a fost găsită.' });

    const result = await pool.query(
      `
        SELECT om.id, om.content, om.sender_id, om.created_at, u.full_name AS sender_name
        FROM order_messages om
        JOIN users u ON u.id = om.sender_id
        WHERE om.order_id = $1
        ORDER BY om.created_at ASC
      `,
      [idResult.data],
    );
    return res.status(200).json({ messages: result.rows.map((message) => ({ id: message.id, content: message.content, senderId: message.sender_id, senderName: message.sender_name, createdAt: message.created_at })) });
  } catch (error) {
    console.error('List order messages error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea mesajelor.' });
  }
});

router.patch('/:id', requireAuth, requireRole(['distributor']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  const input = editOrderSchema.safeParse(req.body);

  if (!idResult.success || !input.success) {
    return res.status(400).json({ message: 'Date invalide pentru editarea comenzii.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const orderResult = await client.query(
      `
        SELECT o.id, o.status, o.listing_id, pl.quantity_kg, pl.price_per_kg
        FROM orders o
        JOIN product_listings pl ON pl.id = o.listing_id
        WHERE o.id = $1 AND o.distributor_id = $2
        FOR UPDATE OF o, pl
      `,
      [idResult.data, req.user?.sub],
    );
    const order = orderResult.rows[0];

    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Comanda nu a fost găsită sau nu îți aparține.' });
    }

    if (!['cancelled', 'rejected', 'pending'].includes(order.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Comanda acceptată nu mai poate fi editată.' });
    }

    const editableQuantity = Number(order.quantity_kg);
    if (input.data.quantityKg > editableQuantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Cantitatea maximă disponibilă pentru această comandă este ${editableQuantity} kg.` });
    }

    const result = await client.query(
      `
        UPDATE orders
        SET ordered_quantity_kg = $1,
            total_amount = $1::numeric * $2::numeric,
            notes = $3,
            status = 'pending',
            updated_at = NOW()
        WHERE id = $4
        RETURNING id, status, ordered_quantity_kg, total_amount, notes
      `,
      [input.data.quantityKg, order.price_per_kg, input.data.notes ?? null, idResult.data],
    );

    await client.query('COMMIT');
    notifySellerOrder(idResult.data, { updated: true });
    return res.status(200).json({ order: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Edit order error:', error);
    return res.status(500).json({ message: 'Eroare la editarea comenzii.' });
  } finally {
    client.release();
  }
});

router.post('/:id/messages', requireAuth, requireRole(['seller', 'distributor']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  const input = messageSchema.safeParse(req.body);
  if (!idResult.success || !input.success || !req.user || req.user.role === 'admin') {
    return res.status(400).json({ message: 'Mesaj sau participant invalid.' });
  }

  try {
    const order = await getOrderParticipant(idResult.data, req.user.sub, req.user.role);
    if (!order) return res.status(404).json({ message: 'Comanda nu a fost găsită.' });

    const receiverId = req.user.sub === order.seller_id ? order.distributor_id : order.seller_id;
    const result = await pool.query(
      `
        INSERT INTO order_messages (order_id, sender_id, receiver_id, content)
        VALUES ($1, $2, $3, $4)
        RETURNING id, content, sender_id, created_at
      `,
      [idResult.data, req.user.sub, receiverId, input.data.content],
    );
    return res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    console.error('Create order message error:', error);
    return res.status(500).json({ message: 'Eroare la trimiterea mesajului.' });
  }
});

router.patch('/:id/cancel', requireAuth, requireRole(['distributor']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({ message: 'ID de comandă invalid.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const orderResult = await client.query(
      `
        SELECT o.id, o.status, o.listing_id, o.ordered_quantity_kg
        FROM orders o
        JOIN product_listings pl ON pl.id = o.listing_id
        WHERE o.id = $1 AND o.distributor_id = $2
        FOR UPDATE OF o, pl
      `,
      [idResult.data, req.user?.sub],
    );
    const order = orderResult.rows[0];

    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Comanda nu a fost găsită sau nu îți aparține.' });
    }

    if (order.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(200).json({ message: 'Comanda este deja anulată.' });
    }

    if (order.status === 'confirmed' || order.status === 'completed') {
      await client.query(
        `
          UPDATE product_listings
          SET quantity_kg = quantity_kg + $1::numeric,
              status = CASE WHEN status = 'paused'::listing_status THEN 'active'::listing_status ELSE status END,
              updated_at = NOW()
          WHERE id = $2
        `,
        [order.ordered_quantity_kg, order.listing_id],
      );
      await client.query(
        `INSERT INTO inventory_events (listing_id, delta_quantity_kg, reason, created_by) VALUES ($1, $2::numeric, $3, $4)`,
        [order.listing_id, order.ordered_quantity_kg, 'Comandă anulată de distribuitor', req.user?.sub],
      );
    }

    const result = await client.query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING id, status`,
      [idResult.data],
    );

    await client.query('COMMIT');
    return res.status(200).json({ order: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel order error:', error);
    return res.status(500).json({ message: 'Eroare la anularea comenzii.' });
  } finally {
    client.release();
  }
});

router.delete('/:id', requireAuth, requireRole(['seller', 'distributor']), async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({ message: 'ID de comandă invalid.' });
  }

  try {
    const orderResult = await pool.query(
      `
        SELECT o.status
        FROM orders o
        JOIN product_listings pl ON pl.id = o.listing_id
        WHERE o.id = $1 AND (o.distributor_id = $2 OR pl.seller_id = $2)
      `,
      [idResult.data, req.user?.sub],
    );
    const order = orderResult.rows[0];

    if (!order) {
      return res.status(404).json({ message: 'Comanda nu a fost găsită sau nu îți aparține.' });
    }

    // O comandă confirmată a scăzut deja stocul; ștergerea ei ar lăsa stocul greșit și ar pierde istoricul.
    if (order.status === 'confirmed' || order.status === 'completed') {
      return res.status(400).json({ message: 'O comandă acceptată nu poate fi ștearsă. Anulează-o mai întâi.' });
    }

    await pool.query(`DELETE FROM orders WHERE id = $1 AND status NOT IN ('confirmed', 'completed')`, [idResult.data]);

    return res.status(200).json({ message: 'Comanda a fost ștearsă din istoric.' });
  } catch (error) {
    console.error('Delete order error:', error);
    return res.status(500).json({ message: 'Eroare la ștergerea comenzii.' });
  }
});

export default router;
