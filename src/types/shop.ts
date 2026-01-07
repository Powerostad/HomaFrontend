/**
 * Shop Types
 * TypeScript definitions for shop/store data
 */

// =============================================================================
// Backend Response Types
// =============================================================================

/**
 * Shop as returned from Django backend
 * GET /api/shops/list/
 */
export interface BackendShop {
  id: number;
  shop_name: string;
  slug: string;  // URL-friendly identifier for routing
  logo_url: string | null;
  website: string | null;
  product_count: number;
  is_promoted: boolean;
  created_at: string;
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
 * Shop list API response
 */
export type ShopListResponse = PaginatedResponse<BackendShop>;

// =============================================================================
// Frontend Types
// =============================================================================

/**
 * Shop for frontend use (transformed from BackendShop)
 */
export interface Shop {
  id: string;
  name: string;
  username: string;  // slug from backend - used for URL routing
  logoUrl: string | null;
  website: string | null;
  productCount: number;
  isPromoted: boolean;
  createdAt: string;
}

// =============================================================================
// Query Parameters
// =============================================================================

/**
 * Parameters for shop list query
 */
export interface ShopListParams {
  page?: number;
  page_size?: number;
  search?: string;
}

// =============================================================================
// Service Result Types
// =============================================================================

/**
 * Shop list fetch result
 */
export interface ShopListResult {
  success: boolean;
  data?: {
    shops: Shop[];
    totalCount: number;
    hasMore: boolean;
  };
  error?: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Transform BackendShop to frontend Shop
 */
export function transformBackendShop(backendShop: BackendShop): Shop {
  return {
    id: String(backendShop.id),
    name: backendShop.shop_name,
    username: backendShop.slug,  // URL-friendly identifier for routing
    logoUrl: backendShop.logo_url,
    website: backendShop.website,
    productCount: backendShop.product_count,
    isPromoted: backendShop.is_promoted,
    createdAt: backendShop.created_at,
  };
}
