// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecutionPlan } from '../services/redesignChatService';
import { useConversationStudioResult } from './useConversationStudioResult';
import { checkStudioPurchase } from '../services/redesignChatService';

const basket = vi.hoisted(() => ({ basket: { shop_groups: [] as { items: { product_unique_link: string; variant_id?: number; id: string; quantity: number }[] }[] },
  addItem: vi.fn(async (_input: unknown) => true), updateQuantity: vi.fn(), openBasket: vi.fn() }));
vi.mock('@/context/BasketContext', () => ({ useBasket: () => basket }));
vi.mock('../components/workspace', () => ({ useImageActions: () => ({ isDownloading: false, onDownload: vi.fn() }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('../services/redesignChatService', () => ({ checkStudioPurchase: vi.fn() }));

const plan: ExecutionPlan = { purchases: [{ item_id: 'lamp', quantity: 2, category: 'Lighting', reason_fa: 'Light', relation: 'similar',
  product: { product_id: 7, name: 'Lamp', price_toman: 10000, unique_link: 'lamp-7' },
  alternatives: [{ product_id: 8, name: 'Unknown', price_rial: null, merchant_url: 'https://example.com/product' }] }],
  free_actions: [{ instruction_fa: 'Move the sofa', reason_fa: 'Space' }], surface_actions: [],
  known_subtotal_rial: 200000, budget_ceiling_toman: null, budget_status: 'incomplete', unknown_cost_item_ids: [] };

async function mount(currentPlan = plan) {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  let state: ReturnType<typeof useConversationStudioResult>;
  function Harness() {
    state = useConversationStudioResult({ plan: currentPlan, sessionId: 'conversation-uuid', versionId: 'v1', resultImage: 'render.jpg', originalImage: 'original.jpg', showOriginal: false, onToggleOriginal: vi.fn(), onOpenChat: vi.fn() });
    return null;
  }
  await act(async () => root.render(<MemoryRouter><Harness /></MemoryRouter>));
  return { get state() { return state!; }, update: async (next: ExecutionPlan) => { currentPlan = next; await act(async () => root.render(<MemoryRouter><Harness /></MemoryRouter>)); }, unmount: async () => act(async () => root.unmount()) };
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
  it('adds the recommended rug size to the basket instead of the parent default size', async () => {
    const current: ExecutionPlan = { ...plan, purchases: [{ ...plan.purchases[0], item_id: 'rug', category: 'rug',
      quantity: 1, alternatives: [], product: { product_id: 7, name: 'Rug', unique_link: 'rug-7',
        price_rial: 9000000, variant_id: 70, variant_label: '۲۰۰ × ۳۰۰', dimensions_cm: { width_cm: 200, length_cm: 300 } } }] };
    const ui = await mount(current);
    try {
      await act(async () => ui.state.toggleBasketProduct(ui.state.categoryGroups[0].products[0].id));
      expect(ui.state.selectedPrice).toBe(9000000);
      await act(async () => ui.state.handleFinalize());
      expect(basket.addItem).toHaveBeenCalledExactlyOnceWith({ product_unique_link: 'rug-7', variant_id: 70, quantity: 1, source_context: 'studio' });
    } finally { await ui.unmount(); }
  });
  it('keeps product card identity and quantity when a preceding recommendation is removed', async () => {
    const initial = { ...plan, purchases: [{ ...plan.purchases[0], item_id: 'first', product: { product_id: 1, name: 'First' } }, plan.purchases[0]] };
    const ui = await mount(initial);
    try {
      const lampId = ui.state.categoryGroups.find(group => group.workspaceKey === 'lamp|')!.itemId;
      await act(async () => ui.state.updateItemQuantity(lampId, 4));
      await ui.update({ ...plan, purchases: [plan.purchases[0]] });
      expect(ui.state.categoryGroups[0].itemId).toBe(lampId);
      expect(ui.state.categoryGroups[0].quantity).toBe(4);
      await ui.update({ ...plan, purchases: [{ ...plan.purchases[0], quantity: 3 }] });
      expect(ui.state.categoryGroups[0].quantity).toBe(3);
      expect(ui.state.categoryGroups.flatMap(g => g.products).some(p => p.name === 'First')).toBe(false);
    } finally { await ui.unmount(); }
  });
  it('keeps incomplete validated documents usable without manufacturing summary content', async () => {
    const ui = await mount({ ...plan, studio_documents: { room: { room_analysis: {} } } as unknown as ExecutionPlan['studio_documents'] });
    try { expect(ui.state.categoryGroups.length).toBeGreaterThan(0); expect(ui.state.diagnosisDetail).toBe(''); }
    finally { await ui.unmount(); }
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
  it('rechecks every V2 SKU and keeps two variants of the same family separate in the basket', async () => {
    const current: ExecutionPlan = { ...plan, search_version: 'studio-search-v2', purchases: [10, 11].map((variant, index) => ({
      ...plan.purchases[0], item_id: `line-${index}`, source_item_id: 'lamp', placement_id: `place-${index}`, quantity: 1, alternatives: [],
      product: { ...plan.purchases[0].product!, candidate: { variant_id: variant, variant_label: `Size ${variant}`, dimensions_cm: { width_cm: variant }, quantity: 1,
        eligibility: 'eligible', purchase_status: 'ready', known_total_rial: 100000, verification_reasons: [], missing_costs: [] } },
    })) };
    const checked = current.purchases.map(p => ({ item_id: 'lamp', placement_id: p.placement_id, product_id: 7, variant_id: p.product!.candidate!.variant_id,
      quantity: 1, product_unique_link: 'lamp-7', unit_price_rial: 100000 }));
    vi.mocked(checkStudioPurchase).mockResolvedValue({ success: true, data: { ready: true, lines: checked, reasons: [] } });
    const ui = await mount(current);
    try {
      await act(async () => ui.state.categoryGroups.slice(0, 2).forEach(group => ui.state.toggleBasketProduct(group.products[0].id)));
      await act(async () => ui.state.handleFinalize());
      expect(checkStudioPurchase).toHaveBeenCalledWith('conversation-uuid', 'v1', checked.map(({ product_unique_link: _link, unit_price_rial: _price, ...line }) => line));
      expect(basket.addItem.mock.calls.map(call => call[0])).toEqual([10, 11].map(variant => ({ product_unique_link: 'lamp-7', variant_id: variant, quantity: 1, source_context: 'studio' })));
    } finally { await ui.unmount(); }
  });
  it('does not add a V2 item when fresh verification fails', async () => {
    const current: ExecutionPlan = { ...plan, search_version: 'studio-search-v2' };
    vi.mocked(checkStudioPurchase).mockResolvedValue({ success: true, data: { ready: false, lines: [], reasons: [] } });
    const ui = await mount(current);
    try {
      await act(async () => ui.state.toggleBasketProduct(ui.state.categoryGroups[0].products[0].id));
      await act(async () => ui.state.handleFinalize());
      expect(checkStudioPurchase).toHaveBeenCalledOnce();
      expect(basket.addItem).not.toHaveBeenCalled();
      expect(basket.openBasket).not.toHaveBeenCalled();
    } finally { await ui.unmount(); }
  });
  it('buys two packs for five design pieces and rejects a changed commercial quantity', async () => {
    const current: ExecutionPlan = { ...plan, search_version: 'studio-search-v2', purchases: [{ ...plan.purchases[0],
      item_id: 'line', source_item_id: 'panels', placement_id: 'wall', quantity: 2, alternatives: [],
      product: { ...plan.purchases[0].product!, candidate: { variant_id: 10, variant_label: 'Pack of four', dimensions_cm: {},
        quantity: 5, order_quote: { status: 'quoted', sales_unit: 'pack', order_quantity: 2, demand_quantity: '5', demand_unit: 'piece' },
        eligibility: 'eligible', purchase_status: 'ready', known_total_rial: 200000, verification_reasons: [], missing_costs: [] } } }] };
    const line = { item_id: 'panels', placement_id: 'wall', product_id: 7, variant_id: 10, quantity: 2,
      product_unique_link: 'lamp-7', unit_price_rial: 100000 };
    vi.mocked(checkStudioPurchase).mockResolvedValue({ success: true, data: { ready: true, lines: [{ ...line, quantity: 5 }], reasons: [] } });
    const ui = await mount(current);
    try {
      await act(async () => ui.state.toggleBasketProduct(ui.state.categoryGroups[0].products[0].id));
      expect(ui.state.selectedPrice).toBe(200000);
      await act(async () => ui.state.handleFinalize());
      expect(basket.addItem).not.toHaveBeenCalled();
      vi.mocked(checkStudioPurchase).mockResolvedValue({ success: true, data: { ready: true, lines: [line], reasons: [] } });
      await act(async () => ui.state.handleFinalize());
      expect(basket.addItem).toHaveBeenCalledExactlyOnceWith({ product_unique_link: 'lamp-7', variant_id: 10, quantity: 2, source_context: 'studio' });
    } finally { await ui.unmount(); }
  });
});
