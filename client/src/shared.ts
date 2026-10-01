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
  completed: 'Finalizată',
}[status] ?? status);

export const orderStatusClass = (status: string) =>
  `status-${status === 'confirmed' ? 'active' : status === 'rejected' || status === 'cancelled' ? 'rejected' : 'pending'}`;
