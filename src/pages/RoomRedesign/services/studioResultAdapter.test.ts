import { describe, expect, it } from 'vitest';
import type { ExecutionPlan } from './redesignChatService';
import type { MotherProduct } from './motherDocument';
import { toStudioCategoryGroups } from './studioResultAdapter';

describe('conversation Studio presentation adapter', () => {
  it('preserves the exact rug size and its price on the server-style search path', () => {
    const product = { product_id: 7, name: 'Rug', price_rial: 9000000, variant_id: 10,
      variant_label: '۲۰۰ × ۳۰۰', dimensions_cm: { width_cm: 200, length_cm: 300 } };
    const plan: ExecutionPlan = { purchases: [{ item_id: 'rug', category: 'rug', quantity: 2,
      reason_fa: '', relation: 'similar', product, alternatives: [] }], free_actions: [], surface_actions: [],
      known_subtotal_rial: 18000000, budget_ceiling_toman: null, budget_status: 'unspecified', unknown_cost_item_ids: [] };
    expect(toStudioCategoryGroups(plan)[0].products[0]).toMatchObject({
      variantId: 10, variantLabel: '۲۰۰ × ۳۰۰', dimensionsCm: { width_cm: 200, length_cm: 300 }, price: 9000000 });
  });
  it('carries concrete external sourcing guidance without inventing a purchasable product', () => {
    const explanation = 'برای کنار پنجره، پردهٔ کتانی روشن با رنگ کرم جست‌وجو کنید.';
    const plan: ExecutionPlan = { purchases: [{ item_id: 'curtain', category: 'drapery_panel', quantity: 1,
      reason_fa: 'نرم شدن نور', relation: 'concept', product: null, alternatives: [],
      sourcing_guidance: { mode: 'external_search', title_fa: 'پرده', explanation_fa: explanation,
        search_query: 'پرده کتانی کرم', specifications_fa: ['رنگ: کرم'], placement_fa: 'کنار پنجره',
        design_preserved: true, image_status: 'concept', catalogue_status: 'no_match' } }],
      free_actions: [], surface_actions: [], known_subtotal_rial: 0, budget_ceiling_toman: null,
      budget_status: 'incomplete', unknown_cost_item_ids: ['curtain'] };
    const group = toStudioCategoryGroups(plan)[0];
    expect(group).toMatchObject({ actionStatus: 'custom_order', products: [], actionGuidance: explanation,
      webSearchQuery: 'پرده کتانی کرم' });
    expect(plan.known_subtotal_rial).toBe(0);
  });
  it('keeps commercial pack count separate from design demand and price per pack', () => {
    const orderQuote = { status: 'quoted' as const, sales_unit: 'pack' as const, order_quantity: 2,
      demand_quantity: '5', demand_unit: 'piece', supplied_quantity: '8' };
    const plan: ExecutionPlan = { search_version: 'studio-search-v2', purchases: [{ item_id: 'line', source_item_id: 'room:panels',
      placement_id: 'wall', quantity: 2, category: 'wall_panels', reason_fa: '', relation: 'similar', alternatives: [],
      product: { product_id: 1, name: 'Panels', price_rial: 100, candidate: { variant_id: 10, variant_label: 'Pack of four',
        dimensions_cm: {}, quantity: 5, order_quote: orderQuote, eligibility: 'eligible', purchase_status: 'ready',
        known_total_rial: 200, verification_reasons: [], missing_costs: [] } } }],
      free_actions: [], surface_actions: [], known_subtotal_rial: 200, budget_ceiling_toman: null,
      budget_status: 'unspecified', unknown_cost_item_ids: [] };
    const group = toStudioCategoryGroups(plan)[0];
    expect(group.quantity).toBe(2);
    expect(group.products[0]).toMatchObject({ price: 100, orderQuote });
    expect(plan.purchases[0].product?.candidate?.quantity).toBe(5);
  });
  it('retains two variants of a family, placement identity and unknown verification status', () => {
    const product = { product_id: 1, name: 'Lamp', candidate: { variant_id: 10, variant_label: 'Small', dimensions_cm: { width_cm: 10 }, quantity: 1,
      eligibility: 'eligible' as const, purchase_status: 'needs_verification' as const, known_total_rial: null, verification_reasons: ['stock_unknown'], missing_costs: [] } };
    const plan: ExecutionPlan = { search_version: 'studio-search-v2', purchases: [{ item_id: 'line', source_item_id: 'room:lamp', placement_id: 'left', quantity: 1,
      category: 'lamp', reason_fa: '', relation: 'similar', product, alternatives: [{ ...product, candidate: { ...product.candidate, variant_id: 11 } }],
      review_candidates: [{ ...product, product_id: 2 }] }], free_actions: [], surface_actions: [], known_subtotal_rial: 0, budget_ceiling_toman: null,
      budget_status: 'incomplete', unknown_cost_item_ids: ['line'] };
    const products = toStudioCategoryGroups(plan)[0].products;
    expect(products.map(p => p.id)).toEqual(['line/1/10', 'line/1/11']);
    expect(products[0]).toMatchObject({ studioItemId: 'room:lamp', studioPlacementId: 'left', variantId: 10, priceUnknown: true, purchaseStatus: 'needs_verification' });
    expect(products.some(p => p.studioProductId === 2)).toBe(false);
    plan.purchases[0].product = null;
    expect(toStudioCategoryGroups(plan)[0].products[0].purchaseStatus).toBe('needs_verification');
  });
  it('separates layout improvements, execution services and externally sourced products without inventing costs', () => {
    const plan: ExecutionPlan = { purchases: [{ item_id: 'rug', quantity: 1, category: 'فرش', reason_fa: 'بافت طبیعی', relation: 'concept', product: null, alternatives: [] }],
      free_actions: [{ instruction_fa: 'جابه‌جایی مبل', reason_fa: 'باز شدن مسیر' }],
      surface_actions: [{ change_fa: 'رنگ‌آمیزی دیوار', target: 'wall' }], known_subtotal_rial: 0,
      budget_ceiling_toman: null, budget_status: 'incomplete', unknown_cost_item_ids: ['rug', 'surface:0'] };
    const groups = toStudioCategoryGroups(plan);
    expect(groups.map(group => group.itemId)).toEqual([1, 2, 3]);
    expect(groups[0].actionStatus).toBe('custom_order');
    expect(groups[1]).toMatchObject({ actionKind: 'layout', interventionTier: 'enhancement' });
    expect(groups[2]).toMatchObject({ actionKind: 'service', actionStatus: 'architectural', interventionTier: 'structural' });
    expect(groups.every(group => !group.products.length)).toBe(true);
    expect(plan.surface_actions[0].target).toBe('wall');
  });
  it('uses the mother contract 1–10 impact scale and keeps search diagnostics out of product copy', () => {
    const plan: ExecutionPlan = { purchases: [2, 5, 8].map((impact, index) => ({
      item_id: `item-${index}`, quantity: 1, category: 'lighting', reason_fa: 'Design reason', relation: 'similar',
      product: { product_id: index + 1, name: 'Lamp', match_notes: ['overlap:+0.16 bonus:color-aligns'] }, alternatives: [],
      mother_product: { scores: { impact_score: impact } } as MotherProduct,
    })), free_actions: [], surface_actions: [], known_subtotal_rial: 0, budget_ceiling_toman: null,
      budget_status: 'incomplete', unknown_cost_item_ids: [] };
    const groups = toStudioCategoryGroups(plan);
    expect(groups.map(group => group.impactLevel)).toEqual(['low', 'medium', 'high']);
    expect(groups.every(group => group.impactKnown)).toBe(true);
    expect(groups[0].products[0].persianReason).toBe('Design reason');
    expect(groups[0].products[0].matchHighlights).toBeUndefined();
    expect(plan.purchases[0].product?.match_notes).toEqual(['overlap:+0.16 bonus:color-aligns']);
  });
});
