import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loginWithGoogle, startGoogleLogin } from '@/services/googleAuthService';
import type { AuthTokens, User } from '@/types/auth';

interface GoogleIdentity {
  initialize(options: {
    client_id: string;
    nonce: string;
    auto_select: boolean;
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(element: HTMLElement, options: {
    theme: string; size: string; text: string; locale: string; width: number;
  }): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

let sdkPromise: Promise<GoogleIdentity> | null = null;

export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => fail(), 15000);
    const fail = () => {
      window.clearTimeout(timeout);
      script.remove();
      sdkPromise = null;
      reject(new Error('google_sdk_unavailable'));
    };
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onerror = fail;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.google?.accounts.id) resolve(window.google.accounts.id);
      else fail();
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

interface GoogleSignInProps {
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onSuccess: (user: User, tokens: AuthTokens) => void;
}

export function GoogleSignIn(props: GoogleSignInProps) {
  const { t, i18n } = useTranslation();
  const container = useRef<HTMLDivElement>(null);
  const currentProps = useRef(props);
  currentProps.current = props;
  const pending = useRef(false);
  const [status, setStatus] = useState<'loading' | 'disabled' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const language = i18n.resolvedLanguage || i18n.language;

  useEffect(() => {
    container.current?.toggleAttribute('inert', props.disabled);
  }, [props.disabled]);

  useEffect(() => {
    let disposed = false;
    setStatus('loading');
    const element = container.current;
    element?.replaceChildren();
    async function initialize() {
      try {
        const challenge = await startGoogleLogin();
        if (disposed) return;
        if (!challenge.enabled) { setStatus('disabled'); return; }
        if (!challenge.client_id || !challenge.nonce) throw new Error('google_unavailable');
        const identity = await loadGoogleIdentity();
        if (disposed || !element) return;
        identity.initialize({
          client_id: challenge.client_id,
          nonce: challenge.nonce,
          auto_select: false,
          callback: async ({ credential }) => {
            if (disposed || currentProps.current.disabled || pending.current) return;
            pending.current = true;
            currentProps.current.onBusyChange(true);
            try {
              const result = await loginWithGoogle(credential);
              if (disposed) return;
              if (result.success && result.user && result.tokens) {
                currentProps.current.onSuccess(result.user, result.tokens);
              } else {
                setStatus('error');
              }
            } catch {
              if (!disposed) setStatus('error');
            } finally {
              pending.current = false;
              currentProps.current.onBusyChange(false);
            }
          },
        });
        identity.renderButton(element, {
          theme: 'outline', size: 'large', text: 'continue_with',
          locale: language.split('-')[0], width: Math.min(element.clientWidth || 280, 400),
        });
        setStatus('ready');
      } catch {
        if (!disposed) setStatus('error');
      }
    }
    void initialize();
    return () => { disposed = true; element?.replaceChildren(); };
  }, [language, retry]);

  return (
    <div className={status === 'disabled' ? 'hidden' : 'space-y-3'}>
      {status !== 'disabled' && (
        <div className="flex items-center gap-3 text-content-secondary text-xs">
          <span className="h-px flex-1 bg-border-subtle" />
          <span>{t('auth.googleOr')}</span>
          <span className="h-px flex-1 bg-border-subtle" />
        </div>
      )}
      <div
        ref={container}
        className={`${status === 'ready' ? 'flex' : 'hidden'} min-h-11 justify-center ${props.disabled ? 'pointer-events-none opacity-50' : ''}`}
      />
      {status === 'loading' && <p role="status" className="text-center text-sm text-content-secondary">{t('auth.googleLoading')}</p>}
      {status === 'error' && (
        <div className="space-y-2 text-center text-sm">
          <p role="alert" className="text-destructive">{t('auth.googleError')}</p>
          <button type="button" disabled={props.disabled} onClick={() => setRetry(value => value + 1)}
            className="rounded-md px-4 py-2 text-content-primary underline focus-visible:outline focus-visible:outline-2 disabled:opacity-50">
            {t('auth.googleRetry')}
          </button>
        </div>
      )}
    </div>
  );
}
