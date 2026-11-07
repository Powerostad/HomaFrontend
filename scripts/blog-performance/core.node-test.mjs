import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateReport, dayBounds, renderReport, TIMEZONE } from './core.mjs';
import { collectSearch, collectUmami } from './collect.mjs';

const snapshot = () => ({ start: '2026-11-01', end: '2026-11-02', timezone: TIMEZONE,
  gsc: { rows: [{ keys: ['2026-11-01', 'https://myhoma.ir/blog/test/', 'MOBILE'], clicks: 10, impressions: 100 }],
    queries: [{ keys: ['2026-11-01', 'https://myhoma.ir/blog/test', 'MOBILE', '<script>private query</script>'], clicks: 3, impressions: 20 }] },
  umami: { rows: [
    { date: '2026-11-01', article_path: '/blog/test', device: 'mobile', event: 'article_view', count: 9 },
    { date: '2026-11-01', article_path: '/blog/test', device: 'mobile', event: 'studio_cta_click', count: 4 },
    { date: '2026-11-02', article_path: '/blog/test', device: 'mobile', event: 'studio_processing_started', count: 1 },
  ] } });
test('joins article/date/device, keeps query data separate and does not duplicate page totals', () => {
  const report = aggregateReport(snapshot());
  assert.equal(report.rows.length, 2);
  assert.equal(report.rows[0].google_clicks, 10);
  assert.equal(report.rows[0].studio_cta_click, 4);
  assert.equal(report.rows[0].studio_processing_started, 0);
  assert.equal(report.rows[1].studio_processing_started, 1);
  assert.equal(report.rows[1].starts_per_cta, null);
  assert.equal(report.queries[0].clicks, 3);
  assert.ok(!JSON.stringify(report.rows).includes('query'));
  assert.ok(!renderReport(report).includes('<script>private'));
});
test('missing source is never represented as zero; incompatible timezone fails', () => {
  const data = snapshot(); data.gsc = null;
  assert.equal(aggregateReport(data).rows[0].google_clicks, null);
  data.timezone = 'Asia/Tehran';
  assert.throws(() => aggregateReport(data), /Pacific/);
});
test('Pacific day boundaries account for DST rather than fixed 24-hour days', () => {
  const fall = dayBounds('2026-11-01');
  const spring = dayBounds('2026-03-08');
  assert.equal(fall.endAt - fall.startAt + 1, 25 * 3600000);
  assert.equal(spring.endAt - spring.startAt + 1, 23 * 3600000);
});
test('GSC reads page totals and queries separately, with read tokens outside output', async () => {
  const requests = [];
  const result = await collectSearch({ start: '2026-11-01', end: '2026-11-01', property: 'sc-domain:myhoma.ir', token: 'private',
    fetcher: async (url, init) => { requests.push({ url, ...JSON.parse(init.body) }); return { ok: true, json: async () => ({ rows: [] }) }; } });
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0].dimensions, ['date', 'page', 'device']);
  assert.deepEqual(requests[1].dimensions, ['date', 'page', 'device', 'query']);
  assert.ok(!JSON.stringify(result).includes('private'));
});
test('Umami discovers non-Google articles, retains device and discards raw personal identifiers', async () => {
  const urls = [];
  const result = await collectUmami({ start: '2026-11-01', end: '2026-11-01', baseUrl: 'https://analytics.example', websiteId: 'site', token: 'secret',
    fetcher: async url => {
      urls.push(String(url));
      return { ok: true, json: async () => String(url).includes('/events?')
        ? { count: 1, data: [{ id: 'event-1', createdAt: '2026-11-01T12:00:00Z', device: 'mobile', eventName: 'article_view', urlPath: '/blog/test', sessionId: 'private-id' }] }
        : [{ x: 'article_view', y: 7 }, { x: 'studio_cta_click', y: 1 }] };
    } });
  assert.equal(urls.length, 1);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].device, 'mobile');
  assert.ok(!JSON.stringify(result).includes('private-id'));
  assert.ok(!JSON.stringify(result).includes('secret'));
});
test('Umami paginates and deduplicates overlap, retaining unknown devices separately', async () => {
  const event = { id: 'one', createdAt: '2026-11-01T12:00:00Z', device: null, eventName: 'article_view', urlPath: '/blog/test' };
  const result = await collectUmami({ start: '2026-11-01', end: '2026-11-01', baseUrl: 'https://analytics.example', websiteId: 'site', token: 'secret',
    fetcher: async url => ({ ok: true, json: async () => ({ count: 2, pageSize: 1,
      data: new URL(url).searchParams.get('page') === '1' ? [event] : [event, { ...event, id: 'two' }] }) }) });
  assert.deepEqual(result.rows, [{ date: '2026-11-01', article_path: '/blog/test', device: 'unknown', event: 'article_view', count: 2 }]);
});
test('provider failure or incompatible response fails instead of reporting fabricated zeroes', async () => {
  await assert.rejects(collectUmami({ start: '2026-11-01', end: '2026-11-01', baseUrl: 'https://analytics.example', websiteId: 'site', token: 'secret',
    fetcher: async () => ({ ok: false, status: 401 }) }), /401/);
});
