import { describe, expect, it } from 'vitest';
import { loadPage } from './loadPage';
import { createCatalogReader, collectAll, UpstreamError, type CatalogReader, type CatalogPage } from './catalog';
import { matchRoute } from './routes';
import { createSitemap, sitemapXml } from './sitemap';
import { renderHead, serializeJson } from './metadata';
import type { PublicProduct, PublicShop } from './types';
const shop: PublicShop = { id: 1, slug: 'shop', shop_name: 'فروشگاه', logo_url: null, product_count: 21 };
const product: PublicProduct = { id: 1, unique_link: 'product-id', shop_slug: 'shop', shop_name: 'فروشگاه', name: 'فرش', price: 1000000, image_url: 'https://media.test/rug.webp', description: 'فرش برای خانه' };
const options = { origin: 'https://myhoma.ir', apiBase: 'https://api.test', indexable: true };
const reader: CatalogReader = async <T>(path: string, params: Record<string, string | number> = {}) => {
  let results: (PublicProduct | PublicShop)[] = path === '/shops/list/' ? [shop] : [product];
  if (params.unique_link && params.unique_link !== product.unique_link || params.slug && params.slug !== shop.slug) results = [];
  return { count: results.length, results, next: null } as CatalogPage<T>;
};
const page = (path: string, read = reader, settings = options) => loadPage(new URL(path, 'https://untrusted-host.test'), read, settings);

describe('public route contract', () => {
  it('uses configured origin and strips campaigns from canonicals', async () => {
    const result = await page('/?utm_source=campaign&gclid=secret');
    expect('data' in result && result.data.seo.canonical).toBe('https://myhoma.ir/');
    expect('data' in result && result.data.seo.robots).toContain('index, follow');
  });
  it('normalizes aliases, page 1 and trailing slashes with real redirects', async () => {
    expect(await page('/shop')).toEqual({ status: 308, redirect: '/explore' });
    expect(await page('/gallery?page=1&utm_source=test')).toEqual({ status: 308, redirect: '/gallery?utm_source=test' });
    expect(await page('/explore/')).toEqual({ status: 308, redirect: '/explore' });
  });
  it.each(['/seo-not-found', '/account/unknown', '/studio/no-such-page', '/store/missing', '/gallery?page=99999', '/gallery?page=-1', '/gallery?page=NaN', '/store/shop/product/missing'])('returns actual 404: %s', async (path) => {
    const result = await page(path); expect(result.status).toBe(404);
    expect('data' in result && result.data.seo.robots).toContain('noindex');
  });
  it.each(['/basket', '/account/gallery', '/studio/upload', '/studio/result/private-id', '/try-on/product/upload', '/s/private-token', '/redesign/intake'])('noindexes known private routes: %s', async (path) => {
    const result = await page(path); expect(result.status).toBe(200);
    expect('data' in result && result.data.kind).toBe('private');
    expect('data' in result && result.data.seo.robots).toContain('noindex');
  });
  it('keeps public filters and non-production out of the index', async () => {
    for (const result of [await page('/gallery?search=rug'), await page('/', reader, { ...options, indexable: false })]) expect('data' in result && result.data.seo.robots).toContain('noindex');
  });
  it('redirects mismatched store identity to authoritative product URL', async () => {
    expect(await page('/store/wrong/product/product-id')).toEqual({ status: 308, redirect: '/store/shop/product/product-id' });
  });
  it('renders rial offer and real breadcrumbs with no fabricated facts', async () => {
    const result = await page('/store/shop/product/product-id');
    if (!('data' in result)) throw new Error('Unexpected redirect');
    const json = result.data.seo.jsonLd.find((s) => s['@type'] === 'Product');
    expect(json?.offers).toMatchObject({ price: 1000000, priceCurrency: 'IRR' });
    expect(json).not.toHaveProperty('aggregateRating');
    expect(json?.offers).not.toHaveProperty('availability');
    expect(result.data.breadcrumbs).toHaveLength(4);
  });
  it('does not mistake unsupported exact filters or backend outages for empty content', async () => {
    expect((await page('/store/shop/product/other', reader)).status).toBe(404);
    const broken: CatalogReader = async () => { throw new UpstreamError('Unavailable'); };
    const result = await page('/gallery', broken);
    expect(result.status).toBe(503);
    expect('data' in result && result.data.kind).toBe('unavailable');
    const unsupported: CatalogReader = async <T>() => ({ count: 20, next: 'next', results: [product] as T[] });
    expect((await page('/store/shop/product/product-id', unsupported)).status).toBe(503);
  });
  it('preserves page 2 canonical and data', async () => {
    const read: CatalogReader = async <T>() => ({ count: 21, next: null, results: [product] as T[] });
    const result = await page('/gallery?page=2', read);
    expect('data' in result && result.data.seo.canonical).toBe('https://myhoma.ir/gallery?page=2');
  });
  it('does not treat arbitrary workflow suffixes as valid routes', () => {
    expect(matchRoute('/studio/result/a/extra').kind).toBe('missing');
    expect(matchRoute('/store/%2Fprivate').kind).toBe('missing');
  });
});

