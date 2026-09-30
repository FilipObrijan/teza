import { useEffect, useRef } from 'react';

type GoogleCredentialResponse = { credential: string };
type GoogleAccountsId = {
  initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void; ux_mode?: 'popup' | 'redirect' }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Fără Client ID configurat, butonul nu apare deloc.
export const isGoogleSignInEnabled = Boolean(GOOGLE_CLIENT_ID);

let scriptPromise: Promise<void> | null = null;

// Scriptul oficial Google Identity Services se încarcă o singură dată, doar când e nevoie de buton.
const loadGoogleScript = () => {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Nu am putut încărca logarea cu Google.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

export default function GoogleSignInButton({ onCredential, text }: { onCredential: (credential: string) => void; text: 'signin_with' | 'signup_with' }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        const container = containerRef.current;
        if (cancelled || !container || !window.google) return;
        container.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => callbackRef.current(response.credential),
          ux_mode: 'popup',
        });
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          locale: 'ro',
          // Google acceptă lățimi între 200 și 400 px.
          width: Math.min(400, Math.max(200, container.offsetWidth)),
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!GOOGLE_CLIENT_ID) return null;
  return <div className="google-button" ref={containerRef} />;
}
