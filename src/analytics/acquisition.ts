export interface Acquisition { landing_path: string; acquisition_source: 'organic_search' | 'ai_referral' | 'referral' | 'direct' | 'campaign'; referrer_host: string; }
const KEY = 'homa_acquisition_v1';
export function sanitizeLandingPath(path: string) {
  // Store only known public paths; workflow URLs may contain private IDs/tokens.
  if (/^\/(?:s|account|studio|try-on|redesign)(?:\/|$)/.test(path)) return '/' + path.split('/')[1];
  if (/^\/store\/[^/]+(?:\/product\/[^/]+)?$/.test(path)) return path;
  return ['/', '/explore', '/gallery', '/collaboration', '/contact', '/faq', '/terms', '/ai-interior-design', '/virtual-product-preview'].includes(path) ? path : '/other';
}
export function classifyAcquisition(href: string, referrer: string): Acquisition {
  const location = new URL(href); let host = '';
  try { host = new URL(referrer).hostname.toLowerCase(); } catch { /* direct */ }
  let source: Acquisition['acquisition_source'] = 'direct';
  if (location.searchParams.has('utm_source') || ['gclid', 'msclkid', 'fbclid'].some((key) => location.searchParams.has(key))) source = 'campaign';
  else if (/(^|\.)(chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|copilot\.microsoft\.com|gemini\.google\.com)$/.test(host)) source = 'ai_referral';
  else if (/(^|\.)(google\.[a-z.]+|bing\.com|yahoo\.com|duckduckgo\.com|yandex\.[a-z.]+)$/.test(host)) source = 'organic_search';
  else if (host && host !== location.hostname) source = 'referral';
  return { landing_path: sanitizeLandingPath(location.pathname), acquisition_source: source, referrer_host: host === location.hostname ? '' : host };
}
export function getAcquisition(): Acquisition {
  const fallback = classifyAcquisition(window.location.href, document.referrer);
  try {
    const stored = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (stored && typeof stored.landing_path === 'string' && ['organic_search', 'ai_referral', 'referral', 'direct', 'campaign'].includes(stored.acquisition_source)) return { landing_path: sanitizeLandingPath(stored.landing_path), acquisition_source: stored.acquisition_source, referrer_host: typeof stored.referrer_host === 'string' ? stored.referrer_host : '' };
    sessionStorage.setItem(KEY, JSON.stringify(fallback));
  } catch { /* No storage: attribute this page only. */ }
  return fallback;
}
