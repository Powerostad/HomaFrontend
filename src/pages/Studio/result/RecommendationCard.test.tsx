// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import type { CategoryGroup } from './types';
import { RecommendationCard } from './RecommendationCard';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteValue: (value: unknown) => value, siteText: (value: string) => value, siteDirection: () => 'rtl' }) }));
vi.mock('react-i18next', async importOriginal => ({ ...await importOriginal<typeof import('react-i18next')>(), useTranslation: () => ({ t: (key: string, fallback: unknown) => typeof fallback === 'string' ? fallback : key }) }));

const group: CategoryGroup = { itemId: 2, category: 'rug', categoryDisplay: 'Rug', recommendationReasonFa: 'Reason', designRationaleFa: 'Strategy',
  recommendedSize: '', quantity: 1, placements: [], positionInImage: null, actionStatus: 'available', interventionTier: 'quick_win', impactLevel: 'high',
  products: Array.from({ length: 4 }, (_, index) => ({ id: String(index), name: `Product ${index}`, category: 'rug', image: '', price: index * 10000, uniqueLink: index === 2 ? undefined : `link-${index}`, priceUnknown: index === 2 })) };

describe('Studio product and alternative presentation', () => {
  it('keeps alternatives closed, marks only the first three, and shows ten compact options on demand', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div'); const root = createRoot(container);
    const primary = vi.fn(); const basket = vi.fn();
    try {
      const products = Array.from({ length: 13 }, (_, i) => ({ ...group.products[0], id: String(i), name: `Product ${i}`,
        description: 'DESCRIPTION_SHOULD_NOT_APPEAR', variantLabel: 'SKU_DETAILS_SHOULD_NOT_APPEAR', purchaseStatus: 'ready' as const }));
      await act(async () => root.render(<RecommendationCard group={{ ...group, products }} tier="quick_win" isTopPriority={false} priorityRank={1} isWhyExpanded={false} isSaved={false} basketProductIds={new Set()} onToggleWhy={vi.fn()} onProductClick={vi.fn()} onToggleSaved={vi.fn()} onToggleBasketProduct={basket} onMakePrimary={primary} />));
      const panel = container.querySelector<HTMLElement>('.studio-alternatives')!;
      expect(panel.hidden).toBe(true);
      const swap = container.querySelector<HTMLButtonElement>('.studio-swap-toggle')!;
      await act(async () => swap.click());
      expect(panel.hidden).toBe(false);
      expect(container.querySelectorAll('.studio-swap-option')).toHaveLength(10);
      expect(container.querySelectorAll('.studio-swap-tag')).toHaveLength(3);
      expect(Array.from(container.querySelectorAll('.studio-swap-option[data-recommended] .studio-swap-name')).map(node => node.textContent)).toEqual(['Product 1', 'Product 2', 'Product 3']);
      expect(container.textContent).not.toContain('DESCRIPTION_SHOULD_NOT_APPEAR');
      expect(container.textContent).not.toContain('SKU_DETAILS_SHOULD_NOT_APPEAR');
      expect(container.querySelector('.studio-sku-details')).toBeNull();
      expect(primary).not.toHaveBeenCalled();
      expect(basket).not.toHaveBeenCalled();
      await act(async () => container.querySelector<HTMLButtonElement>('.studio-alternatives-heading button')!.click());
      expect(panel.hidden).toBe(true);
      await act(async () => swap.click());
      await act(async () => container.querySelectorAll<HTMLButtonElement>('.studio-swap-option')[3].click());
      expect(primary).toHaveBeenCalledExactlyOnceWith('4');
      expect(panel.hidden).toBe(true);
    } finally { await act(async () => root.unmount()); }
  });
  it('discloses all alternatives locally and never changes selection merely by opening them', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    const root = createRoot(container);
    const onOpen = vi.fn(); const onToggle = vi.fn(); const onQuantity = vi.fn(); const onWhy = vi.fn(); const onPrimary = vi.fn();
    try {
      await act(async () => root.render(<RecommendationCard group={group} tier="quick_win" isTopPriority priorityRank={1}
        isWhyExpanded={false} isSaved={false} basketProductIds={new Set(['0', '1'])} onToggleWhy={onWhy}
        onProductClick={onOpen} onToggleSaved={vi.fn()} onToggleBasketProduct={onToggle} onUpdateQuantity={onQuantity} onMakePrimary={onPrimary} />));
      expect(container.querySelectorAll('.studio-product-preview')).toHaveLength(1);
      expect(container.querySelectorAll('.is-primary')).toHaveLength(1);
      expect(container.querySelectorAll('.studio-swap-option')).toHaveLength(3);
      expect(container.querySelector('.studio-alternatives .studio-product-refinement')).toBeNull();
      expect(container.querySelector<HTMLElement>('.studio-alternatives')!.hidden).toBe(true);
      await act(async () => container.querySelector<HTMLButtonElement>('.studio-swap-toggle')!.click());
      expect(container.querySelector<HTMLElement>('.studio-alternatives')!.hidden).toBe(false);
      expect(onToggle).not.toHaveBeenCalled();
      expect(onOpen).not.toHaveBeenCalled();
      expect(container.querySelector('.studio-recommendation-card .studio-alternatives')).not.toBeNull();
      expect(container.querySelectorAll('.studio-recommendation-fact')).toHaveLength(0);
      expect(container.querySelector('.is-primary .studio-product-copy .studio-quantity-control')).not.toBeNull();
      expect(container.querySelector('.is-primary .studio-product-row-actions .studio-product-select')).not.toBeNull();
      expect(container.querySelector('.is-primary .studio-why-button')).toBeNull();
      expect(container.querySelector('.is-primary .studio-product-reason')).toBeNull();
      expect(container.querySelector('.is-primary .studio-product-details')).toBeNull();
      expect(container.querySelector('.studio-recommendation-detail')).toBeNull();
      const toggles = Array.from(container.querySelectorAll<HTMLButtonElement>('.studio-product-select'));
      expect(toggles).toHaveLength(1);
      await act(async () => toggles[0].click());
      expect(onToggle).toHaveBeenCalledExactlyOnceWith('0');
      expect(onOpen).not.toHaveBeenCalled();
      await act(async () => container.querySelector<HTMLButtonElement>('.studio-product-image-button')!.click());
      expect(onOpen).toHaveBeenCalledExactlyOnceWith(group.products[0]);
      expect(group.products).toHaveLength(4);
      const quantityButtons = container.querySelectorAll<HTMLButtonElement>('.studio-quantity-control button');
      expect(quantityButtons[0].disabled).toBe(true);
      await act(async () => quantityButtons[1].click());
      expect(onQuantity).toHaveBeenCalledExactlyOnceWith(2);
      expect(onWhy).not.toHaveBeenCalled();
      await act(async () => container.querySelector<HTMLButtonElement>('.studio-swap-option')!.click());
      expect(onPrimary).toHaveBeenCalledExactlyOnceWith('1');
      expect(container.querySelector<HTMLElement>('.studio-alternatives')!.hidden).toBe(true);
    } finally { await act(async () => root.unmount()); }
  });
});
