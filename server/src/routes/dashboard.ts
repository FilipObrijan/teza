import { Router } from 'express';
import { pool } from '../db/index.js';
import { requireAuth, requireRole } from './auth.js';

const router = Router();

router.get('/me', requireAuth, requireRole(['seller', 'distributor']), async (req, res) => {
  try {
    if (req.user?.role === 'seller') {
      const [statsResult, listingsResult, ordersResult] = await Promise.all([
        pool.query(
          `
            SELECT
              COUNT(*) FILTER (WHERE status = 'active')::int AS active_listings,
              COALESCE(SUM(quantity_kg) FILTER (WHERE status = 'active'), 0) AS stock_kg,
              (
                SELECT COUNT(*)::int
                FROM orders o
                JOIN product_listings order_listing ON order_listing.id = o.listing_id
                WHERE order_listing.seller_id = $1
                  AND o.status NOT IN ('cancelled', 'rejected')
              ) AS received_orders,
              (
                SELECT COUNT(*)::int
                FROM orders o
                JOIN product_listings order_listing ON order_listing.id = o.listing_id
                WHERE order_listing.seller_id = $1
                  AND o.status = 'pending'
              ) AS pending_orders
            FROM product_listings
            WHERE seller_id = $1 AND status <> 'archived'
          `,
          [req.user.sub],
        ),
        pool.query(
          `
            SELECT id, product_name, variety, quantity_kg, price_per_kg, unit_measure, region, harvest_date, delivery_terms, status, updated_at
            FROM product_listings
            WHERE seller_id = $1 AND status <> 'archived'
            ORDER BY created_at DESC
          `,
          [req.user.sub],
        ),
        pool.query(
          `
            SELECT o.id, o.ordered_quantity_kg, o.unit_price, o.total_amount, o.status, o.notes, o.created_at,
                   pl.product_name, pl.variety, u.full_name AS distributor_name, u.email AS distributor_email, u.phone AS distributor_phone
            FROM orders o
            JOIN product_listings pl ON pl.id = o.listing_id
            JOIN users u ON u.id = o.distributor_id
            WHERE pl.seller_id = $1
            ORDER BY o.created_at DESC
          `,
          [req.user.sub],
        ),
      ]);

      const stats = statsResult.rows[0];

      return res.status(200).json({
        role: 'seller',
        stats: {
          activeListings: stats.active_listings,
          stockKg: Number(stats.stock_kg),
          receivedOrders: stats.received_orders,
          pendingOrders: stats.pending_orders,
        },
        listings: listingsResult.rows.map((listing) => ({
          id: listing.id,
          productName: listing.product_name,
          variety: listing.variety,
          quantityKg: Number(listing.quantity_kg),
          pricePerKg: Number(listing.price_per_kg),
          unitMeasure: listing.unit_measure,
          region: listing.region,
          harvestDate: listing.harvest_date,
          deliveryTerms: listing.delivery_terms,
          status: listing.status,
          updatedAt: listing.updated_at,
        })),
        receivedOrders: ordersResult.rows.map((order) => ({
          id: order.id,
          productName: order.product_name,
          variety: order.variety,
          distributorName: order.distributor_name,
          distributorEmail: order.distributor_email,
          distributorPhone: order.distributor_phone,
          quantityKg: Number(order.ordered_quantity_kg),
          unitPrice: Number(order.unit_price),
          totalAmount: Number(order.total_amount),
          status: order.status,
          notes: order.notes,
          createdAt: order.created_at,
        })),
      });
    }

    const [statsResult, ordersResult] = await Promise.all([
      pool.query(
        `
          SELECT
            COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed'))::int AS active_orders,
            COUNT(*) FILTER (WHERE status NOT IN ('cancelled', 'rejected'))::int AS total_orders,
            COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('cancelled', 'rejected')), 0) AS total_spent
          FROM orders
          WHERE distributor_id = $1
        `,
        [req.user?.sub],
      ),
      pool.query(
        `
          SELECT o.id, o.ordered_quantity_kg, o.total_amount, o.status, o.created_at, pl.quantity_kg AS available_quantity_kg,
                 pl.product_name, pl.variety, u.full_name AS seller_name
          FROM orders o
          JOIN product_listings pl ON pl.id = o.listing_id
          JOIN users u ON u.id = pl.seller_id
          WHERE o.distributor_id = $1
          ORDER BY o.created_at DESC
          LIMIT 10
        `,
        [req.user?.sub],
      ),
    ]);

    const stats = statsResult.rows[0];

    return res.status(200).json({
      role: 'distributor',
      stats: {
        activeOrders: stats.active_orders,
        savedSuppliers: 0,
        totalSpent: Number(stats.total_spent),
        totalOrders: stats.total_orders,
      },
      orders: ordersResult.rows.map((order) => ({
        id: order.id,
        productName: order.product_name,
        variety: order.variety,
        sellerName: order.seller_name,
        quantityKg: Number(order.ordered_quantity_kg),
        availableQuantityKg: Number(order.available_quantity_kg),
        totalAmount: Number(order.total_amount),
        status: order.status,
        createdAt: order.created_at,
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea cabinetului.' });
  }
});

export default router;