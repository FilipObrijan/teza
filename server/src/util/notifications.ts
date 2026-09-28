import { env } from '../config/env.js';
import { pool } from '../db/index.js';
import { sendEmail } from './email.js';

// Notificările pe email nu trebuie să blocheze sau să strice cererea care le-a declanșat:
// rulează după răspuns, iar erorile doar se loghează.
const runInBackground = (label: string, task: () => Promise<void>) => {
  task().catch((error) => console.error(`Notification failed (${label}):`, error));
};

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

const formatNumber = (value: unknown) => Number(value).toLocaleString('ro-RO', { maximumFractionDigits: 2 });

type EmailContent = { subject: string; lines: string[] };

const sendNotification = (to: string, { subject, lines }: EmailContent) =>
  sendEmail({
    to,
    subject,
    text: `${lines.join('\n')}\n\nIntră pe AgroHub: ${env.siteUrl}`,
    html: `
      ${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
      <p><a href="${escapeHtml(env.siteUrl)}" style="display:inline-block;padding:10px 18px;background:#2d6a4f;color:#fff;border-radius:6px;text-decoration:none">Deschide AgroHub</a></p>
    `,
  });

const sendToAll = async (emails: string[], content: EmailContent) => {
  for (const email of emails) {
    await sendNotification(email, content).catch((error) => console.error(`Notification to ${email} failed:`, error));
  }
};

const getAdminEmails = async () => {
  const result = await pool.query(`SELECT email FROM users WHERE role = 'admin' AND status = 'approved'`);
  return result.rows.map((row) => String(row.email));
};

const roleLabel = (role: string) => (role === 'seller' ? 'vânzător' : role === 'distributor' ? 'distribuitor' : role);

export const notifyAdminsPendingUser = (userId: string) =>
  runInBackground('admins/pending-user', async () => {
    const result = await pool.query(`SELECT full_name, email, role, region FROM users WHERE id = $1 AND status = 'pending'`, [userId]);
    const user = result.rows[0];
    if (!user) return;

    await sendToAll(await getAdminEmails(), {
      subject: `Cont nou de aprobat: ${user.full_name}`,
      lines: [
        `Un cont nou de ${roleLabel(user.role)} așteaptă aprobarea ta.`,
        `Nume: ${user.full_name}`,
        `Email: ${user.email}`,
        ...(user.region ? [`Regiune: ${user.region}`] : []),
      ],
    });
  });

export const notifyAdminsPendingListing = (listingId: string) =>
  runInBackground('admins/pending-listing', async () => {
    const result = await pool.query(
      `
        SELECT pl.product_name, pl.variety, pl.quantity_kg, pl.price_per_kg, pl.region, u.full_name AS seller_name
        FROM product_listings pl
        JOIN users u ON u.id = pl.seller_id
        WHERE pl.id = $1 AND pl.status = 'pending'
      `,
      [listingId],
    );
    const listing = result.rows[0];
    if (!listing) return;

    await sendToAll(await getAdminEmails(), {
      subject: `Anunț nou de aprobat: ${listing.product_name}`,
      lines: [
        `${listing.seller_name} a publicat un anunț care așteaptă aprobarea ta.`,
        `Produs: ${listing.product_name} (${listing.variety})`,
        `Cantitate: ${formatNumber(listing.quantity_kg)} kg, ${formatNumber(listing.price_per_kg)} lei/kg`,
        `Regiune: ${listing.region}`,
      ],
    });
  });

export const notifySellerOrder = (orderId: string, { updated = false } = {}) =>
  runInBackground('seller/order', async () => {
    const result = await pool.query(
      `
        SELECT o.ordered_quantity_kg, o.total_amount, o.notes, pl.product_name, pl.variety,
               seller.email AS seller_email, distributor.full_name AS distributor_name
        FROM orders o
        JOIN product_listings pl ON pl.id = o.listing_id
        JOIN users seller ON seller.id = pl.seller_id
        JOIN users distributor ON distributor.id = o.distributor_id
        WHERE o.id = $1
      `,
      [orderId],
    );
    const order = result.rows[0];
    if (!order) return;

    await sendNotification(order.seller_email, {
      subject: updated ? `Oferta pentru ${order.product_name} a fost modificată` : `Ofertă nouă pentru ${order.product_name}`,
      lines: [
        updated
          ? `${order.distributor_name} și-a modificat oferta pentru anunțul tău.`
          : `${order.distributor_name} ți-a trimis o ofertă pentru anunțul tău.`,
        `Produs: ${order.product_name} (${order.variety})`,
        `Cantitate: ${formatNumber(order.ordered_quantity_kg)} kg`,
        `Total: ${formatNumber(order.total_amount)} lei`,
        ...(order.notes ? [`Mesaj: ${order.notes}`] : []),
        'Intră în cabinet pentru a accepta sau refuza oferta.',
      ],
    });
  });

export const notifyDistributorOrderStatus = (orderId: string) =>
  runInBackground('distributor/order-status', async () => {
    const result = await pool.query(
      `
        SELECT o.status, o.ordered_quantity_kg, o.total_amount, pl.product_name, pl.variety,
               distributor.email AS distributor_email, seller.full_name AS seller_name
        FROM orders o
        JOIN product_listings pl ON pl.id = o.listing_id
        JOIN users seller ON seller.id = pl.seller_id
        JOIN users distributor ON distributor.id = o.distributor_id
        WHERE o.id = $1
      `,
      [orderId],
    );
    const order = result.rows[0];
    if (!order || !['confirmed', 'rejected'].includes(order.status)) return;

    const accepted = order.status === 'confirmed';
    await sendNotification(order.distributor_email, {
      subject: accepted ? `Oferta ta pentru ${order.product_name} a fost acceptată` : `Oferta ta pentru ${order.product_name} a fost refuzată`,
      lines: [
        accepted
          ? `${order.seller_name} a acceptat oferta ta.`
          : `${order.seller_name} a refuzat oferta ta.`,
        `Produs: ${order.product_name} (${order.variety})`,
        `Cantitate: ${formatNumber(order.ordered_quantity_kg)} kg`,
        `Total: ${formatNumber(order.total_amount)} lei`,
        accepted
          ? 'Poți discuta detaliile livrării în chatul comenzii.'
          : 'Poți modifica oferta din cabinet și o poți trimite din nou.',
      ],
    });
  });

export const notifyDistributorsNewListing = (listingId: string) =>
  runInBackground('distributors/new-listing', async () => {
    const [listingResult, distributorsResult] = await Promise.all([
      pool.query(
        `
          SELECT pl.product_name, pl.variety, pl.quantity_kg, pl.price_per_kg, pl.region, u.full_name AS seller_name
          FROM product_listings pl
          JOIN users u ON u.id = pl.seller_id
          WHERE pl.id = $1 AND pl.status = 'active'
        `,
        [listingId],
      ),
      pool.query(`SELECT email FROM users WHERE role = 'distributor' AND status = 'approved' AND email_verified_at IS NOT NULL`),
    ]);
    const listing = listingResult.rows[0];
    if (!listing) return;

    await sendToAll(distributorsResult.rows.map((row) => String(row.email)), {
      subject: `Anunț nou: ${listing.product_name} (${listing.variety})`,
      lines: [
        `A apărut un anunț nou pe AgroHub, publicat de ${listing.seller_name}.`,
        `Produs: ${listing.product_name} (${listing.variety})`,
        `Cantitate disponibilă: ${formatNumber(listing.quantity_kg)} kg`,
        `Preț: ${formatNumber(listing.price_per_kg)} lei/kg`,
        `Regiune: ${listing.region}`,
      ],
    });
  });
