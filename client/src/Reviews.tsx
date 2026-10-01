import { FormEvent, useEffect, useState } from 'react';
import { API_BASE, RatingSummary, authHeaders } from './shared';

export type Review = {
  id: string;
  orderId: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  replyAt: string | null;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  revieweeId: string;
  revieweeName: string;
  revieweeRole: string;
  productName: string;
  updatedAt: string;
};
type ReviewsResponse = { user: { id: string; fullName: string; role: string; region: string | null; memberSince: string }; rating: RatingSummary; reviews: Review[] };

const roleLabel = (role: string) => (role === 'seller' ? 'Vânzător' : role === 'distributor' ? 'Distribuitor' : role);
const formatDate = (value: string) => new Date(value).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
const reviewCount = (count: number) => `${count} ${count === 1 ? 'recenzie' : 'recenzii'}`;

const request = async (path: string, init: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...authHeaders(), ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? 'A apărut o eroare.');
  return body;
};

function ReviewReply({ review, label }: { review: Review; label: string }) {
  if (!review.reply) return null;
  return (
    <div className="review-reply">
      <span>{label}{review.replyAt ? ` · ${formatDate(review.replyAt)}` : ''}</span>
      <p>{review.reply}</p>
    </div>
  );
}

export function Stars({ value, label }: { value: number; label?: string }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={label ?? `${value} din 5 stele`}>
      {[1, 2, 3, 4, 5].map((star) => <span key={star} className={star <= rounded ? 'star filled' : 'star'} aria-hidden="true">★</span>)}
    </span>
  );
}

// Scorul compact („★ 4,7 · 12 recenzii”); la click se deschid recenziile publice.
export function RatingBadge({ rating, onClick }: { rating?: RatingSummary; onClick?: () => void }) {
  const count = rating?.count ?? 0;
  const text = count === 0 ? 'Fără recenzii' : `${rating!.average!.toFixed(1).replace('.', ',')} · ${count} ${count === 1 ? 'recenzie' : 'recenzii'}`;
  const content = <>{count > 0 && <span className="rating-star" aria-hidden="true">★</span>}{text}</>;

  if (!onClick) return <span className="rating-badge">{content}</span>;
  return (
    <button type="button" className="rating-badge" onClick={(event) => { event.stopPropagation(); onClick(); }} title="Vezi recenziile">
      {content}
    </button>
  );
}

