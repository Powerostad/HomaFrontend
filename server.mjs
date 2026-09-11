import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const mime = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain', '.html': 'text/html' };

export function createResponseCache(maxEntries = 500, ttl = 60000, now = Date.now) {
  const cache = new Map(); const pending = new Map();
  return async (key, load) => {
    const found = cache.get(key);
    if (found && found.expires > now()) { cache.delete(key); cache.set(key, found); return found.value; }
    cache.delete(key);
    if (pending.has(key)) return pending.get(key);
    if (pending.size >= maxEntries) throw new Error('Renderer capacity exceeded');
    const promise = (async () => {
      const value = await load();
      if (value.status === 200 && value.data?.kind !== 'private') {
        if (cache.size >= maxEntries) cache.delete(cache.keys().next().value);
        cache.set(key, { value, expires: now() + ttl });
      }
      return value;
    })();
    pending.set(key, promise);
    try { return await promise; } finally { pending.delete(key); }
  };
}

export async function startServer({ port = Number(process.env.PORT || 8081), host = process.env.HOST || '127.0.0.1', dev = false } = {}) {
  const origin = new URL(process.env.SITE_URL || 'https://myhoma.ir').origin;
  const apiBase = process.env.VITE_API_BASE_URL || 'https://api.myhoma.ir';
  const indexable = process.env.SEO_INDEXABLE === 'true' && origin === 'https://myhoma.ir';
  const candidateSupport = process.env.SUPPORT_URL || 'https://www.instagram.com/myhoma.ir/';
  const supportUrl = /^(https?:\/\/|mailto:|tel:)/i.test(candidateSupport) && !/[\r\n]/.test(candidateSupport) ? candidateSupport : undefined;
  const clientDir = process.env.CLIENT_DIR || resolve(root, 'dist/client');

  let vite = null;
  if (dev) {
    const viteMod = await import('vite');
    vite = await viteMod.createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
    console.log(`[seo] dev mode: Vite SPA on http://${host}:${port} (no SSR)`);
    await new Promise((resolveListen) => {
      const server = createServer((req, res) => vite.middlewares(req, res));
      server.listen(port, host, resolveListen);
    });
    return;
  }

  const entry = () => import('./dist/server/entry-server.mjs');
  const initial = await entry();
  const read = initial.createCatalogReader(apiBase);
  const sitemap = initial.createSitemap(read, origin);
  const cached = createResponseCache();
  const verification = { google: process.env.GOOGLE_SITE_VERIFICATION, bing: process.env.BING_SITE_VERIFICATION };
  const refreshTimer = setInterval(() => void sitemap.refresh().then(() => { if (sitemap.health().stale) console.error('[seo] sitemap unavailable or stale'); }), 3600000);
  refreshTimer.unref();
  void sitemap.refresh();

  async function handler(req, res) {
    const headers = { 'X-Content-Type-Options': 'nosniff' };
    if (!indexable) headers['X-Robots-Tag'] = 'noindex, follow';
    const send = (status, body, extra = {}) => { res.writeHead(status, { ...headers, ...extra }); res.end(req.method === 'HEAD' ? undefined : body); };
    if (!['GET', 'HEAD'].includes(req.method)) return send(405, 'Method not allowed', { Allow: 'GET, HEAD' });
    let url;
    try { url = new URL(req.url, origin); } catch { return send(400, 'Bad request'); }
    if (url.href.length > 8192) return send(414, 'URI too long');
    if (url.pathname === '/health/seo' || url.pathname === '/health') {
      const health = sitemap.health();
      return send(url.pathname === '/health/seo' && health.stale ? 503 : 200, JSON.stringify({ renderer: 'ok', indexable, sitemap: health }), { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    }
    if (url.pathname === '/robots.txt') return send(200, `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' });
    if (url.pathname === '/sitemap.xml') {
      const snapshot = sitemap.get();
      return snapshot ? send(200, snapshot.xml, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' }) : send(503, 'Sitemap temporarily unavailable', { 'Content-Type': 'text/plain', 'Retry-After': '60', 'Cache-Control': 'no-store' });
    }
    if (url.pathname === '/config.js') {
      const keys = ['VITE_API_BASE_URL', 'VITE_API_TIMEOUT', 'VITE_API_IMAGE_PROCESSING_TIMEOUT', 'VITE_UMAMI_SRC', 'VITE_UMAMI_WEBSITE_ID', 'VITE_AUTH_MODE', 'VITE_ENABLE_REALTIME'];
      const config = Object.fromEntries(keys.map((k) => [k, process.env[k] || '']));
      config.VITE_AUTH_MODE ||= 'password';
      config.VITE_ENABLE_REALTIME ||= 'false';
      if (!config.VITE_API_BASE_URL) config.VITE_API_BASE_URL = apiBase;
      return send(200, `window.__APP_CONFIG__=${JSON.stringify(config).replace(/</g, '\\u003c')};`, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
    }
    if (extname(url.pathname) && (!url.pathname.endsWith('.html') || url.pathname === '/offline-shell.html')) {
      try {
        const file = resolve(clientDir, '.' + decodeURIComponent(url.pathname));
        if (!file.startsWith(clientDir + sep)) return send(404, 'Not found');
        if ((await stat(file)).isFile()) return send(200, await readFile(file), { ...(url.pathname.endsWith('.html') ? { 'X-Robots-Tag': 'noindex, follow' } : {}), 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': url.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=300' });
      } catch { /* continue to the useful page-level 404 */ }
    }
    try {
      const module = await entry();
      const key = url.pathname + url.search;
      const load = () => module.loadPage(url, read, { origin, apiBase, indexable, supportUrl });
      const result = await cached(key, load);
      if ('redirect' in result) return send(result.status, '', { Location: result.redirect, 'Cache-Control': 'no-store' });
      const template = await readFile(resolve(clientDir, 'index.html'), 'utf8');
      const html = module.render(result.data, template, verification);
      const isPrivate = result.data.kind === 'private';
      return send(result.status, html, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': result.data.seo.robots, ...(result.status === 503 ? { 'Retry-After': '60' } : {}), ...(isPrivate ? { Vary: 'Cookie' } : {}) });
    } catch (error) {
      console.error('[seo] render failed', error instanceof Error ? error.message : 'unknown error');
      return send(503, '<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="robots" content="noindex"><title>هما</title><h1>دریافت اطلاعات ممکن نشد</h1><p>لطفاً کمی بعد دوباره تلاش کنید.</p></html>', { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '60', 'X-Robots-Tag': 'noindex, follow' });
    }
  }
  const server = createServer((req, res) => void handler(req, res));
  await new Promise((resolveListen) => server.listen(port, host, resolveListen));
  server.on('close', () => { clearInterval(refreshTimer); });
  console.log(`[seo] listening on http://${host}:${server.address().port}; indexable=${indexable}`);
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await startServer({ dev: process.argv.includes('--dev') });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
