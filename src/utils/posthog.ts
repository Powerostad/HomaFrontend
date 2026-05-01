/**
 * PostHog Analytics Configuration
 * Initializes PostHog for SPA analytics, session replay, and feature flags.
 *
 * - `capture_pageview: 'history_change'` auto-tracks React Router SPA navigation
 * - `person_profiles: 'identified_only'` saves billing by not creating profiles for anonymous users
 * - `advanced_disable_decide: true` prevents /decide call to CDN (avoids CORS/network blocking)
 * - `disable_external_dependency_loading: true` uses bundled rrweb instead of CDN scripts
 * - Disabled in dev mode by default (toggle via VITE_POSTHOG_DEV_ENABLED=true)
 */

import posthog from 'posthog-js';
import { appConfig } from '@/config/appConfig';

const POSTHOG_KEY = appConfig.publicPosthogKey;
const POSTHOG_HOST = appConfig.publicPosthogHost;

const isDev = import.meta.env.DEV;
const isDevEnabled = appConfig.enablePosthogInDev;
const isConfigured = Boolean(POSTHOG_KEY && POSTHOG_HOST);

// Initialize PostHog unless we're in dev mode without the dev flag
if (isConfigured && (!isDev || isDevEnabled)) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,

    // SPA pageview tracking via browser history API (works with React Router v6)
    capture_pageview: 'history_change',

    // Only create full person profiles for identified (logged-in) users
    person_profiles: 'identified_only',

    // Autocapture clicks, form submits, rage clicks on interactive elements
    autocapture: true,

    // Session recording with privacy defaults (uses bundled rrweb, not CDN)
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-ph-mask]',
    },

    // ── Non-blocking network settings ──────────────────────────────
    // Skip /decide endpoint call — prevents config.js and /config fetch from
    // PostHog CDN (eu-assets.i.posthog.com) which gets CORS-blocked in some
    // regions and stalls the browser connection pool, slowing real API requests.
    // Trade-off: feature flags and A/B tests won't auto-load (use bootstrap if needed).
    advanced_disable_decide: true,

    // Use the rrweb bundled in the posthog-js npm package instead of loading
    // external scripts from PostHog CDN. Eliminates additional blocked requests.
    disable_external_dependency_loading: true,

    // Disable debug logging in production
    loaded: (ph) => {
      if (isDev) {
        ph.debug();
      }
    },
  });
}

// Register homa_session_id as a super property on every PostHog event
try {
  const STORAGE_KEY = 'homa_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  posthog.register({ homa_session_id: sessionId });
} catch {
  // PostHog unreachable or localStorage unavailable — fail silently
}

export { posthog };
