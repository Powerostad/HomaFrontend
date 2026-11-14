import { umamiTrackAggregate } from '@/utils/umami';

const sourceKey = 'homa-home-studio-source';
const initialPath = typeof window === 'undefined' ? null : window.location.pathname;
let organicLandingTracked = false;

function homepageSource() {
  let referrer: URL | null = null;
  try { referrer = new URL(document.referrer); } catch { /* no search attribution */ }
  const query = new URLSearchParams(location.search);
  const paid = query.has('gclid') || query.has('msclkid')
    || /^(?:cpc|ppc|paid|paidsearch)$/i.test(query.get('utm_medium') ?? '');
  return !paid && referrer
    && /(^|\.)(google\.(?:com|[a-z]{2}|co\.[a-z]{2})|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/i.test(referrer.hostname)
    ? 'organic_search' : 'other';
}

export function trackHomepageOrganicLanding() {
  if (initialPath !== '/' || organicLandingTracked || homepageSource() !== 'organic_search') return;
  organicLandingTracked = true;
  umamiTrackAggregate('organic_landing', { source: 'organic_search' });
}

export function trackHomepageStudioClick() {
  const source = initialPath === '/' ? homepageSource() : 'other';
  try { sessionStorage.setItem(sourceKey, source); } catch { /* optional attribution */ }
  umamiTrackAggregate('studio_cta_click', { source });
}

export function trackStudioFunnelMilestone(
  name: 'studio_upload_confirmed' | 'studio_processing_started',
  sessionId: string,
) {
  let source: string | null = null;
  // The session ID is used only for local duplicate suppression.
  const key = `homa-funnel:${name}:${sessionId}`;
  try {
    source = sessionStorage.getItem(sourceKey);
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch { /* storage can be disabled */ }
  umamiTrackAggregate(name, { source: source === 'organic_search' ? source : 'other' });
}
