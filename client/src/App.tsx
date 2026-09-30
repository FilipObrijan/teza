import { FormEvent, useEffect, useMemo, useState } from 'react';
import Messenger from './Messenger';
import { API_BASE, AuthUser, orderStatusClass, orderStatusLabel } from './shared';

type Listing = {
  id: string;
  product: string;
  variety: string;
  region: string;
  quantity: number;
  price: number;
  harvest: string;
  seller: string;
  sellerEmail?: string;
  sellerPhone?: string;
  imageUrl?: string | null;
  accent: string;
};

const formatDisplayDate = (value: unknown) => {
  if (!value) return 'recolta recenta';

  const raw = String(value).trim();
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}.${isoMatch[2]}.${isoMatch[1]}`;

  const slashMatch = raw.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})/);
  if (slashMatch) return `${slashMatch[1].padStart(2, '0')}.${slashMatch[2].padStart(2, '0')}.${slashMatch[3]}`;

  return raw;
};

type AuthMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

type PendingUser = AuthUser & {
  phone?: string;
  region?: string;
};

type PendingListing = {
  id: string;
  productName: string;
  variety: string;
  quantityKg: number;
  pricePerKg: number;
  region: string;
  sellerName: string;
  sellerEmail: string;
  imageUrl?: string | null;
};

type DashboardData = {
  role: 'seller' | 'distributor';
  stats: Record<string, number>;
  listings?: Array<{ id: string; productName: string; variety: string; quantityKg: number; pricePerKg: number; unitMeasure?: string; region: string; harvestDate?: string | null; deliveryTerms?: string | null; status: string; updatedAt: string }>;
  orders?: Array<{ id: string; productName: string; variety: string; sellerName: string; quantityKg: number; availableQuantityKg: number; status: string }>;
  receivedOrders?: Array<{ id: string; productName: string; variety: string; distributorName: string; distributorEmail?: string | null; distributorPhone?: string | null; quantityKg: number; unitPrice: number; totalAmount: number; status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'; notes?: string | null; createdAt: string }>;
};

type EditableOrder = { id: string; productName: string; quantityKg: number; availableQuantityKg: number; status: string };

function PersonalDashboard({ user, onBack }: { user: AuthUser; onBack: () => void }) {
  const isSeller = user.role === 'seller';
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardError, setDashboardError] = useState('');
  const [isListingFormOpen, setIsListingFormOpen] = useState(false);
  const [listingForm, setListingForm] = useState({ productName: '', variety: '', quantityKg: '', pricePerKg: '', unitMeasure: 'kg', region: '', harvestDate: '', deliveryTerms: '', image: null as File | null });
  const [listingError, setListingError] = useState('');
  const [isListingSubmitting, setIsListingSubmitting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [activeOrderMenuId, setActiveOrderMenuId] = useState<string | null>(null);
  const [activeReceivedOrderMenuId, setActiveReceivedOrderMenuId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ message: string; action: () => Promise<void> } | null>(null);
  // Erorile acțiunilor (ștergere, anulare etc.) apar ca notificare jos pe ecran, lângă locul unde s-a apăsat.
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!actionError) return;
    const timer = window.setTimeout(() => setActionError(''), 6000);
    return () => window.clearTimeout(timer);
  }, [actionError]);
  const [editingOrder, setEditingOrder] = useState<EditableOrder | null>(null);
  const [editedOrderQuantity, setEditedOrderQuantity] = useState('');
  const [editedOrderNotes, setEditedOrderNotes] = useState('');
  const [isOrderEditing, setIsOrderEditing] = useState(false);

  const resetListingForm = () => {
    setListingForm({ productName: '', variety: '', quantityKg: '', pricePerKg: '', unitMeasure: 'kg', region: '', harvestDate: '', deliveryTerms: '', image: null });
    setEditingListingId(null);
  };

  const openNewListing = () => {
    resetListingForm();
    setIsListingFormOpen(true);
  };

  const formatDateForInput = (value?: string | null) => {
    if (!value) return '';

    const raw = String(value).trim();
    if (!raw) return '';

    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return isoMatch[0];

    const slashMatch = raw.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})/);
    if (slashMatch) {
      const [, month, day, year] = slashMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const withTimeMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T\s].*/);
    if (withTimeMatch) return withTimeMatch[1] + '-' + withTimeMatch[2] + '-' + withTimeMatch[3];

    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return raw.slice(0, 10);
  };

  const openEditListing = (listing: { id: string; productName: string; variety: string; quantityKg: number; pricePerKg: number; unitMeasure?: string; region: string; harvestDate?: string | null; deliveryTerms?: string | null }) => {
    setListingForm({
      productName: listing.productName,
      variety: listing.variety,
      quantityKg: String(listing.quantityKg),
      pricePerKg: String(listing.pricePerKg),
      unitMeasure: listing.unitMeasure ?? 'kg',
      region: listing.region,
      harvestDate: formatDateForInput(listing.harvestDate),
      deliveryTerms: listing.deliveryTerms ?? '',
      image: null,
    });
    setEditingListingId(listing.id);
    setIsListingFormOpen(true);
    setActiveMenuId(null);
  };

  const performDeleteListing = async (listingId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('agrohub_token')}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message ?? 'Nu am putut șterge anunțul.');
      setActiveMenuId(null);
      await loadDashboard();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Eroare la ștergerea anunțului.');
    }
  };

  const deleteListing = (listingId: string) => {
    setConfirmation({ message: 'Sigur vrei să ștergi acest anunț?', action: () => performDeleteListing(listingId) });
  };

  const updateOrderStatus = async (orderId: string, status: 'confirmed' | 'rejected') => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('agrohub_token')}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message ?? 'Nu am putut actualiza cererea.');
      await loadDashboard();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Eroare la actualizarea cererii.');
    }
  };

  const performCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('agrohub_token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Nu am putut anula comanda.');
      setActiveOrderMenuId(null);
      await loadDashboard();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Eroare la anularea comenzii.');
    }
  };

  const cancelOrder = (orderId: string) => {
    setConfirmation({ message: 'Sigur vrei să anulezi această comandă?', action: () => performCancelOrder(orderId) });
  };

  const performDeleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('agrohub_token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Nu am putut șterge comanda.');
      setActiveOrderMenuId(null);
      await loadDashboard();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Eroare la ștergerea comenzii.');
    }
  };

  const deleteOrder = (orderId: string) => {
    setConfirmation({ message: 'Sigur vrei să ștergi această comandă din istoric?', action: () => performDeleteOrder(orderId) });
  };

  const openEditOrder = (order: EditableOrder) => {
    setEditingOrder(order);
    setEditedOrderQuantity(String(order.quantityKg));
    setEditedOrderNotes('');
    setActiveOrderMenuId(null);
  };

  const submitOrderEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingOrder) return;
    setIsOrderEditing(true);

    try {
      const response = await fetch(`${API_BASE}/api/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('agrohub_token')}` },
        body: JSON.stringify({ quantityKg: Number(editedOrderQuantity), notes: editedOrderNotes || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Nu am putut edita comanda.');
      setEditingOrder(null);
      await loadDashboard();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Eroare la editarea comenzii.');
    } finally {
      setIsOrderEditing(false);
    }
  };

  const performDeleteReceivedOrder = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('agrohub_token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Nu am putut șterge comanda.');
      setActiveReceivedOrderMenuId(null);
      await loadDashboard();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Eroare la ștergerea comenzii.');
    }
  };

  const deleteReceivedOrder = (orderId: string) => {
    setConfirmation({ message: 'Sigur vrei să ștergi această comandă?', action: () => performDeleteReceivedOrder(orderId) });
  };

  const loadDashboard = async () => {
    const token = sessionStorage.getItem('agrohub_token');

    try {
      const response = await fetch(`${API_BASE}/api/dashboard/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Nu am putut încărca datele cabinetului.');
      setDashboard(data as DashboardData);
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Eroare la încărcarea cabinetului.');
    }
  };

  useEffect(() => {
    loadDashboard();
    const refreshTimer = window.setInterval(loadDashboard, 5000);

    return () => window.clearInterval(refreshTimer);
  }, [user.id]);

  const submitListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setListingError('');
    setIsListingSubmitting(true);

    const payload = new FormData();
    payload.append('productName', listingForm.productName);
    payload.append('variety', listingForm.variety);
    payload.append('quantityKg', listingForm.quantityKg);
    payload.append('pricePerKg', listingForm.pricePerKg);
    payload.append('unitMeasure', listingForm.unitMeasure);
    payload.append('region', listingForm.region);
    payload.append('harvestDate', listingForm.harvestDate);
    payload.append('deliveryTerms', listingForm.deliveryTerms);
    if (listingForm.image) payload.append('image', listingForm.image);

    try {
      const response = await fetch(
        editingListingId ? `${API_BASE}/api/listings/${editingListingId}` : `${API_BASE}/api/listings`,
        {
          method: editingListingId ? 'PATCH' : 'POST',
          headers: { Authorization: `Bearer ${sessionStorage.getItem('agrohub_token')}` },
          body: payload,
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? (editingListingId ? 'Nu am putut salva modificările.' : 'Nu am putut crea anunțul.'));

      resetListingForm();
      setIsListingFormOpen(false);
      await loadDashboard();
    } catch (error) {
      setListingError(error instanceof Error ? error.message : (editingListingId ? 'Eroare la salvarea modificărilor.' : 'Eroare la crearea anunțului.'));
    } finally {
      setIsListingSubmitting(false);
    }
  };

  const stats = dashboard?.stats ?? {};
  const sellerListings = dashboard?.listings ?? [];
  const distributorOrders = dashboard?.orders ?? [];
  const receivedOrders = dashboard?.receivedOrders ?? [];
  const handleViewAllOrders = () => {
    if (distributorOrders.length === 0) {
      onBack();
      return;
    }

    setShowAllOrders(true);
  };

  return (
    <section className="dashboard-shell">
      {actionError && <div className="action-toast" role="alert"><span>{actionError}</span><button type="button" onClick={() => setActionError('')} aria-label="Închide mesajul">×</button></div>}
      {editingOrder && <div className="modal-backdrop" onClick={() => setEditingOrder(null)}><section className="listing-modal" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setEditingOrder(null)} aria-label="Inchide">x</button><p className="kicker">Editează comanda</p><h2>{editingOrder.productName}</h2><p>Modifică detaliile și retrimite comanda către vânzător.</p><p className="dashboard-muted">Stoc disponibil acum: {editingOrder.availableQuantityKg.toLocaleString('ro-RO')} kg</p><form className="listing-form" onSubmit={submitOrderEdit}><label>Cantitate dorită (kg)<input required min="0.01" max={editingOrder.availableQuantityKg} step="0.01" type="number" value={editedOrderQuantity} onChange={(event) => setEditedOrderQuantity(event.target.value)} /></label><label>Mesaj pentru vânzător <span className="optional-label">(opțional)</span><textarea value={editedOrderNotes} onChange={(event) => setEditedOrderNotes(event.target.value)} placeholder="Scrie un mesaj despre comandă..." /></label><button className="primary-action" type="submit" disabled={isOrderEditing}>{isOrderEditing ? 'Se salvează...' : 'Salvează și retrimite'}</button></form></section></div>}
      {confirmation && <div className="confirmation-backdrop" role="presentation"><section className="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-title"><span className="confirmation-mark">!</span><p className="kicker">Confirmă acțiunea</p><h2 id="confirmation-title">Ești sigur?</h2><p>{confirmation.message}</p><div className="confirmation-actions"><button type="button" className="cancel-action" onClick={() => setConfirmation(null)}>Renunță</button><button type="button" className="confirm-action" onClick={async () => { const action = confirmation.action; setConfirmation(null); await action(); }}>Confirmă</button></div></section></div>}
      <div className="dashboard-header">
        <div><button className="back-link" onClick={onBack}>&lt;- Catalog</button><p className="kicker">Cabinet personal</p><h1>{isSeller ? 'Spatiul tau de vanzator.' : 'Spatiul tau de distribuitor.'}</h1><p className="dashboard-description">{isSeller ? 'Gestioneaza-ti ofertele, stocul si comenzile primite dintr-un singur loc.' : 'Urmareste comenzile, descopera oferte si tine aproape furnizorii preferati.'}</p></div>
        <div className="profile-chip"><span className="profile-avatar">{user.fullName.slice(0, 1).toUpperCase()}</span><div><strong>{user.fullName}</strong><span>{isSeller ? 'Vanzator' : 'Distribuitor'}</span></div></div>
      </div>

      <div className={`dashboard-stats${isSeller ? '' : ' two-stats'}`}>
        {isSeller ? <><div><span>Anunturi active</span><strong>{stats.activeListings ?? 0}</strong><small>{stats.activeListings ? 'Oferte publicate' : 'Niciun anunt creat'}</small></div><div><span>Stoc disponibil</span><strong>{(stats.stockKg ?? 0).toLocaleString('ro-RO')} <small>kg</small></strong><small>{stats.stockKg ? 'Stoc in ofertele active' : 'Niciun produs adaugat'}</small></div><div><span>Comenzi primite</span><strong>{stats.receivedOrders ?? 0}</strong><small>{stats.pendingOrders ? `${stats.pendingOrders} necesita actiune` : 'Nicio vanzare inca'}</small></div></> : <><div><span>Comenzi active</span><strong>{stats.activeOrders ?? 0}</strong><small>{stats.activeOrders ? 'Comenzi in desfasurare' : 'Nicio comanda plasata'}</small></div><div><span>Cheltuieli luna aceasta</span><strong>{(stats.totalSpent ?? 0).toLocaleString('ro-RO')} <small>lei</small></strong><small>{stats.totalSpent ? 'Comenzi inregistrate' : 'Nicio achizitie inca'}</small></div></>}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel main-panel"><div className="panel-heading"><div><p className="kicker">{isSeller ? 'Activitatea ta' : 'Cumpararile tale'}</p><h2>{isSeller ? 'Anunturi si comenzi recente' : 'Comenzi recente'}</h2></div><button className="panel-action" onClick={isSeller ? openNewListing : handleViewAllOrders}>{isSeller ? '+ Anunt nou' : 'Vezi toate'}</button></div>
          {dashboardError && <p className="auth-feedback error">{dashboardError}</p>}
          {!dashboard && !dashboardError && <p className="dashboard-loading">Se încarcă datele cabinetului...</p>}
          {dashboard && isSeller && sellerListings.length === 0 && <div className="empty-dashboard"><strong>Nu ai încă anunțuri.</strong><span>Adaugă primul tău produs pentru a începe să vinzi.</span><button className="empty-action" onClick={openNewListing}>+ Adaugă primul anunț</button></div>}
          {dashboard && isSeller && sellerListings.length > 0 && <div className="activity-table">{sellerListings.map((listing) => <div className="table-row listing-row" key={listing.id}><span><strong>{listing.productName}</strong><small>{listing.variety}</small></span><span>{listing.quantityKg.toLocaleString('ro-RO')} kg</span><span className={listing.status === 'active' ? 'status-active' : 'status-paused'}>{listing.status}</span><div className="row-menu-wrap"><button className="row-more" aria-label="Mai multe opțiuni pentru anunț" onClick={() => setActiveMenuId(activeMenuId === listing.id ? null : listing.id)}>...</button>{activeMenuId === listing.id && <div className="listing-menu"><button type="button" className="menu-action" onClick={() => openEditListing(listing)}>Editează</button><button type="button" className="menu-action danger" onClick={() => void deleteListing(listing.id)}>Șterge</button></div>}</div></div>)}</div>}
          {dashboard && isSeller && <section className="received-orders"><div className="section-heading"><p className="kicker">Cereri de la distribuitori</p><h2>Oferte primite</h2></div>{receivedOrders.length === 0 ? <p className="dashboard-muted">Nu ai primit încă nicio cerere de comandă.</p> : <div className="activity-table">{receivedOrders.map((order) => <div className="received-order" key={order.id}><div><strong>{order.productName} / {order.variety}</strong><small>{order.distributorName} · {order.distributorPhone || order.distributorEmail || 'Contact indisponibil'}</small>{order.notes && <small>Mesaj: {order.notes}</small>}</div><span>{order.quantityKg.toLocaleString('ro-RO')} kg</span><span>{order.totalAmount.toLocaleString('ro-RO')} lei</span><span className={orderStatusClass(order.status)}>{orderStatusLabel(order.status)}</span>{order.status === 'pending' && <div className="order-actions"><button type="button" className="approve-button" onClick={() => void updateOrderStatus(order.id, 'confirmed')}>Acceptă</button><button type="button" className="reject-button" onClick={() => void updateOrderStatus(order.id, 'rejected')}>Refuză</button></div>}<div className="row-menu-wrap received-order-menu-wrap">{order.status !== 'pending' && <button type="button" className="row-more order-more" aria-label="Mai multe opțiuni pentru oferta primită" aria-expanded={activeReceivedOrderMenuId === order.id} onClick={() => setActiveReceivedOrderMenuId(activeReceivedOrderMenuId === order.id ? null : order.id)}>...</button>}{activeReceivedOrderMenuId === order.id && <div className="listing-menu order-menu"><button type="button" className="menu-action danger" onClick={() => void deleteReceivedOrder(order.id)}>Șterge comanda</button></div>}</div></div>)}</div>}</section>}
          {dashboard && !isSeller && distributorOrders.length === 0 && <div className="empty-dashboard"><strong>Nu ai încă comenzi.</strong><span>Explorează catalogul pentru a găsi produsele potrivite.</span><button className="empty-action" onClick={onBack}>Explorează catalogul <span>-&gt;</span></button></div>}
          {dashboard && !isSeller && distributorOrders.length > 0 && <div className="activity-table">{distributorOrders.slice(0, showAllOrders ? undefined : 10).map((order) => <div className="table-row" key={order.id}><span><strong>#{order.id.slice(0, 8)}</strong><small>{order.productName} / {order.quantityKg.toLocaleString('ro-RO')} kg</small></span><span>{order.sellerName}</span><span className={orderStatusClass(order.status)}>{orderStatusLabel(order.status)}</span><div className="row-menu-wrap"><button type="button" className="row-more order-more" aria-label="Mai multe opțiuni pentru comandă" aria-expanded={activeOrderMenuId === order.id} onClick={() => setActiveOrderMenuId(activeOrderMenuId === order.id ? null : order.id)}>...</button>{activeOrderMenuId === order.id && <div className="listing-menu order-menu"><button type="button" className="menu-action" onClick={() => void cancelOrder(order.id)}>Anulează comanda</button><button type="button" className="menu-action" onClick={() => openEditOrder(order)}>Editează comanda</button>{order.status !== 'pending' && <button type="button" className="menu-action danger" onClick={() => void deleteOrder(order.id)}>Șterge din istoric</button>}</div>}</div></div>)}</div>}
        </section>
      </div>
      {isListingFormOpen && <div className="modal-backdrop" onClick={() => { resetListingForm(); setIsListingFormOpen(false); }}><section className="listing-modal" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => { resetListingForm(); setIsListingFormOpen(false); }} aria-label="Inchide">x</button><p className="kicker">{editingListingId ? 'Editeaza anuntul' : 'Oferta noua'}</p><h2>{editingListingId ? 'Modifica anuntul.' : 'Adauga un anunt.'}</h2><p>{editingListingId ? 'Actualizeaza detaliile existente si salveaza modificarile.' : 'Completeaza datele produsului pe care vrei sa il oferi.'}</p><form className="listing-form" onSubmit={submitListing}><label>Fotografie produs<span className="optional-label">{editingListingId ? ' (opțional)' : ' (obligatorie)'}</span><input required={!editingListingId} accept="image/*" type="file" onChange={(event) => setListingForm({ ...listingForm, image: event.target.files?.[0] ?? null })} /></label><label>Produs<input required value={listingForm.productName} onChange={(event) => setListingForm({ ...listingForm, productName: event.target.value })} placeholder="Ex: Rosii" /></label><label>Soi / varietate<input required value={listingForm.variety} onChange={(event) => setListingForm({ ...listingForm, variety: event.target.value })} placeholder="Ex: Cherry premium" /></label><div className="form-row"><label>Cantitate (kg)<input required min="0.01" step="0.01" type="number" value={listingForm.quantityKg} onChange={(event) => setListingForm({ ...listingForm, quantityKg: event.target.value })} /></label><label>Pret / kg<input required min="0" step="0.01" type="number" value={listingForm.pricePerKg} onChange={(event) => setListingForm({ ...listingForm, pricePerKg: event.target.value })} /></label></div><label>Regiune<input required value={listingForm.region} onChange={(event) => setListingForm({ ...listingForm, region: event.target.value })} placeholder="Ex: Cluj" /></label><div className="form-row"><label>Data recoltei<input type="date" value={listingForm.harvestDate || ''} onChange={(event) => setListingForm({ ...listingForm, harvestDate: event.target.value })} /></label><label>Unitate<select value={listingForm.unitMeasure} onChange={(event) => setListingForm({ ...listingForm, unitMeasure: event.target.value })}><option value="kg">kg</option><option value="tona">tona</option><option value="lada">lada</option></select></label></div><label>Termeni de livrare<input value={listingForm.deliveryTerms || ''} onChange={(event) => setListingForm({ ...listingForm, deliveryTerms: event.target.value })} placeholder="Ex: Livrare in 24h" /></label>{listingError && <p className="auth-feedback error">{listingError}</p>}<button className="primary-action" type="submit" disabled={isListingSubmitting}>{isListingSubmitting ? 'Se salveaza...' : editingListingId ? 'Salveaza modificarile' : 'Publica anuntul'}</button></form></section></div>}
    </section>
  );
}

