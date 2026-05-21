/**
 * Umami Analytics Configuration
 * Loads the self-hosted Umami tracking script and exposes a typed event API.
 *
 * - Umami auto-tracks SPA pageviews via the History API — no config needed.
 * - The <script> is injected at runtime from window.__APP_CONFIG__ values so
 *   the Umami host / website-id can change per environment without a rebuild.
 * - Disabled in dev mode by default (toggle via VITE_ENABLE_UMAMI_IN_DEV=true).
 * - Umami has no PostHog-style "super properties"; this wrapper injects
 *   `session_id` into every event payload manually.
 */

import { appConfig } from '@/config/appConfig';

// ── Umami window API typing ───────────────────────────────────────────────
type UmamiApi = {
  track: (event?: string | Record<string, unknown>, data?: Record<string, unknown>) => void;
  // `identify` is version-dependent in self-hosted Umami — optional on purpose.
  identify?: (id?: string | Record<string, unknown>, data?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    umami?: UmamiApi;
  }
}

const UMAMI_SRC = appConfig.umamiSrc;
const UMAMI_WEBSITE_ID = appConfig.umamiWebsiteId;

const isDev = import.meta.env.DEV;
const isDevEnabled = appConfig.enableUmamiInDev;
const isConfigured = Boolean(UMAMI_SRC && UMAMI_WEBSITE_ID);

// Track unless we're in dev mode without the dev flag.
const isEnabled = isConfigured && (!isDev || isDevEnabled);

// ── homa_session_id ───────────────────────────────────────────────────────
// Persisted per browser and attached to every event, since Umami has no
// equivalent of PostHog super properties. Same localStorage key as SessionContext.
const SESSION_STORAGE_KEY = 'homa_session_id';

function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(SESSION_STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (private browsing) — fall back gracefully.
    return 'anonymous';
  }
}

// ── Pre-load queue ────────────────────────────────────────────────────────
// The Umami script loads asynchronously; events fired before it is ready
// (e.g. on-mount events) are buffered here and flushed on the load event.
let scriptLoaded = false;
const pendingCalls: Array<() => void> = [];

function runOrQueue(call: () => void) {
  if (scriptLoaded && window.umami) {
    call();
  } else {
    pendingCalls.push(call);
  }
}

function flushQueue() {
  scriptLoaded = true;
  while (pendingCalls.length > 0) {
    const call = pendingCalls.shift();
    try {
      call?.();
    } catch {
      // A single failed event must not block the rest of the queue.
    }
  }
}

// ── Script injection ──────────────────────────────────────────────────────
if (isEnabled) {
  const script = document.createElement('script');
  script.defer = true;
  script.src = UMAMI_SRC;
  script.setAttribute('data-website-id', UMAMI_WEBSITE_ID);
  script.addEventListener('load', flushQueue);
  script.addEventListener('error', () => {
    // Umami unreachable — drop queued events so they don't leak memory.
    pendingCalls.length = 0;
  });
  document.head.appendChild(script);
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Track a custom event. `session_id` is injected into every payload to
 * replace PostHog's super-property behavior. No-op when analytics is disabled.
 */
export function umamiTrack(event: string, data?: Record<string, unknown>) {
  if (!isEnabled) return;
  const payload = { session_id: getSessionId(), ...data };
  runOrQueue(() => window.umami?.track(event, payload));
}

/**
 * Associate the current session with a logged-in user.
 * `identify` is feature-detected since it is version-dependent in self-hosted Umami.
 */
export function umamiIdentify(id: string, data?: Record<string, unknown>) {
  if (!isEnabled) return;
  runOrQueue(() => {
    if (typeof window.umami?.identify === 'function') {
      window.umami.identify(id, data);
    }
  });
}

/**
 * Clear user association on logout. Umami has no real reset, so this is a
 * best-effort call and a safe no-op where unsupported.
 */
export function umamiReset() {
  if (!isEnabled) return;
  runOrQueue(() => {
    if (typeof window.umami?.identify === 'function') {
      window.umami.identify({});
    }
  });
}
