import type { PurchaseCheckResult, StudioPurchaseLine } from './redesignChatService';

/** Variants are independent basket lines even when they share a product family. */
export function mergeCheckedLines(lines: PurchaseCheckResult['lines']) {
  const grouped = new Map<string, { link: string; variantId: number | null; quantity: number }>();
  for (const line of lines) {
    const key = JSON.stringify([line.product_unique_link, line.variant_id]);
    const previous = grouped.get(key);
    grouped.set(key, { link: line.product_unique_link, variantId: line.variant_id, quantity: (previous?.quantity || 0) + line.quantity });
  }
  return [...grouped.values()];
}

export function sameSelections(requested: StudioPurchaseLine[], checked: PurchaseCheckResult['lines']) {
  const key = (line: StudioPurchaseLine) => JSON.stringify([line.item_id, line.placement_id ?? null, line.product_id, line.variant_id, line.quantity]);
  const expected = requested.map(key).sort();
  const received = checked.map(key).sort();
  return expected.length === received.length && expected.every((value, index) => value === received[index]);
}
