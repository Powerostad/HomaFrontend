import type { CategoryGroup } from './types';

export interface ResultImageState {
  redesignedImageUrl?: string | null;
  roomImageUrl?: string | null;
  skipImageGeneration?: boolean;
}

export function isAnalysisOnlyResult(session: ResultImageState | null | undefined): boolean {
  return !!session && (session.skipImageGeneration === true || !session.redesignedImageUrl);
}

export function getResultImage(session: ResultImageState | null | undefined): string {
  if (isAnalysisOnlyResult(session)) return session?.roomImageUrl || '';
  return session?.redesignedImageUrl || session?.roomImageUrl || '';
}

/**
 * Keep the two price concepts independent: the recommendation total is a
 * preview of the primary picks, while the selected total is driven only by
 * explicit local basket choices.
 */
export function calculateRecommendedTotalPrice(categoryGroups: CategoryGroup[]): number {
  return categoryGroups
    .filter((group) => group.actionStatus === 'available' && group.products.length > 0)
    .reduce((total, group) => total + (group.products[0]?.price || 0) * (group.quantity || 1), 0);
}

export function calculateSelectedPrice(
  categoryGroups: CategoryGroup[],
  selectedProductIds: Set<string>,
  productQuantityOverrides: Map<string, number>,
): number {
  let total = 0;

  for (const group of categoryGroups) {
    if (group.actionStatus !== 'available' || group.products.length === 0) continue;

    for (let index = 0; index < group.products.length; index += 1) {
      const product = group.products[index];
      if (!selectedProductIds.has(product.id)) continue;

      const quantity = index === 0
        ? (group.quantity || 1)
        : (productQuantityOverrides.get(product.id) ?? group.quantity ?? 1);
      total += (product.price || 0) * quantity;
    }
  }

  return total;
}

export function countSelectedProducts(categoryGroups: CategoryGroup[], selectedProductIds: Set<string>): number {
  return categoryGroups.reduce(
    (count, group) => count + group.products.filter((product) => selectedProductIds.has(product.id)).length,
    0,
  );
}
