/**
 * Gallery Service - گالری کاربر
 * مدیریت دریافت و نمایش نتایج Try-On و استودیو کاربر
 */

import { apiGet, apiDelete } from '@/utils/apiClient';
import {
  type BackendGalleryItem,
  type PaginatedResponse,
  type GalleryFetchResult,
  type GalleryItemResult,
  transformBackendGalleryItem,
  getPinnedItemIds,
  savePinnedItemIds,
  getImageUrl,
} from '@/types/gallery';

// =============================================================================
// Types
// =============================================================================

export type GalleryTab = 'all' | 'tryon' | 'studio';

// =============================================================================
// Gallery API
// =============================================================================

/**
 * Fetch user's gallery (visualization results) with type filter and pagination
 * GET /api/users/gallery/?type=...&page=...&page_size=...
 */
export async function fetchGallery(
  type: GalleryTab = 'all',
  page: number = 1,
  pageSize: number = 10
): Promise<GalleryFetchResult> {
  const response = await apiGet<PaginatedResponse<BackendGalleryItem>>(
    `/users/gallery/?type=${type}&page=${page}&page_size=${pageSize}`
  );

  if (response.success && response.data) {
    // Get pinned items from localStorage
    const pinnedIds = getPinnedItemIds();

    // Transform backend items to frontend format
    const items = response.data.results.map((item) =>
      transformBackendGalleryItem(item, pinnedIds)
    );

    return {
      success: true,
      data: items,
      hasMore: response.data.next !== null,
      totalCount: response.data.count,
    };
  }

  return {
    success: false,
    error: response.error || 'خطا در دریافت گالری',
  };
}

/**
 * Get a single gallery item by ID
 * GET /api/users/gallery/{id}/
 */
export async function fetchGalleryItem(id: string): Promise<GalleryItemResult> {
  const response = await apiGet<BackendGalleryItem>(`/users/gallery/${id}/`);

  if (response.success && response.data) {
    const pinnedIds = getPinnedItemIds();
    const item = transformBackendGalleryItem(response.data, pinnedIds);

    return {
      success: true,
      data: item,
    };
  }

  return {
    success: false,
    error: response.error || 'آیتم مورد نظر یافت نشد',
  };
}

/**
 * Delete a gallery item (soft delete)
 * DELETE /api/users/gallery/{id}/?type=tryon|studio
 */
export async function deleteGalleryItem(
  id: string,
  type: 'tryon' | 'studio'
): Promise<{ success: boolean; error?: string }> {
  const response = await apiDelete(`/users/gallery/${id}/?type=${type}`);

  if (response.success) {
    return { success: true };
  }

  return {
    success: false,
    error: response.error || 'خطا در حذف آیتم',
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
  deleteGalleryItem,

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
