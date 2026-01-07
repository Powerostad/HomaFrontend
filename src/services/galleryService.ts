/**
 * Gallery Service - گالری کاربر
 * مدیریت دریافت و نمایش نتایج Try-On کاربر
 */

import { apiGet } from '@/utils/apiClient';
import {
  type BackendGalleryItem,
  type GalleryFetchResult,
  type GalleryItemResult,
  transformBackendGalleryItem,
  getPinnedItemIds,
  savePinnedItemIds,
  getImageUrl,
} from '@/types/gallery';

// =============================================================================
// Gallery API
// =============================================================================

/**
 * Fetch user's gallery (all visualization results)
 * GET /api/users/gallery/
 */
export async function fetchGallery(): Promise<GalleryFetchResult> {
  const response = await apiGet<BackendGalleryItem[]>('/users/gallery/');

  if (response.success && response.data) {
    // Get pinned items from localStorage
    const pinnedIds = getPinnedItemIds();

    // Transform backend items to frontend format
    const items = response.data.map((item) =>
      transformBackendGalleryItem(item, pinnedIds)
    );

    return {
      success: true,
      data: items,
    };
  }

  return {
    success: false,
    error: response.error || 'خطا در دریافت گالری',
  };
}

/**
 * Get a single gallery item by ID
 * Note: We fetch from the gallery and filter client-side for now
 * A dedicated endpoint would be more efficient
 */
export async function fetchGalleryItem(id: string): Promise<GalleryItemResult> {
  const result = await fetchGallery();

  if (result.success && result.data) {
    const item = result.data.find((i) => i.id === id);

    if (item) {
      return {
        success: true,
        data: item,
      };
    }

    return {
      success: false,
      error: 'آیتم مورد نظر یافت نشد',
    };
  }

  return {
    success: false,
    error: result.error || 'خطا در دریافت اطلاعات',
  };
}

// =============================================================================
// Local State Management (Pin functionality)
// =============================================================================

/**
 * Toggle pin status for an item
 * Saves to localStorage
 */
export function togglePinItem(id: string): boolean {
  const pinnedIds = getPinnedItemIds();
  const isNowPinned = !pinnedIds.has(id);

  if (isNowPinned) {
    pinnedIds.add(id);
  } else {
    pinnedIds.delete(id);
  }

  savePinnedItemIds(pinnedIds);
  return isNowPinned;
}

/**
 * Check if an item is pinned
 */
export function isItemPinned(id: string): boolean {
  const pinnedIds = getPinnedItemIds();
  return pinnedIds.has(id);
}

/**
 * Get all pinned item IDs
 */
export function getAllPinnedIds(): string[] {
  return Array.from(getPinnedItemIds());
}

// =============================================================================
// Image URL Helpers
// =============================================================================

/**
 * Get full image URL with optional width for responsive images
 */
export { getImageUrl };

/**
 * Get thumbnail URL (optimized for grid display)
 */
export function getThumbnailUrl(path: string): string {
  return getImageUrl(path, 400); // 400px width for thumbnails
}

/**
 * Get full resolution URL (for detail view)
 */
export function getFullImageUrl(path: string): string {
  return getImageUrl(path, 1200); // 1200px width for full view
}

// =============================================================================
// Gallery Service Object (for backwards compatibility)
// =============================================================================

export const galleryService = {
  // API operations
  fetchGallery,
  fetchGalleryItem,

  // Pin management
  togglePinItem,
  isItemPinned,
  getAllPinnedIds,

  // Image URLs
  getImageUrl,
  getThumbnailUrl,
  getFullImageUrl,
};

export default galleryService;
