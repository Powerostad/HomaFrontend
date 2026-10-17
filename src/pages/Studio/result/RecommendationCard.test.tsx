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
  it('shows one large primary and two compact alternatives, preserving explicit detail and basket actions', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    const root = createRoot(container);
    const onOpen = vi.fn(); const onToggle = vi.fn(); const onQuantity = vi.fn(); const onWhy = vi.fn();
    try {
      await act(async () => root.render(<RecommendationCard group={group} tier="quick_win" isTopPriority priorityRank={1}
        isWhyExpanded={false} isSaved={false} basketProductIds={new Set(['1'])} onToggleWhy={onWhy}
        onProductClick={onOpen} onToggleSaved={vi.fn()} onToggleBasketProduct={onToggle} onUpdateQuantity={onQuantity} />));
      expect(container.querySelectorAll('.studio-product-preview')).toHaveLength(3);
      expect(container.querySelectorAll('.is-primary')).toHaveLength(1);
      expect(container.querySelectorAll('.studio-alternatives-grid .studio-product-preview')).toHaveLength(2);
      expect(container.querySelectorAll('.studio-product-preview[dir=ltr]')).toHaveLength(3);
      expect(container.querySelectorAll('.studio-product-copy[dir=rtl]')).toHaveLength(3);
      expect(container.querySelector('.studio-recommendation-card .studio-alternatives')).toBeNull();
      expect(container.querySelector('.studio-recommendation > .studio-alternatives')).not.toBeNull();
      expect(container.querySelectorAll('.studio-recommendation-fact')).toHaveLength(3);
      expect(container.querySelector('.is-primary .studio-product-copy .studio-quantity-control')).not.toBeNull();
      expect(container.querySelector('.is-primary > .studio-product-select')).not.toBeNull();
      expect(container.querySelector('.studio-recommendation-header .studio-why-button')).not.toBeNull();
      expect(container.querySelector<HTMLElement>('.studio-recommendation-detail')!.hidden).toBe(true);
      const toggles = Array.from(container.querySelectorAll<HTMLButtonElement>('.studio-product-select'));
      expect(toggles[1].getAttribute('aria-pressed')).toBe('true');
      expect(toggles[2].disabled).toBe(true);
      await act(async () => toggles[0].click());
      expect(onToggle).toHaveBeenCalledExactlyOnceWith('0');
      expect(onOpen).not.toHaveBeenCalled();
      await act(async () => container.querySelector<HTMLButtonElement>('.studio-product-more')!.click());
      expect(onOpen).toHaveBeenCalledExactlyOnceWith(group.products[0]);
      expect(group.products).toHaveLength(4);
      const quantityButtons = container.querySelectorAll<HTMLButtonElement>('.studio-quantity-control button');
      expect(quantityButtons[0].disabled).toBe(true);
      await act(async () => quantityButtons[1].click());
      expect(onQuantity).toHaveBeenCalledExactlyOnceWith(2);
      await act(async () => container.querySelector<HTMLButtonElement>('.studio-why-button')!.click());
      expect(onWhy).toHaveBeenCalledOnce();
    } finally { await act(async () => root.unmount()); }
  });
});
