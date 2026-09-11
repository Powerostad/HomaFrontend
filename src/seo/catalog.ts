import type { PublicProduct, PublicShop } from './types';

export class UpstreamError extends Error {}
export class CatalogNotFound extends Error {}
export interface CatalogPage<T> { count: number; next: string | null; results: T[]; }
export type CatalogReader = <T>(path: string, params?: Record<string, string | number>) => Promise<CatalogPage<T>>;
export function createCatalogReader(base: string, fetcher: typeof fetch = fetch): CatalogReader {
  const api = base.replace(/\/$/, '').replace(/\/api$/, '') + '/api';
  return async <T>(path: string, params: Record<string, string | number> = {}) => {
    const url = new URL(api + path);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetcher(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (response.status === 404) throw new CatalogNotFound('Catalog page not found');
      if (!response.ok) throw new UpstreamError(`Catalog HTTP ${response.status}`);
      const json = await response.json();
      if (json.success === false) throw new UpstreamError('Catalog unsuccessful response');
      const data = json.data ?? json;
      if (!Number.isSafeInteger(data.count) || data.count < 0 || !Array.isArray(data.results) || !(data.next === null || typeof data.next === 'string')) throw new UpstreamError('Invalid catalog envelope');
      return data as CatalogPage<T>;
    } catch (error) {
      if (error instanceof CatalogNotFound || error instanceof UpstreamError) throw error;
      throw new UpstreamError('Catalog request failed');
    } finally { clearTimeout(timer); }
  };
}
export function validateProduct(p: PublicProduct) {
  if (!p || typeof p.unique_link !== 'string' || !p.unique_link || typeof p.name !== 'string' || !p.name || typeof p.shop_slug !== 'string' || !p.shop_slug || typeof p.shop_name !== 'string' || typeof p.price !== 'number' || !Number.isFinite(p.price)) throw new UpstreamError('Invalid public product');
  return p;
}
export function validateShop(s: PublicShop) {
  if (!s || typeof s.slug !== 'string' || !s.slug || typeof s.shop_name !== 'string' || !s.shop_name || !Number.isSafeInteger(s.product_count) || s.product_count < 0) throw new UpstreamError('Invalid public shop');
  return s;
}
export async function collectAll<T>(read: CatalogReader, path: string, validate: (item: T) => T): Promise<T[]> {
  const items: T[] = []; const seen = new Set<string>(); let expected: number | undefined;
  for (let page = 1; page <= 10000; page++) {
    const result = await read<T>(path, { page, page_size: 100 });
    if (expected !== undefined && expected !== result.count) throw new UpstreamError('Catalog changed during enumeration');
    expected = result.count;
    if (expected > 50000) throw new UpstreamError('Catalog exceeds sitemap capacity');
    for (const item of result.results.map(validate)) {
      const record = item as Record<string, unknown>;
      const identity = String(record.unique_link ?? record.slug ?? record.id);
      if (seen.has(identity)) throw new UpstreamError('Duplicate catalog record during enumeration');
      seen.add(identity); items.push(item);
    }
    if (!result.next) {
      if (items.length !== expected) throw new UpstreamError('Incomplete catalog');
      return items;
    }
    if (!result.results.length || items.length >= expected) throw new UpstreamError('Invalid catalog pagination');
  }
  throw new UpstreamError('Catalog pagination limit exceeded');
}
