import { FormEvent, useEffect, useState } from 'react';
import { API_BASE, authHeaders } from './shared';

type Settings = {
  autoApproveUsers: boolean;
  autoApproveListings: boolean;
  aiCheckListings: boolean;
  minApprovedListings: number;
  minRating: number;
  minReviews: number;
  priceRatioMin: number;
  priceRatioMax: number;
  maxQuantityKg: number;
  maxListingsPerHour: number;
  bannedWords: string[];
  digestThreshold: number;
  digestHour: number;
};

type ModerationEvent = {
  id: string;
  subjectType: 'user' | 'listing';
  subjectId: string;
  outcome: 'auto_approved' | 'pending';
  reasons: string[];
  aiChecked: boolean;
  edited: boolean;
  createdAt: string;
  title: string | null;
  detail: string | null;
  role: string | null;
  currentStatus: string | null;
};

const request = async (path: string, init: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...authHeaders(), ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? 'A apărut o eroare.');
  return body;
};

const statusLabels: Record<string, string> = {
  approved: 'activ',
  pending: 'în așteptare',
  rejected: 'respins',
  blocked: 'blocat',
  active: 'publicat',
  paused: 'pus pe pauză',
  archived: 'ascuns',
};

const formatTime = (value: string) => new Date(value).toLocaleString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function Toggle({ label, hint, checked, disabled, onChange }: { label: string; hint: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={`automation-toggle${disabled ? ' disabled' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="toggle-track" aria-hidden="true" />
      <span><strong>{label}</strong><small>{hint}</small></span>
    </label>
  );
}

function NumberField({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max?: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="automation-number">{label}
      <input type="number" required min={min} max={max} step={step} value={Number.isNaN(value) ? '' : value} onChange={(event) => onChange(event.target.valueAsNumber)} />
    </label>
  );
}

function AutomationSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [bannedWords, setBannedWords] = useState('');
  const [aiConfigured, setAIConfigured] = useState(false);
  const [aiProvider, setAIProvider] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [aiTest, setAITest] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTestingAI, setIsTestingAI] = useState(false);

  const apply = (body: { settings: Settings; aiConfigured: boolean; aiProvider: string | null }) => {
    setSettings(body.settings);
    setBannedWords(body.settings.bannedWords.join(', '));
    setAIConfigured(body.aiConfigured);
    setAIProvider(body.aiProvider);
  };

  useEffect(() => {
    request('/api/admin/moderation/settings').then(apply).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Eroare la încărcarea setărilor.'));
  }, []);

  if (!settings) return error ? <p className="auth-feedback error">{error}</p> : <p className="empty-admin">Se încarcă setările...</p>;

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings({ ...settings, [key]: value });

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');
    try {
      const words = bannedWords.split(',').map((word) => word.trim()).filter(Boolean);
      apply(await request('/api/admin/moderation/settings', { method: 'PUT', body: JSON.stringify({ ...settings, bannedWords: words }) }));
      setMessage('Setările au fost salvate.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Eroare la salvarea setărilor.');
    } finally {
      setIsSaving(false);
    }
  };

  const runAITest = async () => {
    setIsTestingAI(true);
    setAITest(null);
    try {
      const body = await fetch(`${API_BASE}/api/admin/moderation/test-ai`, { method: 'POST', headers: authHeaders() }).then((response) => response.json());
      setAITest({ ok: Boolean(body.ok), message: body.message ?? 'Răspuns neașteptat de la server.' });
    } catch {
      setAITest({ ok: false, message: 'Nu am putut contacta serverul.' });
    } finally {
      setIsTestingAI(false);
    }
  };

  const sendDigest = async () => {
    setMessage('');
    setError('');
    try {
      setMessage((await request('/api/admin/moderation/digest', { method: 'POST' })).message);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Eroare la trimiterea rezumatului.');
    }
  };

  return (
    <form className="automation-form" onSubmit={save}>
      <fieldset>
        <legend>Conturi noi</legend>
        <Toggle label="Aprobă automat conturile" hint="Contul devine activ imediat după ce emailul e verificat (cu cod sau prin Google)." checked={settings.autoApproveUsers} onChange={(value) => update('autoApproveUsers', value)} />
      </fieldset>

      <fieldset>
        <legend>Anunțuri noi</legend>
        <Toggle label="Publică automat anunțurile care trec verificările" hint="Celelalte rămân în coadă, cu motivul afișat." checked={settings.autoApproveListings} onChange={(value) => update('autoApproveListings', value)} />
        <div className="automation-grid">
          <NumberField label="Anunțuri aprobate necesare (vânzător de încredere)" min={0} max={100} value={settings.minApprovedListings} onChange={(value) => update('minApprovedListings', value)} />
          <NumberField label="…sau notă medie minimă" min={1} max={5} step={0.1} value={settings.minRating} onChange={(value) => update('minRating', value)} />
          <NumberField label="…din cel puțin atâtea recenzii" min={1} max={100} value={settings.minReviews} onChange={(value) => update('minReviews', value)} />
          <NumberField label="Preț minim față de mediană (×)" min={0} max={1} step={0.05} value={settings.priceRatioMin} onChange={(value) => update('priceRatioMin', value)} />
          <NumberField label="Preț maxim față de mediană (×)" min={1} max={100} step={0.5} value={settings.priceRatioMax} onChange={(value) => update('priceRatioMax', value)} />
          <NumberField label="Cantitate maximă (kg)" min={1} value={settings.maxQuantityKg} onChange={(value) => update('maxQuantityKg', value)} />
          <NumberField label="Anunțuri maxime pe oră de la un vânzător" min={1} max={1000} value={settings.maxListingsPerHour} onChange={(value) => update('maxListingsPerHour', value)} />
        </div>
        <label className="automation-number">Cuvinte interzise <span className="optional-label">(separate prin virgulă)</span>
          <textarea value={bannedWords} onChange={(event) => setBannedWords(event.target.value)} />
        </label>
        <Toggle
          label={`Verificare cu AI${aiProvider ? ` (${aiProvider})` : ''}`}
          hint={aiConfigured
            ? `Textul și fotografia sunt verificate de AI după ce trec regulile de mai sus.${aiProvider === 'Gemini' ? ' Folosește nivelul gratuit Gemini.' : ''}`
            : 'Inactivă: adaugă variabila GEMINI_API_KEY pe Render (cheie gratuită de la aistudio.google.com) ca s-o pornești.'}
          checked={settings.aiCheckListings && aiConfigured}
          disabled={!aiConfigured}
          onChange={(value) => update('aiCheckListings', value)}
        />
        {aiConfigured && <div className="ai-test">
          <button type="button" className="cancel-action" disabled={isTestingAI} onClick={() => void runAITest()}>{isTestingAI ? 'Se testează...' : 'Testează AI'}</button>
          {aiTest && <p className={`auth-feedback ${aiTest.ok ? 'success' : 'error'}`}>{aiTest.message}</p>}
        </div>}
      </fieldset>

      <fieldset>
        <legend>Emailuri către admin</legend>
        <p className="automation-note">Primești câte un email pentru fiecare cont sau anunț nou. Dacă într-o zi sunt mai multe decât pragul, emailurile individuale se opresc și primești un singur rezumat la ora aleasă.</p>
        <div className="automation-grid">
          <NumberField label="Prag zilnic de emailuri individuale" min={0} max={10000} value={settings.digestThreshold} onChange={(value) => update('digestThreshold', value)} />
          <NumberField label="Ora rezumatului (0–23)" min={0} max={23} value={settings.digestHour} onChange={(value) => update('digestHour', value)} />
        </div>
      </fieldset>

      {error && <p className="auth-feedback error">{error}</p>}
      {message && <p className="auth-feedback success">{message}</p>}
      <div className="automation-actions">
        <button className="approve-button" type="submit" disabled={isSaving}>{isSaving ? 'Se salvează...' : 'Salvează setările'}</button>
        <button className="cancel-action" type="button" onClick={() => void sendDigest()}>Trimite-mi rezumatul de azi</button>
      </div>
    </form>
  );
}

function AutomationActivity() {
  const [events, setEvents] = useState<ModerationEvent[] | null>(null);
  const [error, setError] = useState('');

  const load = () => request('/api/admin/moderation/events')
    .then((body) => setEvents(body.events))
    .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Eroare la încărcarea activității.'));

  useEffect(() => {
    void load();
  }, []);

  const setStatus = async (event: ModerationEvent, status: string) => {
    setError('');
    try {
      const path = event.subjectType === 'user' ? `/api/admin/users/${event.subjectId}/status` : `/api/admin/listings/${event.subjectId}/status`;
      await request(path, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Eroare la actualizare.');
    }
  };

  if (!events) return error ? <p className="auth-feedback error">{error}</p> : <p className="empty-admin">Se încarcă activitatea...</p>;

  return (
    <>
      {error && <p className="auth-feedback error">{error}</p>}
      {events.length === 0 ? <p className="empty-admin">Încă nu există decizii automate.</p> : <div className="pending-list">
        {events.map((event) => (
          <article className="pending-user automation-event" key={event.id}>
            <div>
              <span className={`automation-badge ${event.outcome}`}>{event.outcome === 'auto_approved' ? 'Aprobat automat' : 'Trimis la verificare'}</span>
              <strong>{event.subjectType === 'user' ? 'Cont' : 'Anunț'}{event.edited ? ' modificat' : ''}: {event.title ?? '(șters)'}</strong>
              <span>{event.detail ?? ''}{event.currentStatus ? ` · acum: ${statusLabels[event.currentStatus] ?? event.currentStatus}` : ''} · {formatTime(event.createdAt)}{event.aiChecked ? ' · verificat cu AI' : ''}</span>
              {event.reasons.length > 0 && <small>{event.reasons.join(' ')}</small>}
            </div>
            <div className="pending-actions">
              {event.subjectType === 'user' && event.currentStatus === 'approved' && <button className="reject-button" onClick={() => void setStatus(event, 'blocked')}>Blochează</button>}
              {event.subjectType === 'user' && event.currentStatus === 'blocked' && <button className="approve-button" onClick={() => void setStatus(event, 'approved')}>Deblochează</button>}
              {event.subjectType === 'listing' && event.currentStatus === 'active' && <button className="reject-button" onClick={() => void setStatus(event, 'archived')}>Ascunde anunțul</button>}
            </div>
          </article>
        ))}
      </div>}
    </>
  );
}

export function AdminAutomation() {
  return (
    <>
      <p className="admin-section-label">Reguli</p>
      <AutomationSettings />
      <p className="admin-section-label">Activitate recentă</p>
      <AutomationActivity />
    </>
  );
}
