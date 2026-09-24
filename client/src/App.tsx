import { FormEvent, useEffect, useMemo, useState } from 'react';

type Listing = {
  id: string;
  product: string;
  variety: string;
  region: string;
  quantity: number;
  price: number;
  harvest: string;
  seller: string;
  accent: string;
};

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'seller' | 'distributor' | 'admin';
  status: string;
};

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
};

type DashboardData = {
  role: 'seller' | 'distributor';
  stats: Record<string, number>;
  listings?: Array<{ id: string; productName: string; variety: string; quantityKg: number; status: string; updatedAt: string }>;
  orders?: Array<{ id: string; productName: string; variety: string; sellerName: string; quantityKg: number; status: string }>;
};

function PersonalDashboard({ user, onBack }: { user: AuthUser; onBack: () => void }) {
  const isSeller = user.role === 'seller';
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardError, setDashboardError] = useState('');
  const [isListingFormOpen, setIsListingFormOpen] = useState(false);
  const [listingForm, setListingForm] = useState({ productName: '', variety: '', quantityKg: '', pricePerKg: '', unitMeasure: 'kg', region: '', harvestDate: '', deliveryTerms: '' });
  const [listingError, setListingError] = useState('');
  const [isListingSubmitting, setIsListingSubmitting] = useState(false);

  const loadDashboard = async () => {
    const token = localStorage.getItem('agrohub_token');

    try {
      const response = await fetch('http://localhost:4000/api/dashboard/me', { headers: { Authorization: `Bearer ${token}` } });
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

    try {
      const response = await fetch('http://localhost:4000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('agrohub_token')}` },
        body: JSON.stringify({
          ...listingForm,
          quantityKg: Number(listingForm.quantityKg),
          pricePerKg: Number(listingForm.pricePerKg),
          harvestDate: listingForm.harvestDate || null,
          deliveryTerms: listingForm.deliveryTerms || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Nu am putut crea anunțul.');

      setListingForm({ productName: '', variety: '', quantityKg: '', pricePerKg: '', unitMeasure: 'kg', region: '', harvestDate: '', deliveryTerms: '' });
      setIsListingFormOpen(false);
      await loadDashboard();
    } catch (error) {
      setListingError(error instanceof Error ? error.message : 'Eroare la crearea anunțului.');
    } finally {
      setIsListingSubmitting(false);
    }
  };

  const stats = dashboard?.stats ?? {};
  const sellerListings = dashboard?.listings ?? [];
  const distributorOrders = dashboard?.orders ?? [];

  return (
    <section className="dashboard-shell">
      <div className="dashboard-header">
        <div><button className="back-link" onClick={onBack}>&lt;- Catalog</button><p className="kicker">Cabinet personal</p><h1>{isSeller ? 'Spatiul tau de vanzator.' : 'Spatiul tau de distribuitor.'}</h1><p className="dashboard-description">{isSeller ? 'Gestioneaza-ti ofertele, stocul si comenzile primite dintr-un singur loc.' : 'Urmareste comenzile, descopera oferte si tine aproape furnizorii preferati.'}</p></div>
        <div className="profile-chip"><span className="profile-avatar">{user.fullName.slice(0, 1).toUpperCase()}</span><div><strong>{user.fullName}</strong><span>{isSeller ? 'Vanzator' : 'Distribuitor'}</span></div></div>
      </div>

      <div className="dashboard-stats">
        {isSeller ? <><div><span>Anunturi active</span><strong>{stats.activeListings ?? 0}</strong><small>{stats.activeListings ? 'Oferte publicate' : 'Niciun anunt creat'}</small></div><div><span>Stoc disponibil</span><strong>{(stats.stockKg ?? 0).toLocaleString('ro-RO')} <small>kg</small></strong><small>{stats.stockKg ? 'Stoc in ofertele active' : 'Niciun produs adaugat'}</small></div><div><span>Comenzi primite</span><strong>{stats.receivedOrders ?? 0}</strong><small>{stats.pendingOrders ? `${stats.pendingOrders} necesita actiune` : 'Nicio vanzare inca'}</small></div></> : <><div><span>Comenzi active</span><strong>{stats.activeOrders ?? 0}</strong><small>{stats.activeOrders ? 'Comenzi in desfasurare' : 'Nicio comanda plasata'}</small></div><div><span>Furnizori salvati</span><strong>{stats.savedSuppliers ?? 0}</strong><small>Niciun furnizor salvat</small></div><div><span>Cheltuieli luna aceasta</span><strong>{(stats.totalSpent ?? 0).toLocaleString('ro-RO')} <small>lei</small></strong><small>{stats.totalSpent ? 'Comenzi inregistrate' : 'Nicio achizitie inca'}</small></div></>}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel main-panel"><div className="panel-heading"><div><p className="kicker">{isSeller ? 'Activitatea ta' : 'Cumpararile tale'}</p><h2>{isSeller ? 'Anunturi si comenzi recente' : 'Comenzi recente'}</h2></div><button className="panel-action" onClick={isSeller ? () => setIsListingFormOpen(true) : undefined}>{isSeller ? '+ Anunt nou' : 'Vezi toate'}</button></div>
          {dashboardError && <p className="auth-feedback error">{dashboardError}</p>}
          {!dashboard && !dashboardError && <p className="dashboard-loading">Se încarcă datele cabinetului...</p>}
          {dashboard && isSeller && sellerListings.length === 0 && <div className="empty-dashboard"><strong>Nu ai încă anunțuri.</strong><span>Adaugă primul tău produs pentru a începe să vinzi.</span><button className="empty-action" onClick={() => setIsListingFormOpen(true)}>+ Adaugă primul anunț</button></div>}
          {dashboard && isSeller && sellerListings.length > 0 && <div className="activity-table">{sellerListings.map((listing) => <div className="table-row" key={listing.id}><span><strong>{listing.productName}</strong><small>{listing.variety}</small></span><span>{listing.quantityKg.toLocaleString('ro-RO')} kg</span><span className={listing.status === 'active' ? 'status-active' : 'status-paused'}>{listing.status}</span><button className="row-more">...</button></div>)}</div>}
          {dashboard && !isSeller && distributorOrders.length === 0 && <div className="empty-dashboard"><strong>Nu ai încă comenzi.</strong><span>Explorează catalogul pentru a găsi produsele potrivite.</span><button className="empty-action">Explorează catalogul <span>-&gt;</span></button></div>}
          {dashboard && !isSeller && distributorOrders.length > 0 && <div className="activity-table">{distributorOrders.map((order) => <div className="table-row" key={order.id}><span><strong>#{order.id.slice(0, 8)}</strong><small>{order.productName} / {order.quantityKg.toLocaleString('ro-RO')} kg</small></span><span>{order.sellerName}</span><span className="status-pending">{order.status}</span><button className="row-more">...</button></div>)}</div>}
        </section>
        <aside className="dashboard-panel side-panel"><p className="kicker">Actiune rapida</p><h2>{isSeller ? 'Publica primul anunt.' : 'Gaseste marfa potrivita.'}</h2><p>{isSeller ? 'Completeaza oferta ta pentru ca distribuitorii sa o poata descoperi.' : 'Catalogul este gata pentru prima ta comanda en-gros.'}</p><button className="wide-action" onClick={isSeller ? () => setIsListingFormOpen(true) : undefined}>{isSeller ? '+ Adauga anunt' : 'Exploreaza catalogul'} <span>-&gt;</span></button><div className="side-divider" /><p className="kicker">Profilul tau</p><div className="profile-progress"><span><i /></span><strong>Profil completat 0%</strong></div><small>Adauga datele companiei pentru a-ti completa profilul.</small></aside>
      </div>
      {isListingFormOpen && <div className="modal-backdrop" onClick={() => setIsListingFormOpen(false)}><section className="listing-modal" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setIsListingFormOpen(false)} aria-label="Inchide">x</button><p className="kicker">Oferta noua</p><h2>Adauga un anunt.</h2><p>Completeaza datele produsului pe care vrei sa il oferi.</p><form className="listing-form" onSubmit={submitListing}><label>Produs<input required value={listingForm.productName} onChange={(event) => setListingForm({ ...listingForm, productName: event.target.value })} placeholder="Ex: Rosii" /></label><label>Soi / varietate<input required value={listingForm.variety} onChange={(event) => setListingForm({ ...listingForm, variety: event.target.value })} placeholder="Ex: Cherry premium" /></label><div className="form-row"><label>Cantitate (kg)<input required min="0.01" step="0.01" type="number" value={listingForm.quantityKg} onChange={(event) => setListingForm({ ...listingForm, quantityKg: event.target.value })} /></label><label>Pret / kg<input required min="0" step="0.01" type="number" value={listingForm.pricePerKg} onChange={(event) => setListingForm({ ...listingForm, pricePerKg: event.target.value })} /></label></div><label>Regiune<input required value={listingForm.region} onChange={(event) => setListingForm({ ...listingForm, region: event.target.value })} placeholder="Ex: Cluj" /></label><div className="form-row"><label>Data recoltei<input type="date" value={listingForm.harvestDate} onChange={(event) => setListingForm({ ...listingForm, harvestDate: event.target.value })} /></label><label>Unitate<select value={listingForm.unitMeasure} onChange={(event) => setListingForm({ ...listingForm, unitMeasure: event.target.value })}><option value="kg">kg</option><option value="tona">tona</option><option value="lada">lada</option></select></label></div><label>Termeni de livrare<input value={listingForm.deliveryTerms} onChange={(event) => setListingForm({ ...listingForm, deliveryTerms: event.target.value })} placeholder="Ex: Livrare in 24h" /></label>{listingError && <p className="auth-feedback error">{listingError}</p>}<button className="primary-action" type="submit" disabled={isListingSubmitting}>{isListingSubmitting ? 'Se salveaza...' : 'Publica anuntul'}</button></form></section></div>}
    </section>
  );
}

export default function App() {
  const apiUrl = 'http://localhost:4000/api/auth';
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('Toate regiunile');
  const [sort, setSort] = useState('recent');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '', role: 'distributor', phone: '', region: '' });
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

  const loadCatalog = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/listings');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Nu am putut încărca catalogul.');
      setCatalogListings((data.listings as Array<Record<string, unknown>>).map((item, index) => ({
        id: String(item.id),
        product: String(item.productName),
        variety: String(item.variety),
        region: String(item.region),
        quantity: Number(item.quantityKg),
        price: Number(item.pricePerKg),
        harvest: item.harvestDate ? String(item.harvestDate) : 'recolta recenta',
        seller: String(item.sellerName ?? 'Producator verificat'),
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
    const token = localStorage.getItem('agrohub_token');
    if (!token) return;

    fetch('http://localhost:4000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ?? 'Sesiune expirată.');
        setAuthUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('agrohub_token');
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

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthMessage('');
    setAuthError('');
    setIsLoginOpen(true);
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMessage('');
    setAuthError('');
    setIsSubmitting(true);

    const endpoint = authMode === 'login' ? 'login' : 'register';
    const body = authMode === 'login'
      ? { email: authForm.email, password: authForm.password }
      : authForm;

    try {
      const response = await fetch(`${apiUrl}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? 'A apărut o eroare.');
      }

      if (authMode === 'login') {
        localStorage.setItem('agrohub_token', data.token);
        setAuthUser(data.user);
        setIsLoginOpen(false);
      } else {
        setAuthMessage('Cont creat. Așteaptă aprobarea administratorului înainte de autentificare.');
        setAuthMode('login');
        setAuthForm((current) => ({ ...current, password: '' }));
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Nu am putut contacta serverul.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAdminPanel = async () => {
    const token = localStorage.getItem('agrohub_token');
    setAdminError('');
    setIsAdminOpen(true);

    try {
      const [usersResponse, listingsResponse] = await Promise.all([
        fetch('http://localhost:4000/api/admin/users?status=pending', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:4000/api/admin/listings?status=pending', { headers: { Authorization: `Bearer ${token}` } }),
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
    const token = localStorage.getItem('agrohub_token');

    try {
      const response = await fetch(`http://localhost:4000/api/admin/listings/${listingId}/status`, {
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

  const updateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    const token = localStorage.getItem('agrohub_token');

    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${userId}/status`, {
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

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark">A</span><span>agro<span>hub</span></span></a>
        <nav className="main-nav" aria-label="Navigare principala"><a className="active" href="#catalog">Catalog</a><a href="#how-it-works">Cum functioneaza</a></nav>
        <div className="top-actions">
          {authUser && <><button className="cabinet-button" onClick={() => setActiveView('dashboard')}>Cabinetul meu</button><span className="welcome-message">Salut, {authUser.fullName}</span></>}
          {authUser?.role === 'admin' && <button className="admin-button" onClick={openAdminPanel}>Panou admin</button>}
          <button className="login-button" onClick={() => openAuth('login')}>{authUser ? authUser.fullName : 'Intra in cont'} <span aria-hidden="true">-&gt;</span></button>
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
            <div className="produce-image" style={{ backgroundColor: listing.accent }}><span>{listing.product.slice(0, 1)}</span><small>VERIFICAT</small></div>
            <div className="listing-content"><div className="listing-title-row"><div><p className="listing-region">{listing.region} / {listing.harvest}</p><h3>{listing.product}</h3><p className="variety">{listing.variety}</p></div><button className="bookmark" aria-label={`Salveaza oferta ${listing.product}`}>+</button></div>
              <div className="listing-meta"><div><span>Disponibil</span><strong>{listing.quantity.toLocaleString('ro-RO')} kg</strong></div><div><span>Pret en-gros</span><strong>{listing.price.toFixed(2).replace('.', ',')} lei/kg</strong></div></div>
              <div className="listing-footer"><span className="seller"><span className="seller-dot" /> {listing.seller}</span><button className="details-button">Vezi oferta <span aria-hidden="true">-&gt;</span></button></div>
            </div>
          </article>
        ))}
      </section>
      {filteredListings.length === 0 && <div className="empty-state">Nu am gasit oferte pentru filtrele alese.</div>}

      <footer id="how-it-works"><span>agrohub / marketplace agricol B2B</span><span>Oferte verificate. Decizii mai rapide.</span></footer>
      </>}

      {isLoginOpen && <div className="modal-backdrop" onClick={() => setIsLoginOpen(false)}><section className="login-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={() => setIsLoginOpen(false)} aria-label="Inchide">x</button>
        <div className="auth-tabs"><button className={authMode === 'login' ? 'selected' : ''} onClick={() => openAuth('login')}>Autentificare</button><button className={authMode === 'register' ? 'selected' : ''} onClick={() => openAuth('register')}>Cont nou</button></div>
        <p className="kicker">Acces platforma</p>
        <h2>{authMode === 'login' ? 'Bine ai revenit.' : 'Creeaza-ti contul.'}</h2>
        <p>{authMode === 'login' ? 'Intra in cont pentru a continua.' : 'Alege rolul potrivit pentru activitatea ta.'}</p>
        <form onSubmit={handleAuthSubmit}>
          {authMode === 'register' && <label>Nume complet<input required value={authForm.fullName} onChange={(event) => setAuthForm({ ...authForm, fullName: event.target.value })} placeholder="Nume si prenume" /></label>}
          <label>Email<input required type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="nume@companie.ro" /></label>
          <label>Parola<input required minLength={6} type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="Minimum 6 caractere" /></label>
          {authMode === 'register' && <>
            <label>Tip cont<select value={authForm.role} onChange={(event) => setAuthForm({ ...authForm, role: event.target.value })}><option value="distributor">Distribuitor</option><option value="seller">Vanzator</option></select></label>
            <label>Telefon<input value={authForm.phone} onChange={(event) => setAuthForm({ ...authForm, phone: event.target.value })} placeholder="07xx xxx xxx" /></label>
            <label>Regiune<input value={authForm.region} onChange={(event) => setAuthForm({ ...authForm, region: event.target.value })} placeholder="Judet / regiune" /></label>
          </>}
          {authError && <p className="auth-feedback error">{authError}</p>}
          {authMessage && <p className="auth-feedback success">{authMessage}</p>}
          <button className="primary-action" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Se proceseaza...' : authMode === 'login' ? 'Intra in cont' : 'Creeaza cont'}</button>
        </form>
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
        {pendingListings.length === 0 ? <p className="empty-admin">Nu există anunțuri în așteptare.</p> : <div className="pending-list">{pendingListings.map((listing) => <article className="pending-user" key={listing.id}><div><strong>{listing.productName} / {listing.variety}</strong><span>{listing.quantityKg.toLocaleString('ro-RO')} kg la {listing.pricePerKg.toFixed(2)} lei/kg</span><small>{listing.sellerName} / {listing.region}</small></div><div className="pending-actions"><button className="approve-button" onClick={() => updateListingStatus(listing.id, 'active')}>Aprobă</button><button className="reject-button" onClick={() => updateListingStatus(listing.id, 'archived')}>Respinge</button></div></article>)}</div>}
      </section></div>}
    </main>
  );
}
