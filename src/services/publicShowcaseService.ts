import { apiGet } from '@/utils/apiClient';
import { appConfig } from '@/config/appConfig';

/** Deliberately independent of the full Studio product contract. */
export interface PublicShowcaseProduct { image_url: string; price: number | null }
export interface PublicShowcaseCategory { code: string; label: string; children: PublicShowcaseCategory[] }
export interface PublicShowcaseGroup { category: Pick<PublicShowcaseCategory, 'code' | 'label'>; results: PublicShowcaseProduct[] }
const photoRows = (rows: PublicShowcaseProduct[]): PublicShowcaseProduct[] => rows.map(row => ({ image_url: new URL(row.image_url, appConfig.apiBaseUrl).href, price: row.price }));
export async function fetchPublicShowcaseGroups(signal?: AbortSignal): Promise<PublicShowcaseGroup[]> {
  const result = await apiGet<{ groups: PublicShowcaseGroup[] }>('/products/showcase/groups/', undefined, { skipAuth: true, signal });
  if (!result.success || !result.data) throw new Error('showcase_unavailable');
  return result.data.groups.map(group => ({ category: { code: group.category.code, label: group.category.label }, results: photoRows(group.results) }));
}
export async function fetchPublicCategories(signal?: AbortSignal): Promise<PublicShowcaseCategory[]> {
  const result = await apiGet<{ categories: PublicShowcaseCategory[] }>('/products/showcase/categories/', undefined, { skipAuth: true, signal });
  if (!result.success || !result.data) throw new Error('categories_unavailable');
  return result.data.categories;
}
export async function fetchPublicShowcase(signal?: AbortSignal, category = ''): Promise<PublicShowcaseProduct[]> {
  const result = await apiGet<{ results: PublicShowcaseProduct[] }>('/products/showcase/', category ? { category } : undefined, { skipAuth: true, signal });
  if (!result.success || !result.data) throw new Error('showcase_unavailable');
  return photoRows(result.data.results);
}
