/**
 * Umami Analytics Configuration
 * Loads the self-hosted Umami tracking script and exposes a typed event API.
 *
 * - Umami auto-tracks SPA pageviews via the History API — no config needed.
 * - The <script> is injected at runtime from window.__APP_CONFIG__ values so
 *   the Umami host / website-id can change per environment without a rebuild.
 * - Disabled in dev mode by default (toggle via VITE_ENABLE_UMAMI_IN_DEV=true).
 * - Umami associates aggregate events with its own anonymous session.
 */

import { appConfig } from '@/config/appConfig';

// ── Umami window API typing ───────────────────────────────────────────────
type UmamiApi = {
  track: (
    event?: string | Record<string, unknown> | ((payload: Record<string, unknown>) => Record<string, unknown>),
    data?: Record<string, unknown>,
  ) => void;
};

declare global {
  interface Window {
    umami?: UmamiApi;
    homaAnalyticsBeforeSend?: (type: string, payload: Record<string, unknown>) => Record<string, unknown>;
  }
}

const UMAMI_SRC = appConfig.umamiSrc;
const UMAMI_WEBSITE_ID = appConfig.umamiWebsiteId;

const isDev = import.meta.env.DEV;
const isDevEnabled = appConfig.enableUmamiInDev;
const isConfigured = Boolean(UMAMI_SRC && UMAMI_WEBSITE_ID);

// Track unless we're in dev mode without the dev flag.
const isEnabled = isConfigured && (!isDev || isDevEnabled);

function sanitizeAnalyticsUrl(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    const parsed = new URL(value, window.location.origin);
    const pathname = parsed.origin === window.location.origin
      ? parsed.pathname
      : parsed.origin;
    // Shared-page URLs contain a token after /s/. Keep the route useful for
    // aggregate analytics while dropping the token and all query fragments.
    return pathname
      .replace(/^\/s\/[^/]+(?:\/.*)?$/, '/s')
      .replace(/^(\/studio\/(?:chat|result|project)|\/redesign)\/[^/]+.*$/, '$1');
  } catch {
    return value.split(/[?#]/, 1)[0] || '/';
  }
}

function sanitizeAnalyticsPayload(_type: string, payload: Record<string, unknown>) {
  const { id: _identifiedUser, ...anonymousPayload } = payload;
  return {
    ...anonymousPayload,
    ...(payload.url !== undefined ? { url: sanitizeAnalyticsUrl(payload.url) } : {}),
    ...(payload.referrer !== undefined ? { referrer: sanitizeAnalyticsUrl(payload.referrer) } : {}),
  };
}

function trackPageView() {
  runOrQueue(() => window.umami?.track((payload) => sanitizeAnalyticsPayload('pageview', payload)));
}

if (typeof window !== 'undefined') {
  window.homaAnalyticsBeforeSend = sanitizeAnalyticsPayload;
}

// ── Pre-load queue ────────────────────────────────────────────────────────
// The Umami script loads asynchronously; events fired before it is ready
// (e.g. on-mount events) are buffered here and flushed on the load event.
let scriptLoaded = false;
let scriptFailed = false;
const pendingCalls: Array<() => void> = [];

function runOrQueue(call: () => void) {
  if (scriptFailed) return;
  if (scriptLoaded && window.umami) {
    try { call(); } catch { /* analytics must not interrupt the current action */ }
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
  script.setAttribute('data-auto-track', 'false');
  script.setAttribute('data-website-id', UMAMI_WEBSITE_ID);
  script.addEventListener('load', flushQueue);
  script.addEventListener('error', () => {
    // Umami unreachable — drop queued events so they don't leak memory.
    pendingCalls.length = 0;
    scriptFailed = true;
  });
  document.head.appendChild(script);
  // Disable Umami's automatic pageview and queue one sanitized pageview so
  // shared URLs never send tokens or query parameters to analytics.
  trackPageView();
  const originalPushState = history.pushState.bind(history);
  history.pushState = ((...args: Parameters<History['pushState']>) => {
    const result = originalPushState(...args);
    trackPageView();
    return result;
  }) as History['pushState'];
}

// ── Public API ────────────────────────────────────────────────────────────

const privateEventKeys = new Set([
  'session_id', 'task_id', 'result_image_id', 'image_id', 'item_id', 'token', 'error_message', 'fileName',
]);

/** Track a custom event with a redacted landing path and event fields. */
export function umamiTrack(event: string, data?: Record<string, unknown>) {
  if (!isEnabled) return;
  const payload = {
    landing_path: sanitizeAnalyticsUrl(window.location.href),
    ...Object.fromEntries(Object.entries(data ?? {}).filter(([key]) => !privateEventKeys.has(key))),
  };
  runOrQueue(() => window.umami?.track(event, payload));
}

/** Funnel events contain only categorical data and sanitized paths. */
export function umamiTrackAggregate(event: string, data: Record<string, string>) {
  if (!isEnabled) return;
  const url = sanitizeAnalyticsUrl(window.location.href);
  runOrQueue(() => window.umami?.track(payload => ({
    ...sanitizeAnalyticsPayload('event', payload),
    url,
    title: url === '/' ? 'Homa homepage' : 'Homa Studio',
    name: event,
    data,
  })));
}
