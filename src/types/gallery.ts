/**
 * Gallery Types
 * TypeScript definitions for user gallery (visualization results)
 */

import { apiConfig } from '@/utils/apiClient';

// =============================================================================
// Backend Response Types
// =============================================================================

/**
 * Gallery item as returned from Django backend
 * GET /api/users/gallery/
 */
export interface BackendGalleryItem {
  id: number;
  product_id: number;
  product_name: string;
  product_category: string;
  customer_image_path: string;
  result_image_path: string;
  score: 1 | 2 | 3 | null; // 1=Good, 2=Neutral, 3=Bad
  created_at: string;
  claimed_at: string | null;
}

/**
 * Gallery API response wrapper
 */
export interface GalleryAPIResponse {
  success: boolean;
  message?: string;
  data: BackendGalleryItem[];
}

// =============================================================================
// Frontend Types
// =============================================================================

/**
 * Gallery item for frontend use (transformed from BackendGalleryItem)
 */
export interface GalleryItem {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  customerImageUrl: string;
  resultImageUrl: string;
  score: 1 | 2 | 3 | null;
  createdAt: string;
  claimedAt: string | null;
  // Local-only state (not from API)
  isPinned: boolean;
}

/**
 * Result card display props (used by ResultCard component)
 * Maps from GalleryItem to the format expected by the UI
 */
export interface ResultCardData {
  id: string;
  coverImage: string;
  productName: string;
  storeName: string;
  timestamp: string;
  isPinned: boolean;
}

// =============================================================================
// Service Result Types
// =============================================================================

/**
 * Generic service result with success/error
 */
export interface GalleryServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Gallery fetch result
 */
export interface GalleryFetchResult extends GalleryServiceResult<GalleryItem[]> {}

/**
 * Single gallery item result
 */
export interface GalleryItemResult extends GalleryServiceResult<GalleryItem> {}

// =============================================================================
// Storage Keys
// =============================================================================

/**
 * localStorage keys for gallery data
 */
export const GALLERY_STORAGE_KEYS = {
  PINNED_ITEMS: 'homa_gallery_pinned',
  GALLERY_CACHE: 'homa_gallery_cache',
} as const;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get full image URL from path
 * Uses the backend image serving endpoint with optional resize
 */
export function getImageUrl(path: string, width?: number): string {
  const base = `${apiConfig.baseURL}/products/images/${path}`;
  return width ? `${base}?w=${width}` : base;
}

/**
 * Transform BackendGalleryItem to frontend GalleryItem
 */
export function transformBackendGalleryItem(
  backendItem: BackendGalleryItem,
  pinnedIds: Set<string> = new Set()
): GalleryItem {
  const id = String(backendItem.id);
  return {
    id,
    productId: String(backendItem.product_id),
    productName: backendItem.product_name,
    productCategory: backendItem.product_category,
    customerImageUrl: getImageUrl(backendItem.customer_image_path),
    resultImageUrl: getImageUrl(backendItem.result_image_path),
    score: backendItem.score,
    createdAt: backendItem.created_at,
    claimedAt: backendItem.claimed_at,
    isPinned: pinnedIds.has(id),
  };
}

/**
 * Transform GalleryItem to ResultCardData for UI display
 */
export function toResultCardData(
  item: GalleryItem,
  formatTimestamp: (date: string) => string
): ResultCardData {
  return {
    id: item.id,
    coverImage: item.resultImageUrl,
    productName: item.productName,
    storeName: item.productCategory, // Using category as store name for now
    timestamp: formatTimestamp(item.createdAt),
    isPinned: item.isPinned,
  };
}

/**
 * Get pinned item IDs from localStorage
 */
export function getPinnedItemIds(): Set<string> {
  try {
    const stored = localStorage.getItem(GALLERY_STORAGE_KEYS.PINNED_ITEMS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

/**
 * Save pinned item IDs to localStorage
 */
export function savePinnedItemIds(ids: Set<string>): void {
  localStorage.setItem(
    GALLERY_STORAGE_KEYS.PINNED_ITEMS,
    JSON.stringify(Array.from(ids))
  );
}
