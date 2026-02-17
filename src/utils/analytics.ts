/**
 * Analytics — thin wrapper around PostHog.
 *
 * The previous in-memory AnalyticsService and KPI calculations have been
 * removed.  All analytics are now handled by PostHog (best-effort).
 */

import { posthog } from './posthog';

export function trackEvent(event: string, metadata?: Record<string, unknown>) {
  posthog.capture(event, metadata);
}
