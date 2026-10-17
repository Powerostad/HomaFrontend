import { describe, expect, it } from 'vitest';
import type { ExecutionPlan } from './redesignChatService';
import type { MotherProduct } from './motherDocument';
import { toStudioCategoryGroups } from './studioResultAdapter';

describe('conversation Studio presentation adapter', () => {
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
