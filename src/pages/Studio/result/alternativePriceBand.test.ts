import { expect, it } from 'vitest';
import { alternativePriceBand } from './alternativePriceBand';
it('compares known positive prices against the selected variant', () => {
  expect(alternativePriceBand(70, false, 100, false)).toBe('economic');
  expect(alternativePriceBand(100, false, 100, false)).toBe('similar');
  expect(alternativePriceBand(150, false, 100, false)).toBe('higher');
  expect(alternativePriceBand(0, false, 100, false)).toBeNull();
  expect(alternativePriceBand(70, true, 100, false)).toBeNull();
  expect(alternativePriceBand(70, false, 100, true)).toBeNull();
});
