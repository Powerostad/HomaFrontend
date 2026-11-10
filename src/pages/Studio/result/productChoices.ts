import type { CategoryGroup } from './types';

/** Return new groups; never mutate the model's saved catalogue order. */
export function applyPrimaryProducts(groups: CategoryGroup[], primary: Record<number, string>): CategoryGroup[] {
  return groups.map(group => {
    const selected = group.products.find(product => product.id === primary[group.itemId]);
    return selected ? { ...group, products: [selected, ...group.products.filter(product => product.id !== selected.id)] } : group;
  });
}
