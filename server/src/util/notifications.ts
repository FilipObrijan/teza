import { env } from '../config/env.js';
import { pool } from '../db/index.js';
import { sendEmail } from './email.js';

// Notificările pe email nu trebuie să blocheze sau să strice cererea care le-a declanșat:
// rulează după răspuns, iar erorile doar se loghează.
export const runInBackground = (label: string, task: () => Promise<void>) => {
  task().catch((error) => console.error(`Notification failed (${label}):`, error));
};

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export const formatNumber = (value: unknown) => Number(value).toLocaleString('ro-RO', { maximumFractionDigits: 2 });

export type EmailContent = { subject: string; lines: string[] };

export const sendNotification = (to: string, { subject, lines }: EmailContent) =>
  sendEmail({
    to,
    subject,
    text: `${lines.join('\n')}\n\nIntră pe AgroHub: ${env.siteUrl}`,
    html: `
      ${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
      <p><a href="${escapeHtml(env.siteUrl)}" style="display:inline-block;padding:10px 18px;background:#2d6a4f;color:#fff;border-radius:6px;text-decoration:none">Deschide AgroHub</a></p>
    `,
  });

export const sendToAll = async (emails: string[], content: EmailContent) => {
  for (const email of emails) {
    await sendNotification(email, content).catch((error) => console.error(`Notification to ${email} failed:`, error));
  }
};

export const getAdminEmails = async () => {
  const result = await pool.query(`SELECT email FROM users WHERE role = 'admin' AND status = 'approved'`);
  return result.rows.map((row) => String(row.email));
};

export const roleLabel = (role: string) => (role === 'seller' ? 'vânzător' : role === 'distributor' ? 'distribuitor' : role);

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

// Email pentru un mesaj nou în chat, fără spam: cel mult un email per conversație până când destinatarul o citește,
// și niciunul dacă destinatarul a citit conversația în ultimele 30 de secunde: cu chatul deschis, site-ul o marchează
// citită la fiecare 5 secunde, deci e pe site și vede mesajul oricum.
export const notifyNewMessage = (messageId: string) =>
  runInBackground('chat/new-message', async () => {
    const result = await pool.query(
      `
        SELECT m.order_id, m.receiver_id, m.content,
               receiver.email AS receiver_email, sender.full_name AS sender_name,
               pl.product_name, pl.variety,
               COALESCE(r.last_read_at > NOW() - INTERVAL '30 seconds', false) AS recently_active
        FROM order_messages m
        JOIN users receiver ON receiver.id = m.receiver_id
        JOIN users sender ON sender.id = m.sender_id
        JOIN orders o ON o.id = m.order_id
        JOIN product_listings pl ON pl.id = o.listing_id
        LEFT JOIN order_message_reads r ON r.order_id = m.order_id AND r.user_id = m.receiver_id
        WHERE m.id = $1
      `,
      [messageId],
    );
    const message = result.rows[0];
    if (!message || message.recently_active || !message.receiver_email) return;

    // „Rezervăm” atomic emailul: reușește doar dacă nu s-a mai trimis unul de la ultima citire.
    // Așa, două mesaje trimise aproape simultan nu produc două emailuri.
    const claim = await pool.query(
      `
        INSERT INTO order_message_notifications (order_id, user_id, last_notified_at) VALUES ($1, $2, NOW())
        ON CONFLICT (order_id, user_id) DO UPDATE SET last_notified_at = NOW()
        WHERE order_message_notifications.last_notified_at <= COALESCE(
          (SELECT last_read_at FROM order_message_reads WHERE order_id = $1 AND user_id = $2),
          '-infinity'::timestamptz
        )
        RETURNING order_id
      `,
      [message.order_id, message.receiver_id],
    );
    if (claim.rowCount === 0) return;

    const preview = message.content.length > 300 ? `${message.content.slice(0, 300)}…` : message.content;
    await sendNotification(message.receiver_email, {
      subject: `Mesaj nou de la ${message.sender_name} – ${message.product_name}`,
      lines: [
        `${message.sender_name} ți-a scris despre ${message.product_name} (${message.variety}):`,
        `„${preview}”`,
        'Răspunde din fereastra de mesaje de pe AgroHub. Nu primești alte emailuri pentru această conversație până nu o deschizi.',
      ],
    });
  });

const REVIEW_QUERY = `
  SELECT r.rating, r.comment, r.reply, pl.product_name,
         reviewer.full_name AS reviewer_name, reviewer.email AS reviewer_email,
         reviewee.full_name AS reviewee_name, reviewee.email AS reviewee_email
  FROM reviews r
  JOIN users reviewer ON reviewer.id = r.reviewer_id
  JOIN users reviewee ON reviewee.id = r.reviewee_id
  JOIN orders o ON o.id = r.order_id
  JOIN product_listings pl ON pl.id = o.listing_id
  WHERE r.id = $1
`;

const starsText = (rating: number) => `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)`;

// Celui evaluat: a primit o recenzie nouă sau i s-a modificat una.
export const notifyNewReview = (reviewId: string, { updated = false } = {}) =>
  runInBackground('review/new', async () => {
    const review = (await pool.query(REVIEW_QUERY, [reviewId])).rows[0];
    if (!review?.reviewee_email) return;

    await sendNotification(review.reviewee_email, {
      subject: updated ? `${review.reviewer_name} și-a modificat recenzia` : `Recenzie nouă de la ${review.reviewer_name}`,
      lines: [
        updated
          ? `${review.reviewer_name} și-a modificat recenzia despre colaborarea pentru ${review.product_name}.`
          : `${review.reviewer_name} ți-a lăsat o recenzie pentru colaborarea pentru ${review.product_name}.`,
        `Nota: ${starsText(review.rating)}`,
        ...(review.comment ? [`„${review.comment}”`] : []),
        'Poți răspunde public din cabinet, secțiunea „Recenziile mele”.',
      ],
    });
  });

// Autorului recenziei: cel evaluat i-a răspuns.
export const notifyReviewReply = (reviewId: string) =>
  runInBackground('review/reply', async () => {
    const review = (await pool.query(REVIEW_QUERY, [reviewId])).rows[0];
    if (!review?.reviewer_email || !review.reply) return;

    await sendNotification(review.reviewer_email, {
      subject: `${review.reviewee_name} a răspuns la recenzia ta`,
      lines: [
        `${review.reviewee_name} a răspuns la recenzia ta despre ${review.product_name}:`,
        `„${review.reply}”`,
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
