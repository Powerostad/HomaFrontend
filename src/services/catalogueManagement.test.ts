import { describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/apiClient', () => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn() }));
import { apiGet, apiPatch, apiPost } from '@/utils/apiClient';
import { catalogueAction, catalogueEdit, catalogueProducts, safeMerchantUrl, toggleSelection } from './catalogueManagement';

describe('catalogue management', () => {
  it('keeps page selection explicit and reversible', () => {
    expect(toggleSelection([1, 3], 1)).toEqual([3]);
    expect(toggleSelection([1], 2)).toEqual([1, 2]);
  });
  it('rejects executable merchant links', () => {
    expect(safeMerchantUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeMerchantUrl('https://www.digikala.com/product/dkp-1/')).toContain('/dkp-1/');
  });
  it('uses authenticated management endpoints and explicit ids for trash/restore', async () => {
    vi.mocked(apiPost).mockResolvedValue({ success: true, data: { updated: 2, ids: [12, 13] } });
    await catalogueAction([12, 13], 'trash');
    expect(apiPost).toHaveBeenCalledWith('/products/manage/', { ids: [12, 13], action: 'trash' });
    await catalogueAction([12, 13], 'restore');
    expect(apiPost).toHaveBeenLastCalledWith('/products/manage/', { ids: [12, 13], action: 'restore' });
  });
  it('preserves filters and abort signal and reports failed edits', async () => {
    const controller = new AbortController();
    vi.mocked(apiGet).mockResolvedValue({ success: true, data: { count: 0, results: [] } });
    await catalogueProducts({ category: 'window_coverings', subcategory: 'curtain_panel' }, controller.signal);
    expect(apiGet).toHaveBeenCalledWith('/products/manage/', { category: 'window_coverings', subcategory: 'curtain_panel' }, { signal: controller.signal });
    vi.mocked(apiPatch).mockResolvedValue({ success: false, error: 'forbidden' });
    await expect(catalogueEdit(12, { name: 'name', price: 100, category: 'curtain_panel' })).rejects.toThrow('forbidden');
  });
});
