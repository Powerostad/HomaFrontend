import { describe, expect, it } from 'vitest';
import type { ExecutionPlan } from './redesignChatService';
import type { MotherProduct } from './motherDocument';
import { toStudioCategoryGroups } from './studioResultAdapter';

describe('conversation Studio presentation adapter', () => {
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
