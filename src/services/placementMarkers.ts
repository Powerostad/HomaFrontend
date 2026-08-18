export interface ImagePlacementMarker {
  x: number;
  y: number;
  label?: string;
}

/** Normalize optional AI marker data without inventing a position. */
export function normalizeImagePlacementMarker(value: unknown): ImagePlacementMarker | null {
  if (!value || typeof value !== 'object') return null;

  const marker = value as Record<string, unknown>;
  const x = marker.x;
  const y = marker.y;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 0 ||
    x > 1 ||
    y < 0 ||
    y > 1
  ) {
    return null;
  }

  const normalized: ImagePlacementMarker = { x, y };
  if (typeof marker.label === 'string' && marker.label.trim()) {
    normalized.label = marker.label.trim();
  }
  return normalized;
}
