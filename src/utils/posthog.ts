/**
 * PostHog Analytics Configuration
 * Initializes PostHog for SPA analytics, session replay, and feature flags.
 *
 * - `capture_pageview: 'history_change'` auto-tracks React Router SPA navigation
 * - `person_profiles: 'identified_only'` saves billing by not creating profiles for anonymous users
 * - Disabled in dev mode by default (toggle via VITE_POSTHOG_DEV_ENABLED=true)
 */

import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY || 'phc_5ie0tXqbc7I6IFfLeuhZg7FA6fMnyEu1SoaylZktoRp';
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

const isDev = import.meta.env.DEV;
const isDevEnabled = import.meta.env.VITE_ENABLE_POSTHOG_IN_DEV === 'true';

// Initialize PostHog unless we're in dev mode without the dev flag
if (!isDev || isDevEnabled) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,

    // SPA pageview tracking via browser history API (works with React Router v6)
    capture_pageview: 'history_change',

    // Only create full person profiles for identified (logged-in) users
    person_profiles: 'identified_only',

    // Autocapture clicks, form submits, rage clicks on interactive elements
    autocapture: true,

    // Session recording with privacy defaults
    enable_recording_console_log: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-ph-mask]',
    },

    // Disable debug logging in production
    loaded: (ph) => {
      if (isDev) {
        ph.debug();
      }
    },
  });
}

export { posthog };
