// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CataloguePage from './CataloguePage';
import { catalogueAction, catalogueProducts } from '@/services/catalogueManagement';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (s: string) => s, siteValue: (value: unknown) => value, siteLocale: () => 'fa-IR', siteDirection: () => 'rtl' }) }));
vi.mock('@/services/catalogueManagement', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/catalogueManagement')>(),
  catalogueFacets: vi.fn(async () => ({ categories: [
    { code: 'window_coverings', name: 'پرده', parent_code: null, active: true, count: 1 },
    { code: 'curtain_panel', name: 'پارچه‌ای', parent_code: 'window_coverings', active: true, count: 1 },
  ], stats: { total: 1, active: 1, inactive: 0, deleted: 0 }, shops: [] })),
  catalogueProducts: vi.fn(async () => ({ count: 1, page: 1, page_size: 24, results: [{
    id: 12, name: 'پرده تست', price_rial: 1500000, image_url: null, merchant_url: null,
    shop: 'فروشگاه', category: { code: 'curtain_panel', name: 'پارچه‌ای', parent_code: 'window_coverings' },
    is_active: true, deleted_at: null, visual_complete: false, description: '', color: '', pattern: '',
  }] })),
  catalogueAction: vi.fn(async () => ({ updated: 1, ids: [12] })),
}));

describe('catalogue panel', () => {
  it('filters categories and requires a concrete confirmation before reversible deletion', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); document.body.append(container);
    const root = createRoot(container);
    const click = async (text: string) => act(async () => {
      const button = [...document.querySelectorAll('button')].find(b => b.textContent === text);
      if (!button) throw new Error(`Missing button ${text}`);
      button.click();
    });
    try {
      await act(async () => root.render(<MemoryRouter><CataloguePage /></MemoryRouter>));
      expect(container.textContent).toContain('پرده تست');
      expect(container.textContent).toContain('تصویر بررسی نشده');
      const categoryButton = [...container.querySelectorAll('aside button')].find(button => button.textContent?.startsWith('پرده'))!;
      await act(async () => (categoryButton as HTMLButtonElement).click());
      const calls = vi.mocked(catalogueProducts).mock.calls;
      expect(calls[calls.length - 1]?.[0]).toMatchObject({ category: 'window_coverings' });
      await act(async () => (container.querySelector('input[aria-label="انتخاب پرده تست"]') as HTMLInputElement).click());
      await click('انتقال به سطل بازیافت');
      expect(catalogueAction).not.toHaveBeenCalled();
      expect(document.body.textContent).toContain('تصاویر و مشخصات برای بازگردانی حفظ می‌شوند.');
      await act(async () => [...document.querySelectorAll('[role="dialog"] button')].find(button => button.textContent === 'انتقال به سطل بازیافت')!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      expect(catalogueAction).toHaveBeenCalledWith([12], 'trash', undefined);
      await click('بازگردانی حذف اخیر');
      expect(catalogueAction).toHaveBeenLastCalledWith([12], 'restore', undefined);
    } finally { await act(async () => root.unmount()); container.remove(); }
  });
});
