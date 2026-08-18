import { describe, expect, it } from 'vitest';
import { normalizeImagePlacementMarker } from './placementMarkers';

describe('Studio image placement markers', () => {
  it('accepts normalized coordinates and trims an optional label', () => {
    expect(normalizeImagePlacementMarker({ x: 0.2, y: 0.8, label: '  فرش  ' })).toEqual({
      x: 0.2,
      y: 0.8,
      label: 'فرش',
    });
  });

  it.each([
    null,
    undefined,
    { x: -0.1, y: 0.5 },
    { x: 0.5, y: 1.1 },
    { x: '0.5', y: 0.5 },
    { x: Number.NaN, y: 0.5 },
  ])('rejects an invalid marker: %j', (value) => {
    expect(normalizeImagePlacementMarker(value)).toBeNull();
  });

  it('does not fabricate a marker when the backend omits coordinates', () => {
    expect(normalizeImagePlacementMarker({ label: 'جایگزین' })).toBeNull();
  });
});
