import { describe, expect, it } from 'vitest';
import { planChanges, previousWorkspacePlan, purchaseKey } from './planChanges';
import type { DesignVersion, ExecutionPlan } from './redesignChatService';
const item = (id: string, product = 1): ExecutionPlan['purchases'][number] => ({ item_id: id, category: 'bedding', quantity: 1, reason_fa: '', relation: 'similar', product: { product_id: product, name: id }, alternatives: [] });
const plan = (...purchases: ExecutionPlan['purchases']): ExecutionPlan => ({ purchases, free_actions: [], surface_actions: [], known_subtotal_rial: 0, budget_ceiling_toman: null, budget_status: 'unspecified', unknown_cost_item_ids: [] });
const version = (execution: ExecutionPlan, id = 'v1'): DesignVersion => ({ version_id: id, base_version_id: 'original', image_url: '', explanation: '', execution, legacy_incomplete: false });
describe('continuous project changes', () => {
  it('keeps unchanged products, marks changes and additions, and does not resurrect removals', () => {
    const before = plan(item('bed'), item('lamp'), item('rug'));
    const after = plan(item('bed'), item('lamp', 2), item('curtain'));
    const changes = planChanges(after, before);
    expect(changes.badges.get(purchaseKey(after.purchases[0]))).toBeUndefined();
    expect(changes.badges.get(purchaseKey(after.purchases[1]))).toBe('changed');
    expect(changes.badges.get(purchaseKey(after.purchases[2]))).toBe('added');
    expect(changes.removed.map(p => p.item_id)).toEqual(['rug']);
    expect(after.purchases.map(p => p.item_id)).toEqual(['bed', 'lamp', 'curtain']);
  });
  it('ignores refreshed prices and alternatives, but marks quantity changes', () => {
    const before = plan(item('bed')); const after = structuredClone(before);
    after.purchases[0].product!.price_rial = 200;
    after.purchases[0].alternatives = [item('other').product!];
    expect(planChanges(after, before).badges.size).toBe(0);
    after.purchases[0].quantity = 2;
    expect(planChanges(after, before).badges.size).toBe(1);
  });
  it('compares both pending and saved updates with the prior complete design', () => {
    const before = plan(item('bed')); const after = plan(item('bed'), item('lamp'));
    expect(previousWorkspacePlan(after, [version(before)])).toBe(before);
    expect(previousWorkspacePlan(after, [version(before), version(after, 'v2')])).toBe(before);
    expect(planChanges(before, null).badges.size).toBe(0);
  });
});
