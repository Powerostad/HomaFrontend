/**
 * Shared Service - اشتراک‌گذاری
 * Public API for fetching shared gallery items (no auth required)
 */

import { apiGet } from '@/utils/apiClient';
import { normalizeImageUrl } from '@/services/studioService';
import type {
  SharedItem,
  SharedStudioItem,
  SharedStudioCategoryItem,
} from '@/types/shared';

/**
 * Normalize all image URLs in a shared item to use the frontend API host.
 * Backend returns CDN_BASE_URL which may differ from the frontend's API host.
 */
function normalizeSharedItem(item: SharedItem): SharedItem {
  if (item.type === 'tryon') {
    return {
      ...item,
      result_image_url: normalizeImageUrl(item.result_image_url) ?? item.result_image_url,
      product_image_url: normalizeImageUrl(item.product_image_url) ?? item.product_image_url,
    };
  }

  // Studio type
  const studioItem = item as SharedStudioItem;
  return {
    ...studioItem,
    result_image_url: normalizeImageUrl(studioItem.result_image_url) ?? studioItem.result_image_url,
    items: studioItem.items.map((catItem: SharedStudioCategoryItem) => ({
      ...catItem,
      products: catItem.products.map((p) => ({
        ...p,
        image_url: normalizeImageUrl(p.image_url) ?? p.image_url,
      })),
    })),
  };
}

/**
 * Fetch a shared gallery item by token (public, no auth)
 * GET /api/shared/{token}/
 */
export async function fetchSharedItem(
  token: string
): Promise<{ success: boolean; data?: SharedItem; error?: string }> {
  const response = await apiGet<SharedItem>(`/shared/${token}/`, undefined, {
    skipAuth: true,
  });

  if (response.success && response.data) {
    return {
      success: true,
      data: normalizeSharedItem(response.data),
    };
  }

  return {
    success: false,
    error: response.error || 'این لینک معتبر نیست',
  };
}
