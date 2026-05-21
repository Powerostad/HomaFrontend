/**
 * Analytics — thin wrapper around Umami.
 *
 * The previous in-memory AnalyticsService and KPI calculations have been
 * removed. All analytics are now handled by Umami (best-effort).
 */

import { umamiTrack } from './umami';

export function trackEvent(event: string, metadata?: Record<string, unknown>) {
  umamiTrack(event, metadata);
}
