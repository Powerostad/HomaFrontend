import { collectAll, validateProduct, validateShop, type CatalogReader } from './catalog';
import { escapeHtml } from './metadata';
import { productPath, STATIC_PATHS } from './routes';
import type { PublicProduct, PublicShop } from './types';

export function sitemapXml(origin: string, products: PublicProduct[], shops: PublicShop[]) {
  const activeShops = new Map(shops.filter((s) => s.product_count > 0).map((s) => [s.slug, s]));
  const entries = new Map<string, string | undefined>(STATIC_PATHS.map((p) => [p, undefined]));
  for (const s of activeShops.values()) entries.set(`/store/${encodeURIComponent(s.slug)}`, s.updated_at);
  for (const p of products) if (activeShops.has(p.shop_slug)) entries.set(productPath(p.shop_slug, p.unique_link), p.updated_at);
  const body = [...entries].map(([path, updated]) => {
    const date = updated && Number.isFinite(Date.parse(updated)) ? new Date(updated).toISOString() : undefined;
    return `<url><loc>${escapeHtml(origin + path)}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`;
  }).join('\n');
  if (entries.size > 50000) throw new Error('Sitemap exceeds 50,000 URLs; split into an index before publishing');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  if (new TextEncoder().encode(xml).length > 50 * 1024 * 1024) throw new Error('Sitemap exceeds 50 MB');
  return { xml, count: entries.size };
}
export function createSitemap(read: CatalogReader, origin: string, now = Date.now) {
  let snapshot: { xml: string; count: number; generatedAt: number } | undefined;
  let lastError: string | null = null;
  let refreshing: Promise<void> | undefined;
  return {
    get: () => snapshot,
    health: () => ({ available: Boolean(snapshot), count: snapshot?.count ?? null, generatedAt: snapshot ? new Date(snapshot.generatedAt).toISOString() : null, ageSeconds: snapshot ? Math.floor((now() - snapshot.generatedAt) / 1000) : null, stale: !snapshot || now() - snapshot.generatedAt > 86400000, lastError }),
    refresh() {
      if (refreshing) return refreshing;
      refreshing = (async () => {
        try {
          const [products, shops] = await Promise.all([collectAll<PublicProduct>(read, '/products/', validateProduct), collectAll<PublicShop>(read, '/shops/list/', validateShop)]);
          const result = sitemapXml(origin, products, shops);
          snapshot = { ...result, generatedAt: now() }; lastError = null;
        } catch { lastError = 'Sitemap refresh failed; previous complete snapshot retained'; }
        finally { refreshing = undefined; }
      })();
      return refreshing;
    },
  };
}
