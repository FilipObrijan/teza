export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export const authHeaders = (): Record<string, string> => ({ Authorization: `Bearer ${sessionStorage.getItem('agrohub_token')}` });

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'seller' | 'distributor' | 'admin';
  status: string;
};

export type RatingSummary = { average: number | null; count: number };

export const orderStatusLabel =(status: string) => ({
  pending: 'În așteptare',
  confirmed: 'Acceptat',
  rejected: 'Refuzat',
  cancelled: 'Comandă anulată',
  completed: 'Livrată',
}[status] ?? status);

export const orderStatusClass = (status: string) =>
  `status-${status === 'confirmed' || status === 'completed' ? 'active' : status === 'rejected' || status === 'cancelled' ? 'rejected' : 'pending'}`;

// Reîncărcare periodică doar cât tabul e vizibil (plus o dată când utilizatorul revine pe el).
// Un tab uitat deschis nu mai ține pornite serverul și baza de date (Neon le taxează cât sunt active).
export const pollWhileVisible = (load: () => void, intervalMs: number) => {
  const timer = window.setInterval(() => {
    if (!document.hidden) load();
  }, intervalMs);
  const onVisible = () => {
    if (!document.hidden) load();
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisible);
  };
};
