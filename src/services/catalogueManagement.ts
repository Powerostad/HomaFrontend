import { apiGet, apiPatch, apiPost } from '@/utils/apiClient';

export interface CatalogueCategory {
  code: string; name: string; parent_code: string | null;
  active?: boolean; count?: number; direct_count?: number;
}
export interface CatalogueProduct {
  id: number; name: string; price_rial: number; image_url: string | null;
  merchant_url: string | null; shop: string | null; category: CatalogueCategory;
  is_active: boolean; deleted_at: string | null; visual_complete: boolean;
  description: string; color: string; pattern: string;
  extra_details?: Record<string, unknown>; seller_description?: string;
  variants?: { id: number; label_fa: string; sku: string; price: number | null }[];
}
export interface CatalogueFacets {
  categories: CatalogueCategory[];
  stats: { total: number; active: number; inactive: number; deleted: number };
  shops: { shop_id: number; shop__shop_name: string; count: number }[];
}
export interface CataloguePage { count: number; page: number; page_size: number; results: CatalogueProduct[] }
export type CatalogueAction = 'trash' | 'restore' | 'activate' | 'deactivate' | 'categorize';

function unwrap<T>(response: { success: boolean; data?: T; message?: string; error?: string }): T {
  if (!response.success || !response.data) throw new Error(response.error || response.message || 'catalogue_request_failed');
  return response.data;
}
export const catalogueFacets = async () => unwrap(await apiGet<CatalogueFacets>('/products/manage/facets/'));
export const catalogueProducts = async (params: Record<string, unknown>, signal?: AbortSignal) =>
  unwrap(await apiGet<CataloguePage>('/products/manage/', params, { signal }));
export const catalogueProduct = async (id: number) => unwrap(await apiGet<CatalogueProduct>(`/products/manage/${id}/`));
export const catalogueAction = async (ids: number[], action: CatalogueAction, category?: string) =>
  unwrap(await apiPost<{ updated: number; ids: number[] }>('/products/manage/', { ids, action, ...(category ? { category } : {}) }));
export const catalogueEdit = async (id: number, data: { name: string; price: number; category: string }) =>
  unwrap(await apiPatch<CatalogueProduct>(`/products/manage/${id}/`, data));

export function toggleSelection(selected: number[], id: number) {
  return selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id];
}
export function safeMerchantUrl(value: string | null) {
  try { const url = new URL(value || ''); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}
