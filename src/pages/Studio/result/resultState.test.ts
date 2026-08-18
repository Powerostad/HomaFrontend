import { describe, expect, it } from 'vitest';
import type { CategoryGroup } from './types';
import {
  calculateRecommendedTotalPrice,
  calculateSelectedPrice,
  countSelectedProducts,
  getResultImage,
  isAnalysisOnlyResult,
} from './resultState';

const groups = [
  {
    actionStatus: 'available',
    quantity: 2,
    products: [
      { id: 'primary', price: 100 },
      { id: 'alternative', price: 80 },
    ],
  },
] as unknown as CategoryGroup[];

describe('Studio result selection math', () => {
  it('keeps recommended total separate from an empty explicit selection', () => {
    expect(calculateRecommendedTotalPrice(groups)).toBe(200);
    expect(calculateSelectedPrice(groups, new Set(), new Map())).toBe(0);
    expect(countSelectedProducts(groups, new Set())).toBe(0);
  });

  it('counts and prices only explicitly selected products', () => {
    const selected = new Set(['alternative']);
    expect(calculateSelectedPrice(groups, selected, new Map([['alternative', 3]]))).toBe(240);
    expect(countSelectedProducts(groups, selected)).toBe(1);
  });

  it('uses the recommendation quantity for the primary product', () => {
    expect(calculateSelectedPrice(groups, new Set(['primary']), new Map([['primary', 9]]))).toBe(200);
  });
});

describe('Studio result image state', () => {
  it('keeps generated and analysis-only images distinct', () => {
    const generated = { redesignedImageUrl: '/after.jpg', roomImageUrl: '/before.jpg' };
    const analysisOnly = { redesignedImageUrl: '/stale-after.jpg', roomImageUrl: '/before.jpg', skipImageGeneration: true };

    expect(isAnalysisOnlyResult(generated)).toBe(false);
    expect(getResultImage(generated)).toBe('/after.jpg');
    expect(isAnalysisOnlyResult(analysisOnly)).toBe(true);
    expect(getResultImage(analysisOnly)).toBe('/before.jpg');
  });
});
