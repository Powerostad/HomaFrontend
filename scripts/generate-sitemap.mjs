/**
 * Sitemap generator.
 *
 * Fetches the public product catalog from the backend and emits
 * public/sitemap.xml with:
 *   - static marketing pages (hand-maintained list below)
 *   - one URL per shop store page        ->  /store/{shop_slug}
 *   - one URL per product detail page    ->  /store/{shop_slug}/product/{unique_link}
 *
 * Fail-safe: any network/parse error logs a warning and exits 0, leaving the
 * existing public/sitemap.xml untouched. The file is only written after the
 * full catalog has been fetched successfully, so a partial sitemap is never
 * produced. This lets it run as a `prebuild` step without ever breaking a build
 * when the backend is unreachable (e.g. in CI).
 *
 * Config (env, with production defaults):
 *   SITEMAP_SITE_URL   public site origin   (default https://myhoma.ir)
 *   SITEMAP_API_URL    backend API origin   (default https://api.myhoma.ir)
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SITE_URL = (process.env.SITEMAP_SITE_URL || 'https://myhoma.ir').replace(/\/$/, '');
const API_URL = (process.env.SITEMAP_API_URL || 'https://api.myhoma.ir').replace(/\/$/, '');
const PAGE_SIZE = 100;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'public', 'sitemap.xml');

const TODAY = new Date().toISOString().slice(0, 10);

// Static, indexable marketing pages. Excludes /shop (alias of /explore),
// /basket (no SEO value), and every route disallowed in public/robots.txt.
const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/explore', changefreq: 'weekly', priority: '0.8' },
  { path: '/gallery', changefreq: 'weekly', priority: '0.8' },
  { path: '/studio/upload', changefreq: 'monthly', priority: '0.7' },
  { path: '/collaboration', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/faq', changefreq: 'monthly', priority: '0.5' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Fetch every product across all pages. Throws on any failure. */
async function fetchAllProducts() {
  const products = [];
  let page = 1;

  for (;;) {
    const url = `${API_URL}/api/products/?page=${page}&page_size=${PAGE_SIZE}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    // Standardized envelope: { success, message, data: { count, next, results } }
    const data = json?.data ?? json;
    const results = data?.results;
    if (!Array.isArray(results)) {
      throw new Error(`Unexpected response shape from ${url}`);
    }

    products.push(...results);

    if (!data.next) break;
    page += 1;
  }

  return products;
}

function urlEntry({ path, lastmod, changefreq, priority }) {
  const lines = [
    '  <url>',
    `    <loc>${xmlEscape(SITE_URL + path)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
  ];
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

function buildSitemap(products) {
  const entries = STATIC_ROUTES.map((r) => urlEntry({ ...r, lastmod: TODAY }));

  // Unique store pages, derived from the shops that actually have products.
  const storeSlugs = new Set();
  for (const p of products) {
    if (p?.shop_slug) storeSlugs.add(p.shop_slug);
  }
  for (const slug of storeSlugs) {
    entries.push(urlEntry({
      path: `/store/${encodeURIComponent(slug)}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: '0.7',
    }));
  }

  // Product detail pages.
  for (const p of products) {
    if (!p?.shop_slug || !p?.unique_link) continue;
    const lastmod = typeof p.created_at === 'string' ? p.created_at.slice(0, 10) : TODAY;
    entries.push(urlEntry({
      path: `/store/${encodeURIComponent(p.shop_slug)}/product/${encodeURIComponent(p.unique_link)}`,
      lastmod,
      changefreq: 'weekly',
      priority: '0.6',
    }));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
}

async function main() {
  let products;
  try {
    products = await fetchAllProducts();
  } catch (err) {
    console.warn(`[generate-sitemap] backend unreachable, keeping existing sitemap. Reason: ${err.message}`);
    process.exit(0);
  }

  const xml = buildSitemap(products);
  await writeFile(OUTPUT_PATH, xml, 'utf8');

  const storeCount = new Set(products.map((p) => p?.shop_slug).filter(Boolean)).size;
  console.log(`[generate-sitemap] wrote ${OUTPUT_PATH}: ${STATIC_ROUTES.length} static + ${storeCount} stores + ${products.length} products`);
}

main();
