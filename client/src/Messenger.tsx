import { FormEvent, useEffect, useRef, useState } from 'react';
import { API_BASE, AuthUser, authHeaders, orderStatusClass, orderStatusLabel } from './shared';

type ChatMessage = { id: string; content: string; senderId: string; senderName: string; createdAt: string };

// Fiecare comandă are propria conversație între vânzător și distribuitor.
type Conversation = { id: string; productName: string; variety: string; partnerName: string; status: string };

type DashboardOrder = { id: string; productName: string; variety: string; status: string; sellerName?: string; distributorName?: string };

const formatMessageTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const time = date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  return date.toDateString() === new Date().toDateString() ? time : `${date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' })} ${time}`;
};

const isNarrowScreen = () => window.matchMedia('(max-width: 640px)').matches;

export default function Messenger({ user }: { user: AuthUser }) {
  const isSeller = user.role === 'seller';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/dashboard/me`, { headers: authHeaders() });
        if (!response.ok) return;
        const data = await response.json();
        const orders: DashboardOrder[] = (isSeller ? data.receivedOrders : data.orders) ?? [];
        setConversations(orders.map((order) => ({
          id: order.id,
          productName: order.productName,
          variety: order.variety,
          partnerName: (isSeller ? order.distributorName : order.sellerName) ?? '',
          status: order.status,
        })));
      } catch {
        // Serverul poate fi temporar indisponibil; reîncercăm la următorul interval.
      }
    };

    void loadConversations();
    const timer = window.setInterval(loadConversations, 10000);
    return () => window.clearInterval(timer);
  }, [isSeller]);

  // Conversația deschisă se reîncarcă periodic, ca mesajele noi să apară fără redeschidere.
  useEffect(() => {
    if (!isOpen || !activeId) return;

    let cancelled = false;
    const loadMessages = async (showLoading: boolean) => {
      if (showLoading) setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/orders/${activeId}/messages`, { headers: authHeaders() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? 'Nu am putut încărca mesajele.');
        if (!cancelled) setMessages(data.messages as ChatMessage[]);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Eroare la încărcarea mesajelor.');
      } finally {
        if (!cancelled && showLoading) setIsLoading(false);
      }
    };

    setMessages([]);
    setError('');
    void loadMessages(true);
    const timer = window.setInterval(() => void loadMessages(false), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isOpen, activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, activeId]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  const openMessenger = () => {
    setIsOpen(true);
    // Pe ecrane late deschidem direct prima conversație; pe telefon arătăm întâi lista.
    if (!activeId && conversations.length > 0 && !isNarrowScreen()) setActiveId(conversations[0].id);
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeId || !draft.trim()) return;
    setIsSending(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/orders/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ content: draft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Nu am putut trimite mesajul.');
      setMessages((current) => [...current, { id: data.message.id, content: data.message.content, senderId: user.id, senderName: user.fullName, createdAt: data.message.created_at }]);
      setDraft('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Eroare la trimiterea mesajului.');
    } finally {
      setIsSending(false);
    }
  };

  // Bula apare doar după ce există cel puțin o comandă, deci cel puțin o conversație.
  if (conversations.length === 0) return null;

  if (!isOpen) {
    return (
      <button type="button" className="messenger-fab" onClick={openMessenger} aria-label={`Deschide mesajele (${conversations.length} conversații)`}>
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5L4.6 21.5a.5.5 0 0 0 .7.6l3.8-1.9c.9.2 1.9.3 2.9.3 5.5 0 10-3.9 10-8.8S17.5 3 12 3Z" /></svg>
        <span className="messenger-fab-count">{conversations.length}</span>
      </button>
    );
  }

  return (
    <section className={`messenger-panel${active ? ' has-active' : ''}`} role="dialog" aria-label="Mesaje">
      <header className="messenger-header">
        <strong>Mesaje</strong>
        <button type="button" className="messenger-icon-button" onClick={() => setIsOpen(false)} aria-label="Închide mesajele">×</button>
      </header>

      <div className="messenger-body">
        <div className="messenger-thread">
          {active ? <>
            <div className="messenger-thread-head">
              <button type="button" className="messenger-icon-button messenger-back" onClick={() => setActiveId(null)} aria-label="Înapoi la conversații">‹</button>
              <span className="messenger-avatar">{active.partnerName.slice(0, 1).toUpperCase() || '?'}</span>
              <div className="messenger-thread-title">
                <strong>{active.partnerName}</strong>
                <small>{active.productName} / {active.variety}</small>
              </div>
              <span className={orderStatusClass(active.status)}>{orderStatusLabel(active.status)}</span>
            </div>

            <div className="messenger-messages">
              {isLoading ? <p className="messenger-empty">Se încarcă mesajele...</p>
                : messages.length === 0 ? <p className="messenger-empty">Niciun mesaj încă. Scrie primul mesaj despre această comandă.</p>
                : messages.map((message) => {
                  const own = message.senderId === user.id;
                  return (
                    <div className={`messenger-bubble${own ? ' own' : ''}`} key={message.id}>
                      <p>{message.content}</p>
                      <time>{formatMessageTime(message.createdAt)}</time>
                    </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>

            {error && <p className="auth-feedback error messenger-error">{error}</p>}
            <form className="messenger-form" onSubmit={sendMessage}>
              <input required maxLength={2000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Scrie un mesaj..." aria-label="Mesaj" />
              <button type="submit" disabled={isSending || !draft.trim()} aria-label="Trimite mesajul">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12 3.39 13.87z" /></svg>
              </button>
            </form>
          </> : <p className="messenger-empty messenger-placeholder">Alege o conversație din listă.</p>}
        </div>

        <aside className="messenger-list" aria-label="Conversații">
          {conversations.map((conversation) => (
            <button type="button" key={conversation.id} className={`messenger-list-item${conversation.id === activeId ? ' active' : ''}`} onClick={() => setActiveId(conversation.id)}>
              <span className="messenger-avatar">{conversation.partnerName.slice(0, 1).toUpperCase() || '?'}</span>
              <span className="messenger-list-text">
                <strong>{conversation.partnerName}</strong>
                <small>{conversation.productName} / {conversation.variety}</small>
                <small className={orderStatusClass(conversation.status)}>{orderStatusLabel(conversation.status)}</small>
              </span>
            </button>
          ))}
        </aside>
      </div>
    </section>
  );
}
