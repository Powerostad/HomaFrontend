// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { InvoiceSummary } from './InvoiceSummary';
import type { CategoryGroup } from './types';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (text: string) => text, siteValue: (value: unknown) => value }) }));
const group: CategoryGroup = { itemId: 1, category: 'rug', categoryDisplay: 'فرش', recommendationReasonFa: '', designRationaleFa: '', recommendedSize: '', quantity: 2, placements: [], positionInImage: null,
  actionStatus: 'available', interventionTier: 'quick_win', impactLevel: 'high', products: [{ id: 'main', name: 'فرش اصلی', category: 'rug', price: 100000, image: '' }, { id: 'alt', name: 'فرش جایگزین', category: 'rug', price: 200000, image: '' }, { id: 'unknown', name: 'فرش بدون قیمت', category: 'rug', price: 0, priceUnknown: true, image: '' }] };

describe('original static Studio shopping list', () => {
  it('uses selected line quantities, excludes services and external sourcing, and keeps controls working', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); const root = createRoot(container);
    const remove = vi.fn(), mainQuantity = vi.fn(), altQuantity = vi.fn(), finalize = vi.fn();
    const services: CategoryGroup[] = [{ ...group, itemId: 2, categoryDisplay: 'رنگ‌آمیزی', actionStatus: 'architectural', products: [] }, { ...group, itemId: 3, categoryDisplay: 'سفارش خارج فروشگاه', actionStatus: 'custom_order', products: [] }];
    await act(async () => root.render(<InvoiceSummary categoryGroups={[group, ...services]} acceptedItems={new Set([2, 3])} basketProductIds={new Set(['main', 'alt', 'unknown'])} selectedPrice={999999999} productQuantityOverrides={new Map([['alt', 3]])} onToggleBasketProduct={remove} onUpdateQuantity={mainQuantity} onUpdateProductQuantity={altQuantity} onFinalize={finalize} />));
    try {
      expect(container.textContent).toContain('لیست خرید شما');
      expect(container.textContent).not.toContain('رنگ‌آمیزی');
      expect(container.textContent).not.toContain('سفارش خارج فروشگاه');
      expect(container.textContent).toContain('جمع بالا فقط شامل قیمت‌های مشخص است');
      // (100,000 × 2 + 200,000 × 3) rial, shown as toman. Never trust an unrelated supplied total.
      expect(container.textContent).toContain('۸۰٬۰۰۰');
      const increase = container.querySelectorAll<HTMLButtonElement>('button[aria-label="افزایش تعداد"]');
      await act(async () => { increase[0].click(); increase[1].click(); container.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(); container.querySelector<HTMLButtonElement>('[aria-label="ادامه به پرداخت"]')!.click(); });
      expect(mainQuantity).toHaveBeenCalledWith(1, 3);
      expect(altQuantity).toHaveBeenCalledWith('alt', 4);
      expect(remove).toHaveBeenCalledWith('main');
      expect(finalize).toHaveBeenCalledOnce();
    } finally { await act(async () => root.unmount()); }
  });
});
