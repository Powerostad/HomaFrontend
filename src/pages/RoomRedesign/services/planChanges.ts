import type { DesignVersion, ExecutionPlan } from './redesignChatService';

type Purchase = ExecutionPlan['purchases'][number];
export const purchaseKey = (item: Purchase) => `${item.source_item_id || item.item_id}|${item.placement_id || ''}`;
export const purchaseFingerprint = (item: Purchase) => JSON.stringify({
  product: item.product?.product_id ?? null, variant: item.product?.candidate?.variant_id ?? item.product?.variant_id ?? null,
  category: item.category, quantity: item.quantity, reason: item.reason_fa,
  placement: item.placement_instruction_fa || item.mother_product?.placement_instruction || '',
  intent: item.mother_product?.search_brief || null,
});
const signature = (plan: ExecutionPlan) => JSON.stringify(plan.purchases.map(item => [purchaseKey(item), purchaseFingerprint(item)]).sort());

/** Compare complete snapshots. Never union them: a removed item must stay removed. */
export function planChanges(current: ExecutionPlan | null, previous: ExecutionPlan | null) {
  const badges = new Map<string, 'added' | 'changed'>();
  if (!current || !previous) return { badges, removed: [] as Purchase[] };
  const before = new Map(previous.purchases.map(item => [purchaseKey(item), item]));
  current.purchases.forEach(item => {
    const old = before.get(purchaseKey(item));
    if (!old) badges.set(purchaseKey(item), 'added');
    else if (purchaseFingerprint(old) !== purchaseFingerprint(item)) badges.set(purchaseKey(item), 'changed');
  });
  const active = new Set(current.purchases.map(purchaseKey));
  return { badges, removed: previous.purchases.filter(item => !active.has(purchaseKey(item))) };
}

/** A pending edit compares with its last snapshot; a saved edit with its predecessor. */
export function previousWorkspacePlan(current: ExecutionPlan | null, versions: DesignVersion[]) {
  const plans = versions.flatMap(version => version.execution ? [version.execution] : []);
  const latest = plans[plans.length - 1];
  if (!current || !latest) return null;
  return signature(current) === signature(latest) ? plans[plans.length - 2] || null : latest;
}
