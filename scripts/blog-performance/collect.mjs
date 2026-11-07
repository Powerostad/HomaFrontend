import { articlePath, dayBounds, dates, EVENTS, TIMEZONE } from './core.mjs';

async function jsonRequest(fetcher, url, init = {}) {
  const response = await fetcher(url, { ...init, signal: AbortSignal.timeout(30000) });
  // Never log tokens or raw provider error bodies.
  if (!response.ok) throw new Error(`Analytics source returned HTTP ${response.status}`);
  return response.json();
}

export async function collectSearch({ start, end, property, token, fetcher = fetch }) {
  if (!property || !token) throw new Error('GSC_PROPERTY and GSC_ACCESS_TOKEN are required');
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`;
  const collect = async (dimensions) => {
    const rows = [];
    for (const day of dates(start, end)) {
      for (let startRow = 0; ; startRow += 25000) {
        const payload = await jsonRequest(fetcher, url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate: day, endDate: day, dimensions, type: 'web', dataState: 'final', rowLimit: 25000, startRow,
            dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: 'https://myhoma.ir/blog/' }] }] }) });
        const page = payload.rows || [];
        rows.push(...page);
        if (page.length < 25000) break;
        if (startRow >= 75000) throw new Error('Search row safety cap reached; narrow date range');
      }
    }
    return rows;
  };
  return { rows: await collect(['date', 'page', 'device']), queries: await collect(['date', 'page', 'device', 'query']) };
}

/** Umami 3.4 events API. Aggregate immediately; never persist sessions or event IDs. */
export async function collectUmami({ start, end, baseUrl, websiteId, token, fetcher = fetch }) {
  if (!baseUrl || !websiteId || !token) throw new Error('UMAMI_API_URL, UMAMI_WEBSITE_ID, UMAMI_ACCESS_TOKEN are required');
  dates(start, end);
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(base.hostname)) throw new Error('Umami reporting requires HTTPS');
  const api = new URL(`/api/websites/${encodeURIComponent(websiteId)}/events`, base);
  const headers = { Authorization: `Bearer ${token}` };
  const range = { startAt: dayBounds(start).startAt, endAt: dayBounds(end).endAt };
  const counts = new Map();
  const seen = new Set();
  const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
  for (let page = 1; ; page++) {
    const url = new URL(api);
    url.search = new URLSearchParams({ ...range, page, pageSize: 100 }).toString();
    const payload = await jsonRequest(fetcher, url, { headers });
    if (!Array.isArray(payload.data) || !Number.isFinite(payload.count)) throw new Error('Unsupported Umami events API response');
    for (const event of payload.data) {
      if (!EVENTS.includes(event.eventName)) continue;
      const path = articlePath(event.urlPath);
      if (!path) continue;
      if (!event.id || !event.createdAt || !('device' in event)) throw new Error('Umami 3.4 event dimensions are required');
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      const timestamp = Date.parse(event.createdAt);
      if (!Number.isFinite(timestamp)) throw new Error('Invalid Umami event date');
      if (timestamp < range.startAt || timestamp > range.endAt) throw new Error('Umami returned an event outside the report range');
      const date = dateFormat.format(timestamp);
      const device = ['desktop', 'mobile', 'tablet'].includes(event.device) ? event.device : 'unknown';
      const key = JSON.stringify([date, path, device, event.eventName]);
      const row = counts.get(key) || { date, article_path: path, device, event: event.eventName, count: 0 };
      row.count++;
      counts.set(key, row);
    }
    if (payload.isCapped) throw new Error('Umami capped this export; narrow date range');
    if (page * (payload.pageSize || 100) >= payload.count) break;
    if (!payload.data.length || page >= 10000) throw new Error('Umami pagination incomplete; narrow date range');
  }
  return { rows: [...counts.values()] };
}

export async function collectSnapshot(start, end, env = process.env, fetcher = fetch) {
  dates(start, end);
  const gsc = await collectSearch({ start, end, property: env.GSC_PROPERTY, token: env.GSC_ACCESS_TOKEN, fetcher });
  const umami = await collectUmami({ start, end, baseUrl: env.UMAMI_API_URL, websiteId: env.UMAMI_WEBSITE_ID, token: env.UMAMI_ACCESS_TOKEN,
    fetcher });
  return { start, end, timezone: TIMEZONE, collected_at: new Date().toISOString(), gsc, umami };
}
