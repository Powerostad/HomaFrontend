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
  id: string;
  type: 'tryon' | 'studio';
  product_id: number | null;
  product_name: string | null;
  product_category: string;
  product_image_path: string | null;
  customer_image_path: string;
  result_image_path: string;
  score: 1 | 2 | 3 | null; // 1=Good, 2=Neutral, 3=Bad
  created_at: string;
  claimed_at: string | null;
  share_token?: string | null;
}

/**
 * Paginated response wrapper from backend
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Gallery API response wrapper
 */
export interface GalleryAPIResponse {
  success: boolean;
  message?: string;
  data: PaginatedResponse<BackendGalleryItem>;
}

// =============================================================================
// Frontend Types
// =============================================================================

/**
 * Gallery item for frontend use (transformed from BackendGalleryItem)
 */
export interface GalleryItem {
  id: string;
  type: 'tryon' | 'studio';
  productId: string | null;
  productName: string | null;
  productCategory: string;
  productImageUrl: string | null;
  customerImageUrl: string;
  resultImageUrl: string;
  score: 1 | 2 | 3 | null;
  createdAt: string;
  claimedAt: string | null;
  shareToken: string | null;
  // Local-only state (not from API)
  isPinned: boolean;
}

/**
 * Result card display props (used by ResultCard component)
 * Maps from GalleryItem to the format expected by the UI
 */
export interface ResultCardData {
  id: string;
  type: 'tryon' | 'studio';
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
export interface GalleryFetchResult extends GalleryServiceResult<GalleryItem[]> {
  hasMore?: boolean;
  totalCount?: number;
}

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
    type: backendItem.type,
    productId: backendItem.product_id != null ? String(backendItem.product_id) : null,
    productName: backendItem.product_name,
    productCategory: backendItem.product_category,
    productImageUrl: backendItem.product_image_path ? getImageUrl(backendItem.product_image_path) : null,
    customerImageUrl: getImageUrl(backendItem.customer_image_path),
    resultImageUrl: getImageUrl(backendItem.result_image_path),
    score: backendItem.score,
    createdAt: backendItem.created_at,
    claimedAt: backendItem.claimed_at,
    shareToken: backendItem.share_token ?? null,
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
    type: item.type,
    coverImage: item.resultImageUrl,
    productName: item.productName ?? (item.type === 'studio' ? 'طراحی استودیو' : ''),
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
