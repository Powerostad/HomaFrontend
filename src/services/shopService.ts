/**
 * Shop Service
 * API integration for shop/store data
 */

import { apiGet, type RequestOptions } from '@/utils/apiClient';
import {
  type BackendShop,
  type Shop,
  type ShopListParams,
  type ShopListResult,
  type PaginatedResponse,
  transformBackendShop,
} from '@/types/shop';

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch list of active shops with optional pagination and search
 * GET /shops/list/
 */
export async function fetchShops(
  params?: ShopListParams,
  options?: Pick<RequestOptions, 'signal'>
): Promise<ShopListResult> {
  const queryParams: Record<string, unknown> = {};

  if (params?.page) queryParams.page = params.page;
  if (params?.page_size) queryParams.page_size = params.page_size;
  if (params?.search) queryParams.search = params.search;

  const response = await apiGet<PaginatedResponse<BackendShop>>('/shops/list/', queryParams, {
    skipAuth: true, // Public endpoint
    ...options,
  });

  if (response.success && response.data) {
    const paginatedData = response.data;
    const shops = paginatedData.results.map(transformBackendShop);

    return {
      success: true,
      data: {
        shops,
        totalCount: paginatedData.count,
        hasMore: paginatedData.next !== null,
      },
    };
  }

  return {
    success: false,
    error: response.error || 'خطا در دریافت لیست فروشگاه‌ها',
  };
}

/**
 * Fetch a single shop by username/slug (for store page)
 * Currently uses list endpoint with search - can be optimized if backend adds single shop endpoint
 */
export async function fetchShopByUsername(
  username: string,
  options?: Pick<RequestOptions, 'signal'>
): Promise<{
  success: boolean;
  data?: Shop;
  error?: string;
}> {
  const result = await fetchShops({ search: username, page_size: 10 }, options);

  if (result.success && result.data && result.data.shops.length > 0) {
    // Find exact match by username (case-insensitive for URL slugs)
    const normalizedUsername = username.toLowerCase();
    const shop = result.data.shops.find(
      (s) => s.username.toLowerCase() === normalizedUsername
    );
    if (shop) {
      return { success: true, data: shop };
    }
  }

  return {
    success: false,
    error: 'فروشگاه یافت نشد',
  };
}

// =============================================================================
// Service Export (for backwards compatibility)
// =============================================================================

export const shopService = {
  fetchShops,
  fetchShopByUsername,
};