describe('HTML metadata safety', () => {
  it('escapes dangerous serialized data and head attributes', async () => {
    const value = { name: '</script><script>alert(1)</script>\u2028' };
    expect(serializeJson(value)).not.toContain('<');
    expect(JSON.parse(serializeJson(value))).toEqual(value);
    const result = await page('/');
    if (!('data' in result)) throw new Error('Unexpected redirect');
    const html = renderHead({ ...result.data.seo, title: '"><script>alert(1)</script>' }, { google: '">bad' });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('catalog contract and sitemap atomicity', () => {
  it('rejects malformed envelopes and uses only the configured public API', async () => {
    const calls: string[] = [];
    const read = createCatalogReader('https://api.test/api', async (input) => { calls.push(String(input)); return new Response(JSON.stringify({ data: { count: 1, next: null, results: [] } })); });
    await read('/products/', { unique_link: 'abc' });
    expect(calls).toEqual(['https://api.test/api/products/?unique_link=abc']);
    const broken = createCatalogReader('https://api.test', async () => new Response('{}'));
    await expect(broken('/products/')).rejects.toThrow('Invalid catalog envelope');
  });
  it('rejects partial enumeration instead of publishing partial data', async () => {
    const partial: CatalogReader = async <T>() => ({ count: 3, next: null, results: [product] as T[] });
    await expect(collectAll(partial, '/products/', (v) => v)).rejects.toThrow('Incomplete catalog');
  });
  it('deduplicates and XML-escapes URLs, excludes workflow and inactive-shop products', () => {
    const result = sitemapXml(options.origin, [product, product, { ...product, unique_link: 'orphan', shop_slug: 'inactive' }], [shop, shop]);
    expect(result.xml.match(/product-id/g)).toHaveLength(1);
    expect(result.xml).not.toContain('orphan');
    expect(result.xml).not.toContain('/studio/upload');
    expect(result.xml).not.toContain('<lastmod>');
    expect(sitemapXml('https://test/?x=1&y=2', [], []).xml).toContain('&amp;');
  });
  it('retains a complete snapshot on failure, reports age and deduplicates refreshes', async () => {
    let failed = false; let now = 100000;
    const read: CatalogReader = async <T>(path: string) => { if (failed) throw new Error('outage'); return reader<T>(path); };
    const sitemap = createSitemap(read, options.origin, () => now);
    expect(sitemap.get()).toBeUndefined();
    const first = sitemap.refresh(); expect(sitemap.refresh()).toBe(first); await first;
    const xml = sitemap.get()!.xml;
    failed = true; now += 86400001; await sitemap.refresh();
    expect(sitemap.get()!.xml).toBe(xml);
    expect(sitemap.health()).toMatchObject({ stale: true, available: true });
    expect(sitemap.health().lastError).not.toBeNull();
  });
});