export default function App() {
  const apiUrl = `${API_BASE}/api/auth`;
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('Toate regiunile');
  const [sort, setSort] = useState('recent');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '', role: 'distributor', phone: '', region: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [adminError, setAdminError] = useState('');
  const [activeView, setActiveView] = useState<'catalog' | 'dashboard'>('catalog');
  const [catalogListings, setCatalogListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [orderError, setOrderError] = useState('');
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);

  const loadCatalog = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/listings`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Nu am putut încărca catalogul.');
      setCatalogListings((data.listings as Array<Record<string, unknown>>).map((item, index) => ({
        id: String(item.id),
        product: String(item.productName),
        variety: String(item.variety),
        region: String(item.region),
        quantity: Number(item.quantityKg),
        price: Number(item.pricePerKg),
        harvest: formatDisplayDate(item.harvestDate),
        seller: String(item.sellerName ?? 'Producator verificat'),
        sellerEmail: item.sellerEmail ? String(item.sellerEmail) : undefined,
        sellerPhone: item.sellerPhone ? String(item.sellerPhone) : undefined,
        imageUrl: item.imageUrl ? `${API_BASE}/api/listings/${String(item.id)}/image` : null,
        accent: ['#e76f51', '#d4a373', '#8ab17d', '#e9c46a'][index % 4],
      })));
    } catch {
      setCatalogListings([]);
    }
  };

  useEffect(() => {
    loadCatalog();
    const refreshTimer = window.setInterval(loadCatalog, 5000);

    return () => window.clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('agrohub_token');
    if (!token) return;

    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? 'Sesiune expirată.');
        setAuthUser(data.user);
      })
      .catch(() => {
        sessionStorage.removeItem('agrohub_token');
      });
  }, []);

  useEffect(() => {
    document.body.style.overflow = isLoginOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoginOpen]);

  const filteredListings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = catalogListings.filter((listing) => {
      const matchesSearch = [listing.product, listing.variety, listing.seller].join(' ').toLowerCase().includes(normalizedSearch);
      const matchesRegion = region === 'Toate regiunile' || listing.region === region;
      return matchesSearch && matchesRegion;
    });

    return [...filtered].sort((first, second) => {
      if (sort === 'price') return first.price - second.price;
      if (sort === 'quantity') return second.quantity - first.quantity;
      return first.id.localeCompare(second.id);
    });
  }, [catalogListings, region, search, sort]);

  const regions = ['Toate regiunile', ...new Set(catalogListings.map((listing) => listing.region))];
  const canUseOfferActions = authUser?.role === 'admin' || authUser?.role === 'distributor';

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthMessage('');
    setAuthError('');
    setIsLoginOpen(true);
  };

  const resendVerificationCode = async () => {
    setAuthMessage('');
    setAuthError('');

    try {
      const response = await fetch(`${apiUrl}/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Nu am putut trimite codul.');
      setAuthMessage(data.message);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Nu am putut trimite codul.');
    }
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMessage('');
    setAuthError('');
    setIsSubmitting(true);

    const endpoints: Record<AuthMode, string> = {
      login: 'login',
      register: 'register',
      verify: 'verify-email',
      forgot: 'forgot-password',
      reset: 'reset-password',
    };
    const endpoint = endpoints[authMode];
    const body = authMode === 'login'
      ? { email: authForm.email, password: authForm.password }
      : authMode === 'verify'
        ? { email: authForm.email, code: verificationCode }
        : authMode === 'forgot'
          ? { email: authForm.email }
          : authMode === 'reset'
            ? { email: authForm.email, code: verificationCode, password: authForm.password }
            : authForm;

    // Pe hosting gratuit serverul adoarme; prima cerere poate dura până la un minut.
    const slowServerTimer = window.setTimeout(() => {
      setAuthMessage('Serverul pornește, poate dura până la un minut. Te rugăm să aștepți...');
    }, 4000);

    try {
      const response = await fetch(`${apiUrl}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));

      window.clearTimeout(slowServerTimer);
      setAuthMessage('');

      if (!response.ok) {
        throw new Error(data.message ?? 'A apărut o eroare.');
      }

      if (authMode === 'login') {
        sessionStorage.setItem('agrohub_token', data.token);
        setAuthUser(data.user);
        setIsLoginOpen(false);
      } else if (authMode === 'verify') {
        setAuthMessage(data.message ?? 'Email verificat. Acum te poți autentifica.');
        setVerificationCode('');
        setAuthMode('login');
      } else if (authMode === 'forgot') {
        setAuthMessage(data.message);
        setVerificationCode('');
        setAuthForm((current) => ({ ...current, password: '' }));
        setAuthMode('reset');
      } else if (authMode === 'reset') {
        setAuthMessage(data.message);
        setVerificationCode('');
        setAuthForm((current) => ({ ...current, password: '' }));
        setAuthMode('login');
      } else {
        setAuthMessage('Cont creat. Verifică emailul cu codul primit, apoi așteaptă aprobarea administratorului.');
        setAuthMode('verify');
        setAuthForm((current) => ({ ...current, password: '' }));
      }
    } catch (error) {
      window.clearTimeout(slowServerTimer);
      setAuthMessage('');
      // fetch aruncă TypeError doar când serverul nu poate fi contactat deloc.
      const message = error instanceof TypeError
        ? 'Nu am putut contacta serverul. Verifică conexiunea și încearcă din nou.'
        : error instanceof Error ? error.message : 'A apărut o eroare.';
      if (authMode === 'login' && message.includes('Verifică mai întâi')) {
        setAuthMode('verify');
      }
      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAdminPanel = async () => {
    const token = sessionStorage.getItem('agrohub_token');
    setAdminError('');
    setIsAdminOpen(true);

    try {
      const [usersResponse, listingsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users?status=pending`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/listings?status=pending`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const usersData = await usersResponse.json();
      const listingsData = await listingsResponse.json();

      if (!usersResponse.ok) throw new Error(usersData.message ?? 'Nu am putut încărca cererile.');
      if (!listingsResponse.ok) throw new Error(listingsData.message ?? 'Nu am putut încărca anunțurile.');
      setPendingUsers(usersData.users);
      setPendingListings(listingsData.listings);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Eroare la încărcarea cererilor.');
    }
  };

  const updateListingStatus = async (listingId: string, status: 'active' | 'archived') => {
    const token = sessionStorage.getItem('agrohub_token');

    try {
      const response = await fetch(`${API_BASE}/api/admin/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message ?? 'Nu am putut actualiza anunțul.');
      setPendingListings((listings) => listings.filter((listing) => listing.id !== listingId));
      await loadCatalog();
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Eroare la actualizarea anunțului.');
    }
  };

  const deleteAdminListing = async (listingId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('agrohub_token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Nu am putut șterge anunțul.');
      setPendingListings((listings) => listings.filter((listing) => listing.id !== listingId));
      await loadCatalog();
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Eroare la ștergerea anunțului.');
    }
  };

  const updateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    const token = sessionStorage.getItem('agrohub_token');

    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message ?? 'Nu am putut actualiza utilizatorul.');
      setPendingUsers((users) => users.filter((user) => user.id !== userId));
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Eroare la actualizarea utilizatorului.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('agrohub_token');
    setAuthUser(null);
    setActiveView('catalog');
    setIsAdminOpen(false);
    setPendingUsers([]);
    setPendingListings([]);
  };

  const openListingDetails = (listing: Listing) => {
    setSelectedListing(listing);
    setOrderQuantity('');
    setOrderNotes('');
    setOrderMessage('');
    setOrderError('');
  };

  const closeListingDetails = () => {
    if (!isOrderSubmitting) setSelectedListing(null);
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedListing) return;

    setOrderMessage('');
    setOrderError('');
    setIsOrderSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('agrohub_token')}` },
        body: JSON.stringify({ listingId: selectedListing.id, quantityKg: Number(orderQuantity), notes: orderNotes || null }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message ?? 'Nu am putut trimite cererea de comandă.');
      setOrderMessage('Cererea de comandă a fost trimisă vânzătorului.');
      setOrderQuantity('');
      setOrderNotes('');
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Eroare la trimiterea comenzii.');
    } finally {
      setIsOrderSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href={import.meta.env.BASE_URL}><span className="brand-mark">A</span><span>agro<span>hub</span></span></a>
        <nav className="main-nav" aria-label="Navigare principala"><a className="active" href="#catalog">Catalog</a><a href="#how-it-works">Cum functioneaza</a></nav>
        <div className="top-actions">
          {authUser && <>{authUser.role !== 'admin' && <button className="cabinet-button" onClick={() => setActiveView('dashboard')}>Cabinetul meu</button>}<span className="welcome-message">Salut, {authUser.fullName}</span></>}
          {authUser?.role === 'admin' && <button className="admin-button" onClick={openAdminPanel}>Panou admin</button>}
          <button className="login-button" onClick={authUser ? handleLogout : () => openAuth('login')}>{authUser ? 'Ieși din cont' : 'Intra in cont'} <span aria-hidden="true">-&gt;</span></button>
        </div>
      </header>

      {activeView === 'dashboard' ? <PersonalDashboard user={authUser!} onBack={() => setActiveView('catalog')} /> : <>
      <section className="catalog-hero" id="catalog">
        <div><p className="kicker">Piata B2B pentru agricultura</p><h1>Marfa buna, <em>direct</em> de la sursa.</h1><p className="hero-description">Descopera oferte verificate de la producatori agricoli din Romania si construieste-ti urmatoarea comanda en-gros.</p></div>
        <div className="hero-note"><span className="pulse" /><strong>{catalogListings.length} oferte active</strong><span>din baza de date</span></div>
      </section>

      <section className="toolbar" aria-label="Filtre catalog">
        <label className="search-field"><span aria-hidden="true">/</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cauta produs, soi sau producator" type="search" /></label>
        <label className="select-field"><span>Regiune</span><select value={region} onChange={(event) => setRegion(event.target.value)}>{regions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="select-field sort-field"><span>Sorteaza</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Cele mai noi</option><option value="price">Pret crescator</option><option value="quantity">Cantitate disponibila</option></select></label>
      </section>

      <section className="catalog-heading"><div><p className="kicker">Oferte disponibile</p><h2>Catalogul de azi</h2></div><span className="result-count">{filteredListings.length} rezultate</span></section>

      <section className="listing-grid">
        {filteredListings.map((listing) => (
          <article className="listing-card" key={listing.id}>
            <div className="produce-image" style={{ backgroundColor: listing.accent }}>{listing.imageUrl && <img src={listing.imageUrl} alt={listing.product} onError={(event) => { event.currentTarget.style.display = 'none'; const fallback = event.currentTarget.nextElementSibling; if (fallback instanceof HTMLElement) fallback.style.display = 'block'; }} />}<span className={listing.imageUrl ? 'image-fallback' : ''}>{listing.product.slice(0, 1)}</span><small>VERIFICAT</small></div>
            <div className="listing-content"><div className="listing-title-row"><div><p className="listing-region">{listing.region} / {listing.harvest}</p><h3>{listing.product}</h3><p className="variety">{listing.variety}</p></div>{canUseOfferActions && <button className="bookmark" aria-label={`Salveaza oferta ${listing.product}`}>+</button>}</div>
              <div className="listing-meta"><div><span>Disponibil</span><strong>{listing.quantity.toLocaleString('ro-RO')} kg</strong></div><div><span>Pret en-gros</span><strong>{listing.price.toFixed(2).replace('.', ',')} lei/kg</strong></div></div>
              <div className="listing-footer"><span className="seller"><span className="seller-dot" /> {listing.seller}</span>{canUseOfferActions && <button className="details-button" onClick={() => openListingDetails(listing)}>Vezi oferta <span aria-hidden="true">-&gt;</span></button>}{authUser?.role === 'admin' && <button className="catalog-delete-button" type="button" onClick={() => void deleteAdminListing(listing.id)}>Șterge anunțul</button>}</div>
            </div>
          </article>
        ))}
      </section>
      {filteredListings.length === 0 && <div className="empty-state">Nu am gasit oferte pentru filtrele alese.</div>}

      <footer id="how-it-works"><span>agrohub / marketplace agricol B2B</span><span>Oferte verificate. Decizii mai rapide.</span></footer>
      </>}

      {selectedListing && <div className="modal-backdrop" onClick={closeListingDetails}><section className="listing-modal" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={closeListingDetails} aria-label="Inchide">x</button><p className="kicker">Detalii ofertă</p><h2>{selectedListing.product}</h2><p className="variety">{selectedListing.variety}</p><div className="listing-meta"><div><span>Disponibil</span><strong>{selectedListing.quantity.toLocaleString('ro-RO')} kg</strong></div><div><span>Pret en-gros</span><strong>{selectedListing.price.toFixed(2).replace('.', ',')} lei/kg</strong></div></div><div className="offer-details"><span>Regiune</span><strong>{selectedListing.region}</strong><span>Data recoltei</span><strong>{selectedListing.harvest}</strong><span>Vânzător</span><strong>{selectedListing.seller}</strong><span>Telefon</span><strong>{selectedListing.sellerPhone || 'Indisponibil'}</strong><span>Email</span><strong>{selectedListing.sellerEmail || 'Indisponibil'}</strong></div>{authUser?.role === 'distributor' ? <form className="listing-form" onSubmit={submitOrder}><label>Cantitate dorită (kg)<input required min="0.01" max={selectedListing.quantity} step="0.01" type="number" value={orderQuantity} onChange={(event) => setOrderQuantity(event.target.value)} /></label><label>Mesaj pentru vânzător <span className="optional-label">(opțional)</span><textarea value={orderNotes} onChange={(event) => setOrderNotes(event.target.value)} placeholder="Scrie un mesaj despre livrare sau comandă..." /></label>{orderError && <p className="auth-feedback error">{orderError}</p>}{orderMessage && <p className="auth-feedback success">{orderMessage}</p>}<button className="primary-action" type="submit" disabled={isOrderSubmitting}>{isOrderSubmitting ? 'Se trimite...' : 'Trimite cererea'}</button></form> : <button className="primary-action" type="button" onClick={() => openAuth('login')}>Intră în cont pentru a comanda</button>}</section></div>}

      {isLoginOpen && <div className="modal-backdrop" onClick={() => setIsLoginOpen(false)}><section className="login-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={() => setIsLoginOpen(false)} aria-label="Inchide">x</button>
        {(authMode === 'login' || authMode === 'register') && <div className="auth-tabs"><button className={authMode === 'login' ? 'selected' : ''} onClick={() => openAuth('login')}>Autentificare</button><button className={authMode === 'register' ? 'selected' : ''} onClick={() => openAuth('register')}>Cont nou</button></div>}
        <p className="kicker">Acces platforma</p>
        <h2>{{ login: 'Bine ai revenit.', register: 'Creeaza-ti contul.', verify: 'Verifică adresa de email.', forgot: 'Ai uitat parola?', reset: 'Setează o parolă nouă.' }[authMode]}</h2>
        <p>{{ login: 'Intra in cont pentru a continua.', register: 'Alege rolul potrivit pentru activitatea ta.', verify: 'Introdu codul de 6 cifre trimis la adresa ta.', forgot: 'Introdu emailul contului și îți trimitem un cod de resetare.', reset: 'Introdu codul primit pe email și noua parolă.' }[authMode]}</p>
        <form onSubmit={handleAuthSubmit}>
          {authMode === 'register' && <label>Nume complet<input required value={authForm.fullName} onChange={(event) => setAuthForm({ ...authForm, fullName: event.target.value })} placeholder="Nume si prenume" /></label>}
          <label>Email<input required type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="nume@companie.ro" /></label>
          {(authMode === 'verify' || authMode === 'reset') && <label>{authMode === 'verify' ? 'Cod de verificare' : 'Cod de resetare'}<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} placeholder="123456" /></label>}
          {authMode === 'login' && <label>Parola<input required type="password" autoComplete="current-password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="Parola ta" /></label>}
          {(authMode === 'register' || authMode === 'reset') && <label>{authMode === 'reset' ? 'Parola nouă' : 'Parola'}<input required minLength={8} type="password" autoComplete="new-password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="Minimum 8 caractere" /></label>}
          {authMode === 'register' && <>
            <label>Tip cont<select value={authForm.role} onChange={(event) => setAuthForm({ ...authForm, role: event.target.value })}><option value="distributor">Distribuitor</option><option value="seller">Vanzator</option></select></label>
            <label>Telefon<input value={authForm.phone} onChange={(event) => setAuthForm({ ...authForm, phone: event.target.value })} placeholder="07xx xxx xxx" /></label>
            <label>Regiune<input value={authForm.region} onChange={(event) => setAuthForm({ ...authForm, region: event.target.value })} placeholder="Judet / regiune" /></label>
          </>}
          {authError && <p className="auth-feedback error">{authError}</p>}
          {authMessage && <p className="auth-feedback success">{authMessage}</p>}
          <button className="primary-action" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Se proceseaza...' : { login: 'Intra in cont', register: 'Creeaza cont', verify: 'Verifică emailul', forgot: 'Trimite codul', reset: 'Schimbă parola' }[authMode]}</button>
        </form>
        <div className="auth-links">
          {authMode === 'login' && <button type="button" className="text-button" onClick={() => openAuth('forgot')}>Ai uitat parola?</button>}
          {authMode === 'verify' && <button type="button" className="text-button" disabled={!authForm.email} onClick={() => void resendVerificationCode()}>Retrimite codul</button>}
          {authMode === 'reset' && <button type="button" className="text-button" onClick={() => openAuth('forgot')}>Nu ai primit codul?</button>}
          {(authMode === 'verify' || authMode === 'forgot' || authMode === 'reset') && <button type="button" className="text-button" onClick={() => openAuth('login')}>Înapoi la autentificare</button>}
        </div>
      </section></div>}

      {isAdminOpen && <div className="modal-backdrop" onClick={() => setIsAdminOpen(false)}><section className="admin-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={() => setIsAdminOpen(false)} aria-label="Inchide">x</button>
        <p className="kicker">Administrare</p>
        <h2>Cereri de aprobare</h2>
        <p className="admin-summary">Conturile și anunțurile noi apar aici până când le aprobi.</p>
        {adminError && <p className="auth-feedback error">{adminError}</p>}
        <p className="admin-section-label">Utilizatori</p>
        {pendingUsers.length === 0 ? <p className="empty-admin">Nu există conturi în așteptare.</p> : <div className="pending-list">{pendingUsers.map((user) => <article className="pending-user" key={user.id}><div><strong>{user.fullName}</strong><span>{user.email} / {user.role === 'seller' ? 'Vânzător' : 'Distribuitor'}</span><small>{user.region || 'Regiune nespecificată'}</small></div><div className="pending-actions"><button className="approve-button" onClick={() => updateUserStatus(user.id, 'approved')}>Aprobă</button><button className="reject-button" onClick={() => updateUserStatus(user.id, 'rejected')}>Respinge</button></div></article>)}</div>}
        <p className="admin-section-label">Anunțuri</p>
        {pendingListings.length === 0 ? <p className="empty-admin">Nu există anunțuri în așteptare.</p> : <div className="pending-list">{pendingListings.map((listing) => <article className="pending-user" key={listing.id}><div className="pending-listing-info">{listing.imageUrl && <img className="pending-listing-image" src={`${API_BASE}/api/listings/${listing.id}/image`} alt={listing.productName} />}<div><strong>{listing.productName} / {listing.variety}</strong><span>{listing.quantityKg.toLocaleString('ro-RO')} kg la {listing.pricePerKg.toFixed(2)} lei/kg</span><small>{listing.sellerName} / {listing.region}</small></div></div><div className="pending-actions"><button className="approve-button" onClick={() => updateListingStatus(listing.id, 'active')}>Aprobă</button><button className="reject-button" onClick={() => updateListingStatus(listing.id, 'archived')}>Respinge</button><button className="delete-admin-button" onClick={() => deleteAdminListing(listing.id)}>Șterge</button></div></article>)}</div>}
      </section></div>}

      {authUser && authUser.role !== 'admin' && <Messenger key={authUser.id} user={authUser} />}
    </main>
  );
}
