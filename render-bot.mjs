/**
 * Crawler meta-injection sidecar (dynamic rendering for social scrapers).
 *
 * nginx proxies ONLY crawler User-Agents here (see nginx.conf `$is_crawler`).
 * For /store/{slug} and /store/{slug}/product/{unique_link} this fetches the
 * shop/product from the backend and returns index.html with fresh Open Graph /
 * Twitter / <title> tags injected, so JS-blind scrapers (Telegram, WhatsApp,
 * Twitter, Facebook) render correct link-preview cards.
 *
 * Human browsers never reach this service — they get nginx static files and the
 * client-side useSeo() hook. Googlebot executes JS, so it does not strictly need
 * this, but routing it here too gives it server-rendered meta immediately.
 *
 * Fail-open: any backend error/timeout serves the untouched template. Never 500.
 * Zero dependencies: Node built-in http + global fetch (Node 18+).
 *
 * Env:
 *   RENDER_BOT_PORT     listen port            (default 8081)
 *   RENDER_BOT_HTML      index.html path        (default /usr/share/nginx/html/index.html)
 *   VITE_API_BASE_URL   backend origin          (default https://api.myhoma.ir)
 *   SITE_URL            canonical site origin   (default https://myhoma.ir)
 */

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const PORT = Number(process.env.RENDER_BOT_PORT || 8081);
const HTML_PATH = process.env.RENDER_BOT_HTML || '/usr/share/nginx/html/index.html';
const API_BASE = `${(process.env.VITE_API_BASE_URL || 'https://api.myhoma.ir').replace(/\/$/, '')}/api`;
const SITE_URL = (process.env.SITE_URL || 'https://myhoma.ir').replace(/\/$/, '');
const FETCH_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 10 * 60 * 1000;

const SITE_NAME = 'HOMA';
const TEMPLATE = readFileSync(HTML_PATH, 'utf8');

// Tiny in-memory cache so a crawler burst cannot hammer the backend.
const cache = new Map(); // key -> { value, expires }

function cacheGet(key) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  cache.delete(key);
  return undefined;
}
function cacheSet(key, value) {
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve { title, description, image, type } for a path, or null to passthrough. */
async function resolveMeta(pathname) {
  const productMatch = pathname.match(/^\/store\/([^/]+)\/product\/([^/]+)\/?$/);
  if (productMatch) {
    const uniqueLink = decodeURIComponent(productMatch[2]);
    const key = `product:${uniqueLink}`;
    const cached = cacheGet(key);
    if (cached !== undefined) return cached;

    const p = await fetchJson(`${API_BASE}/products/${encodeURIComponent(uniqueLink)}/`);
    const meta = p?.name
      ? {
          title: p.shop_name ? `${p.name} - ${p.shop_name}` : p.name,
          description: p.description
            ? String(p.description).slice(0, 200)
            : `${p.name} را با هوش مصنوعی HOMA در فضای خود ببینید.`,
          image: p.image_url || '',
          type: 'product',
        }
      : null;
    cacheSet(key, meta);
    return meta;
  }

  const storeMatch = pathname.match(/^\/store\/([^/]+)\/?$/);
  if (storeMatch) {
    const slug = decodeURIComponent(storeMatch[1]);
    const key = `store:${slug}`;
    const cached = cacheGet(key);
    if (cached !== undefined) return cached;

    // No single-shop endpoint; the list endpoint supports ?search=.
    const data = await fetchJson(`${API_BASE}/shops/list/?search=${encodeURIComponent(slug)}&page_size=10`);
    const shops = Array.isArray(data?.results) ? data.results : [];
    const shop = shops.find((s) => String(s.slug).toLowerCase() === slug.toLowerCase());
    const meta = shop
      ? {
          title: shop.shop_name,
          description: `محصولات فروشگاه ${shop.shop_name} در HOMA — مشاهده در فضای شما با هوش مصنوعی.`,
          image: shop.logo_url || '',
          type: 'website',
        }
      : null;
    cacheSet(key, meta);
    return meta;
  }

  return null;
}

function buildMetaBlock(meta, url) {
  const title = meta.title ? `${meta.title} | ${SITE_NAME}` : `${SITE_NAME} - مشاهده محصول در فضای شما`;
  const tags = [
    `<title>${htmlEscape(title)}</title>`,
    `<meta name="description" content="${htmlEscape(meta.description)}" />`,
    `<meta property="og:title" content="${htmlEscape(title)}" />`,
    `<meta property="og:description" content="${htmlEscape(meta.description)}" />`,
    `<meta property="og:type" content="${htmlEscape(meta.type)}" />`,
    `<meta property="og:url" content="${htmlEscape(url)}" />`,
    `<link rel="canonical" href="${htmlEscape(url)}" />`,
  ];
  if (meta.image) {
    tags.push(`<meta property="og:image" content="${htmlEscape(meta.image)}" />`);
    tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
    tags.push(`<meta name="twitter:image" content="${htmlEscape(meta.image)}" />`);
  } else {
    tags.push(`<meta name="twitter:card" content="summary" />`);
  }
  return tags.join('\n    ');
}

/** Strip the template's static title/description/og tags, inject fresh ones. */
function injectMeta(meta, url) {
  const block = buildMetaBlock(meta, url);
  return TEMPLATE
    .replace(/\s*<title>[\s\S]*?<\/title>/i, '')
    .replace(/\s*<meta\s+name="description"[^>]*>/i, '')
    .replace(/\s*<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/<\/head>/i, `    ${block}\n  </head>`);
}

const server = createServer(async (req, res) => {
  let pathname = '/';
  try {
    pathname = decodeURI(new URL(req.url, 'http://localhost').pathname);
  } catch {
    /* keep default */
  }

  const sendHtml = (body) => {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    });
    res.end(body);
  };

  try {
    const meta = await resolveMeta(pathname);
    if (!meta) {
      sendHtml(TEMPLATE);
      return;
    }
    const host = req.headers.host || SITE_URL.replace(/^https?:\/\//, '');
    const url = `https://${host}${pathname}`;
    sendHtml(injectMeta(meta, url));
  } catch {
    sendHtml(TEMPLATE);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[render-bot] listening on 127.0.0.1:${PORT}, api=${API_BASE}`);
});
