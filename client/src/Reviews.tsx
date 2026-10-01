import { FormEvent, useEffect, useState } from 'react';
import { API_BASE, RatingSummary, authHeaders } from './shared';

type Review = { id: string; rating: number; comment: string | null; reviewerName: string; reviewerRole: string; productName: string; updatedAt: string };
type ReviewsResponse = { user: { id: string; fullName: string; role: string; region: string | null; memberSince: string }; rating: RatingSummary; reviews: Review[] };

const roleLabel = (role: string) => (role === 'seller' ? 'Vânzător' : role === 'distributor' ? 'Distribuitor' : role);
const formatDate = (value: string) => new Date(value).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });

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
              <div><Stars value={data.rating.average!} /><span>{data.rating.count} {data.rating.count === 1 ? 'recenzie' : 'recenzii'}</span></div>
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
