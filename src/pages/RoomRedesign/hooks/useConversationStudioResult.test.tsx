// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecutionPlan } from '../services/redesignChatService';
import { useConversationStudioResult } from './useConversationStudioResult';

const basket = vi.hoisted(() => ({ basket: { shop_groups: [] as { items: { product_unique_link: string; id: string; quantity: number }[] }[] },
  addItem: vi.fn(async (_input: unknown) => true), updateQuantity: vi.fn(), openBasket: vi.fn() }));
vi.mock('@/context/BasketContext', () => ({ useBasket: () => basket }));
vi.mock('../components/workspace', () => ({ useImageActions: () => ({ isDownloading: false, onDownload: vi.fn() }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const plan: ExecutionPlan = { purchases: [{ item_id: 'lamp', quantity: 2, category: 'Lighting', reason_fa: 'Light', relation: 'similar',
  product: { product_id: 7, name: 'Lamp', price_toman: 10000, unique_link: 'lamp-7' },
  alternatives: [{ product_id: 8, name: 'Unknown', price_rial: null, merchant_url: 'https://example.com/product' }] }],
  free_actions: [{ instruction_fa: 'Move the sofa', reason_fa: 'Space' }], surface_actions: [],
  known_subtotal_rial: 200000, budget_ceiling_toman: null, budget_status: 'incomplete', unknown_cost_item_ids: [] };

async function mount() {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  let state: ReturnType<typeof useConversationStudioResult>;
  function Harness() {
    state = useConversationStudioResult({ plan, sessionId: 'conversation-uuid', versionId: 'v1', resultImage: 'render.jpg', originalImage: 'original.jpg', showOriginal: false, onToggleOriginal: vi.fn(), onOpenChat: vi.fn() });
    return null;
  }
  await act(async () => root.render(<MemoryRouter><Harness /></MemoryRouter>));
  return { get state() { return state!; }, unmount: async () => act(async () => root.unmount()) };
}

describe('conversation data in the original Studio', () => {
  beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); basket.basket.shop_groups = []; basket.addItem.mockResolvedValue(true); });
  it('preserves prices, unknowns and actions; selection stays local until finalization', async () => {
    const ui = await mount();
    try {
      expect(ui.state.categoryGroups).toHaveLength(2);
      expect(ui.state.categoryGroups[0].products[0].price).toBe(100000);
      expect(ui.state.categoryGroups[0].products[1].priceUnknown).toBe(true);
      expect(ui.state.harmonyScore).toBeUndefined();
      await act(async () => { ui.state.toggleAcceptedItem(1); ui.state.toggleBasketProduct('lamp/7'); ui.state.toggleBasketProduct('lamp/8'); });
      expect(ui.state.acceptedItems.has(1)).toBe(true);
      expect(ui.state.basketProductIds).toEqual(new Set(['lamp/7']));
      expect(ui.state.selectedPrice).toBe(200000);
      expect(basket.addItem).not.toHaveBeenCalled();
      await act(async () => ui.state.handleFinalize());
      expect(basket.addItem).toHaveBeenCalledExactlyOnceWith({ product_unique_link: 'lamp-7', source_context: 'studio', quantity: 2 });
      expect(basket.openBasket).toHaveBeenCalledOnce();
    } finally { await ui.unmount(); }
  });
  it('restores staged choices after remount without automatically adding them to the server', async () => {
    const first = await mount();
    await act(async () => { first.state.toggleBasketProduct('lamp/7'); first.state.updateItemQuantity(1, 3); });
    await first.unmount();
    const second = await mount();
    try { expect(second.state.selectedPrice).toBe(300000); expect(basket.addItem).not.toHaveBeenCalled(); }
    finally { await second.unmount(); }
  });
  it('swaps the primary product, transfers selected quantity and restores it after reload', async () => {
    const previous = plan.purchases[0].alternatives;
    plan.purchases[0].alternatives = [{ product_id: 8, name: 'Alternative', price_rial: 150000, unique_link: 'lamp-8' }];
    const ui = await mount();
    try {
      await act(async () => { ui.state.toggleBasketProduct('lamp/7'); ui.state.updateItemQuantity(1, 3); });
      await act(async () => ui.state.makePrimaryProduct(1, 'lamp/8'));
      expect(ui.state.categoryGroups[0].products.map(product => product.id)).toEqual(['lamp/8', 'lamp/7']);
      expect(ui.state.basketProductIds).toEqual(new Set(['lamp/8']));
      expect(ui.state.selectedPrice).toBe(450000);
      expect(basket.addItem).not.toHaveBeenCalled();
      await ui.unmount();
      const restored = await mount();
      try {
        expect(restored.state.categoryGroups[0].products[0].id).toBe('lamp/8');
        expect(restored.state.selectedPrice).toBe(450000);
        await act(async () => restored.state.makePrimaryProduct(1, 'lamp/7'));
        expect(restored.state.basketProductIds).toEqual(new Set(['lamp/7']));
        expect(restored.state.selectedPrice).toBe(300000);
        expect(basket.addItem).not.toHaveBeenCalled();
      } finally { await restored.unmount(); }
    } finally { plan.purchases[0].alternatives = previous; }
  });
  it('does not increment an existing server quantity or open checkout after an add failure', async () => {
    const ui = await mount();
    try {
      await act(async () => ui.state.toggleBasketProduct('lamp/7'));
      basket.addItem.mockResolvedValueOnce(false);
      await act(async () => ui.state.handleFinalize());
      expect(basket.openBasket).not.toHaveBeenCalled();
      basket.basket.shop_groups = [{ items: [{ product_unique_link: 'lamp-7', id: 'existing', quantity: 4 }] }];
      await act(async () => ui.state.handleFinalize());
      expect(basket.addItem).toHaveBeenCalledTimes(1);
      expect(basket.updateQuantity).not.toHaveBeenCalled();
      expect(basket.openBasket).toHaveBeenCalledOnce();
    } finally { await ui.unmount(); }
  });
});
