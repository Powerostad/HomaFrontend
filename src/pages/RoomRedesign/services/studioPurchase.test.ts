import { describe, expect, it } from 'vitest';
import { mergeCheckedLines, sameSelections } from './studioPurchase';

const line = { item_id: 'opaque:room:lamp', placement_id: 'left', product_id: 1, variant_id: 10, quantity: 1,
  product_unique_link: 'family', unit_price_rial: 100 };
describe('checked Studio purchase identities', () => {
  it('aggregates matching SKUs across placements while retaining different variants', () => {
    expect(mergeCheckedLines([line, { ...line, placement_id: 'right', quantity: 2 }, { ...line, variant_id: 11 }])).toEqual([
      { link: 'family', variantId: 10, quantity: 3 }, { link: 'family', variantId: 11, quantity: 1 },
    ]);
  });
  it('refuses a server substitution, quantity change or missing slot', () => {
    expect(sameSelections([line], [line])).toBe(true);
    expect(sameSelections([line], [{ ...line, variant_id: 11 }])).toBe(false);
    expect(sameSelections([line], [{ ...line, quantity: 2 }])).toBe(false);
    expect(sameSelections([line], [])).toBe(false);
  });
});