export function ReviewsModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/users/${userId}/reviews`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message ?? 'Nu am putut încărca recenziile.');
        if (!cancelled) setData(body);
      })
      .catch((loadError) => !cancelled && setError(loadError instanceof Error ? loadError.message : 'Eroare la încărcarea recenziilor.'));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="modal-backdrop reviews-backdrop" onClick={onClose}>
      <section className="listing-modal reviews-modal" role="dialog" aria-label="Recenzii" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Închide">x</button>
        <p className="kicker">Recenzii verificate</p>
        {error && <p className="auth-feedback error">{error}</p>}
        {!data && !error && <p className="dashboard-muted">Se încarcă recenziile...</p>}
        {data && <>
          <h2>{data.user.fullName}</h2>
          <p className="reviews-meta">{roleLabel(data.user.role)}{data.user.region ? ` · ${data.user.region}` : ''} · pe AgroHub din {formatDate(data.user.memberSince)}</p>
          <div className="reviews-summary">
            {data.rating.count > 0 ? <>
              <strong>{data.rating.average!.toFixed(1).replace('.', ',')}</strong>
              <div><Stars value={data.rating.average!} /><span>{reviewCount(data.rating.count)}</span></div>
            </> : <span>Încă nu are recenzii.</span>}
          </div>
          <p className="reviews-note">Recenziile pot fi lăsate doar de partenerii care au avut o comandă acceptată.</p>
          <div className="reviews-list">
            {data.reviews.map((review) => (
              <article className="review" key={review.id}>
                <div className="review-head">
                  <Stars value={review.rating} />
                  <time>{formatDate(review.updatedAt)}</time>
                </div>
                {review.comment && <p>{review.comment}</p>}
                <small>{review.reviewerName} · {roleLabel(review.reviewerRole).toLowerCase()} · comandă: {review.productName}</small>
                <ReviewReply review={review} label={`Răspunsul lui ${data.user.fullName}`} />
              </article>
            ))}
          </div>
        </>}
      </section>
    </div>
  );
}

export function ReviewFormModal({ orderId, partnerName, onClose, onSaved }: { orderId: string; partnerName: string; onClose: () => void; onSaved: () => void }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/orders/${orderId}/review`, { headers: authHeaders() })
      .then((response) => response.json())
      .then((body) => {
        if (body.review) {
          setRating(body.review.rating);
          setComment(body.review.comment ?? '');
          setIsEditing(true);
        }
      })
      .catch(() => undefined);
  }, [orderId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating === 0) {
      setError('Alege un număr de stele.');
      return;
    }
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message ?? 'Nu am putut salva recenzia.');
      onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Eroare la salvarea recenziei.');
    } finally {
      setIsSaving(false);
    }
  };

  const shown = hovered || rating;
  const ratingWords = ['', 'Foarte slab', 'Slab', 'Acceptabil', 'Bun', 'Excelent'];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="listing-modal" role="dialog" aria-label="Recenzie" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Închide">x</button>
        <p className="kicker">{isEditing ? 'Editează recenzia' : 'Recenzie nouă'}</p>
        <h2>Cum a fost colaborarea cu {partnerName}?</h2>
        <p>Recenzia este publică și îi ajută pe ceilalți să aleagă parteneri de încredere.</p>
        <form className="listing-form" onSubmit={submit}>
          <div className="star-picker" role="radiogroup" aria-label="Număr de stele" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} ${star === 1 ? 'stea' : 'stele'}`}
                className={star <= shown ? 'filled' : ''}
                onMouseEnter={() => setHovered(star)}
                onClick={() => setRating(star)}
              >★</button>
            ))}
            <span>{ratingWords[shown]}</span>
          </div>
          <label>Comentariu <span className="optional-label">(opțional)</span>
            <textarea maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Calitatea marfii, respectarea termenelor, comunicarea..." />
          </label>
          {error && <p className="auth-feedback error">{error}</p>}
          <button className="primary-action" type="submit" disabled={isSaving}>{isSaving ? 'Se salvează...' : isEditing ? 'Salvează modificările' : 'Publică recenzia'}</button>
        </form>
      </section>
    </div>
  );
}

// Formularul de răspuns, direct sub recenzie.
function ReplyEditor({ review, onDone }: { review: Review; onDone: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState(review.reply ?? '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const run = async (action: () => Promise<unknown>) => {
    setIsSaving(true);
    setError('');
    try {
      await action();
      setIsOpen(false);
      onDone();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Eroare la salvarea răspunsului.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="review-actions">
        <button type="button" className="review-link" onClick={() => { setText(review.reply ?? ''); setIsOpen(true); }}>{review.reply ? 'Editează răspunsul' : 'Răspunde'}</button>
        {review.reply && <button type="button" className="review-link danger" disabled={isSaving} onClick={() => void run(() => request(`/api/reviews/${review.id}/reply`, { method: 'DELETE' }))}>Șterge răspunsul</button>}
        {error && <span className="review-error">{error}</span>}
      </div>
    );
  }

  return (
    <form className="reply-form" onSubmit={(event) => { event.preventDefault(); void run(() => request(`/api/reviews/${review.id}/reply`, { method: 'PUT', body: JSON.stringify({ reply: text }) })); }}>
      <textarea autoFocus required maxLength={1000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Răspunsul tău apare public, sub recenzie." />
      {error && <span className="review-error">{error}</span>}
      <div className="review-actions">
        <button type="submit" className="reply-save" disabled={isSaving || !text.trim()}>{isSaving ? 'Se publică...' : 'Publică răspunsul'}</button>
        <button type="button" className="review-link" onClick={() => setIsOpen(false)}>Renunță</button>
      </div>
    </form>
  );
}

type MyReviewsResponse = { rating: RatingSummary; received: Review[]; given: Review[] };

// Secțiunea „Recenziile mele” din cabinet: primite (cu răspuns) și lăsate de mine.
export function MyReviews({ refreshKey, onEdit }: { refreshKey: number; onEdit: (review: Review) => void }) {
  const [data, setData] = useState<MyReviewsResponse | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'received' | 'given'>('received');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    request('/api/me/reviews')
      .then((body) => !cancelled && setData(body))
      .catch((loadError) => !cancelled && setError(loadError instanceof Error ? loadError.message : 'Eroare la încărcarea recenziilor.'));
    return () => {
      cancelled = true;
    };
  }, [refreshKey, reloadKey]);

  const list = data ? data[tab] : [];

  return (
    <section className="dashboard-panel my-reviews">
      <div className="panel-heading">
        <div><p className="kicker">Reputația ta</p><h2>Recenziile mele</h2></div>
        {data && data.rating.count > 0 && <div className="my-reviews-score"><strong>{data.rating.average!.toFixed(1).replace('.', ',')}</strong><Stars value={data.rating.average!} /><span>{reviewCount(data.rating.count)}</span></div>}
      </div>
      <div className="review-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'received'} className={tab === 'received' ? 'active' : ''} onClick={() => setTab('received')}>Primite{data ? ` (${data.received.length})` : ''}</button>
        <button type="button" role="tab" aria-selected={tab === 'given'} className={tab === 'given' ? 'active' : ''} onClick={() => setTab('given')}>Lăsate de mine{data ? ` (${data.given.length})` : ''}</button>
      </div>
      {error && <p className="auth-feedback error">{error}</p>}
      {!data && !error && <p className="dashboard-muted">Se încarcă recenziile...</p>}
      {data && list.length === 0 && <p className="dashboard-muted">{tab === 'received' ? 'Încă nu ai primit recenzii. Ele apar după ce partenerii evaluează o comandă acceptată.' : 'Nu ai lăsat încă nicio recenzie. Poți evalua partenerii după ce o comandă este acceptată.'}</p>}
      {data && list.length > 0 && <div className="reviews-list">
        {list.map((review) => (
          <article className="review" key={review.id}>
            <div className="review-head">
              <Stars value={review.rating} />
              <time>{formatDate(review.updatedAt)}</time>
            </div>
            {review.comment && <p>{review.comment}</p>}
            {tab === 'received' ? <>
              <small>De la {review.reviewerName} · {roleLabel(review.reviewerRole).toLowerCase()} · comandă: {review.productName}</small>
              <ReviewReply review={review} label="Răspunsul tău" />
              <ReplyEditor review={review} onDone={() => setReloadKey((key) => key + 1)} />
            </> : <>
              <small>Pentru {review.revieweeName} · {roleLabel(review.revieweeRole).toLowerCase()} · comandă: {review.productName}</small>
              <ReviewReply review={review} label={`Răspunsul lui ${review.revieweeName}`} />
              <div className="review-actions"><button type="button" className="review-link" onClick={() => onEdit(review)}>Editează recenzia</button></div>
            </>}
          </article>
        ))}
      </div>}
    </section>
  );
}

// Moderarea din panoul de admin: ștergerea recenziilor sau a răspunsurilor abuzive.
export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const query = search.trim();

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      request(`/api/admin/reviews?q=${encodeURIComponent(query)}`)
        .then((body) => !cancelled && setReviews(body.reviews))
        .catch((loadError) => !cancelled && setError(loadError instanceof Error ? loadError.message : 'Eroare la încărcarea recenziilor.'));
    }, query ? 300 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const remove = async (path: string, id: string, update: (review: Review) => Review | null) => {
    setError('');
    try {
      await request(path, { method: 'DELETE' });
      setReviews((current) => (current ?? []).flatMap((review) => (review.id === id ? (update(review) ?? []) : [review])));
      setPendingDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Eroare la ștergere.');
    }
  };

  return (
    <div className="admin-reviews">
      <input className="admin-review-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Caută după nume, produs sau text..." aria-label="Caută recenzii" />
      {error && <p className="auth-feedback error">{error}</p>}
      {!reviews && !error && <p className="empty-admin">Se încarcă recenziile...</p>}
      {reviews && reviews.length === 0 && <p className="empty-admin">{query ? 'Nicio recenzie găsită.' : 'Nu există recenzii.'}</p>}
      {reviews && reviews.length > 0 && <div className="pending-list">
        {reviews.map((review) => (
          <article className="pending-user admin-review" key={review.id}>
            <div>
              <div className="review-head"><Stars value={review.rating} /><time>{formatDate(review.updatedAt)}</time></div>
              <strong>{review.reviewerName} → {review.revieweeName}</strong>
              <small>Comandă: {review.productName}</small>
              {review.comment && <p>{review.comment}</p>}
              {review.reply && <div className="review-reply"><span>Răspunsul lui {review.revieweeName}</span><p>{review.reply}</p></div>}
            </div>
            <div className="pending-actions">
              {pendingDelete === review.id
                ? <><button className="delete-admin-button" onClick={() => void remove(`/api/admin/reviews/${review.id}`, review.id, () => null)}>Confirmă ștergerea</button><button className="cancel-action" onClick={() => setPendingDelete(null)}>Renunță</button></>
                : <button className="delete-admin-button" onClick={() => setPendingDelete(review.id)}>Șterge recenzia</button>}
              {review.reply && <button className="reject-button" onClick={() => void remove(`/api/admin/reviews/${review.id}/reply`, review.id, (current) => ({ ...current, reply: null, replyAt: null }))}>Șterge răspunsul</button>}
            </div>
          </article>
        ))}
      </div>}
    </div>
  );
}
