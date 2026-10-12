import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE, authHeaders } from './shared';

export type NotificationLink = 'dashboard' | 'catalog' | 'admin';

type AppNotification = { id: string; type: string; message: string; link: NotificationLink; isRead: boolean; createdAt: string };

const POLL_INTERVAL_MS = 30_000;

const timeAgo = (value: string) => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return 'acum';
  if (minutes < 60) return `acum ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `acum ${hours} h`;
  return new Date(value).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
};

// Clopoțelul din antet: notificările din aplicație (oferte, comenzi, recenzii, anunțuri noi, cereri de aprobat).
export function NotificationBell({ onNavigate }: { onNavigate: (link: NotificationLink) => void }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications`, { headers: authHeaders() });
      if (!response.ok) return;
      const body = await response.json();
      setNotifications(body.notifications);
      setUnreadCount(body.unreadCount);
    } catch {
      // Fără rețea: încercăm din nou la următorul interval.
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  // Se închide la click în afară sau la Esc, ca meniurile din cabinet.
  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setIsOpen(false);
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const toggle = () => {
    if (!isOpen) void load();
    setIsOpen(!isOpen);
  };

  const markAllRead = async () => {
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    await fetch(`${API_BASE}/api/notifications/read-all`, { method: 'POST', headers: authHeaders() }).catch(() => undefined);
  };

  const open = async (notification: AppNotification) => {
    setIsOpen(false);
    if (!notification.isRead) {
      setNotifications((items) => items.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)));
      setUnreadCount((count) => Math.max(0, count - 1));
      fetch(`${API_BASE}/api/notifications/${notification.id}/read`, { method: 'POST', headers: authHeaders() }).catch(() => undefined);
    }
    onNavigate(notification.link);
  };

  return (
    <div className="notification-wrap" ref={wrapRef}>
      <button type="button" className="notification-button" onClick={toggle} aria-expanded={isOpen} aria-label={unreadCount ? `Notificări, ${unreadCount} necitite` : 'Notificări'}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" /></svg>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {isOpen && (
        <section className="notification-panel" aria-label="Notificări">
          <header>
            <strong>Notificări</strong>
            {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()}>Marchează toate ca citite</button>}
          </header>
          {notifications.length === 0
            ? <p className="notification-empty">Nu ai notificări încă.</p>
            : <ul>
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button type="button" className={notification.isRead ? 'notification-item' : 'notification-item unread'} onClick={() => void open(notification)}>
                    <span>{notification.message}</span>
                    <time>{timeAgo(notification.createdAt)}</time>
                  </button>
                </li>
              ))}
            </ul>}
        </section>
      )}
    </div>
  );
}
