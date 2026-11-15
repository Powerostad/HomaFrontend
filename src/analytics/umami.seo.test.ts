// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';

vi.mock('../config/appConfig', () => ({ appConfig: { umamiSrc: 'https://analytics.example.test/script.js', umamiWebsiteId: 'synthetic-site', enableUmamiInDev: true } }));

it('queues one initial pageview, preserves event names and redacts shared/query URLs', async () => {
  history.replaceState({}, '', '/s/secret-token?email=private');
  const records: Array<{ event?: string; data?: Record<string, unknown> }> = [];
  window.umami = { track: (event, data) => {
    if (typeof event === 'function') records.push({ data: event({ url: location.href, referrer: 'https://google.com/?q=private' }) });
    else records.push({ event: typeof event === 'string' ? event : undefined, data });
  } };
  const { umamiTrack } = await import('../utils/umami');
  const script = document.querySelector('script[data-website-id="synthetic-site"]')!;
  expect(script.getAttribute('data-auto-track')).toBe('false');
  umamiTrack('product_viewed', { product_id: 'public-product' });
  expect(records).toHaveLength(0);
  script.dispatchEvent(new Event('load'));
  expect(records).toHaveLength(2);
  expect(records[0].data?.url).toBe('/s');
  expect(records[1].event).toBe('product_viewed');
  expect(records[1].data?.landing_path).toBe('/s');
  history.replaceState({}, '', '/s/secret-token?different=private');
  expect(records).toHaveLength(2);
  history.pushState({}, '', '/gallery');
  expect(records).toHaveLength(3);
  expect(window.homaAnalyticsBeforeSend?.('event', { url: '/s/private?email=private', referrer: 'https://google.com/?q=private' })).toEqual({ url: '/s', referrer: 'https://google.com' });
});

it('attributes and deduplicates Studio milestones without sending private identifiers', async () => {
  history.replaceState({}, '', '/');
  const { trackHomepageOrganicLanding, trackHomepageStudioClick, trackStudioFunnelMilestone } = await import('./studioFunnel');
  const payloads: Record<string, unknown>[] = [];
  window.umami = { track: event => {
    if (typeof event === 'function') payloads.push(event({
      url: location.href,
      id: 'private-account-id',
      title: 'Private conversation title',
      referrer: 'https://google.com/?q=private',
    }));
  } };
  document.querySelector('script[data-website-id="synthetic-site"]')?.dispatchEvent(new Event('load'));
  payloads.length = 0;
  Object.defineProperty(document, 'referrer', { configurable: true, value: 'https://www.google.com/?q=private' });
  trackHomepageOrganicLanding();
  trackHomepageOrganicLanding();
  trackHomepageStudioClick();
  history.replaceState({}, '', '/studio/chat/private-conversation?token=private');
  for (const name of ['studio_upload_confirmed', 'studio_processing_started'] as const) {
    trackStudioFunnelMilestone(name, 'private-conversation');
    trackStudioFunnelMilestone(name, 'private-conversation');
  }
  expect(payloads.map(({ name, data, url }) => ({ name, data, url }))).toEqual([
    { name: 'organic_landing', data: { source: 'organic_search' }, url: '/' },
    { name: 'studio_cta_click', data: { source: 'organic_search' }, url: '/' },
    { name: 'studio_upload_confirmed', data: { source: 'organic_search' }, url: '/studio/chat' },
    { name: 'studio_processing_started', data: { source: 'organic_search' }, url: '/studio/chat' },
  ]);
  expect(JSON.stringify(payloads)).not.toMatch(/private/i);
});
