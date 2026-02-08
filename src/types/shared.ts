/**
 * Shared Gallery Item Types
 * Types for publicly shared gallery items (no auth required)
 */

// =============================================================================
// Backend Response Types
// =============================================================================

/**
 * Shared try-on item from GET /api/shared/{token}/
 */
export interface SharedTryOnItem {
  type: 'tryon';
  result_image_url: string;
  product_name: string | null;
  product_category: string;
  product_id: number | null;
  product_image_url: string | null;
  product_price: number | null;
  product_unique_link: string | null;
  product_shop_name: string | null;
  product_shop_slug: string | null;
  owner_name: string;
  created_at: string;
}

/**
 * A product in a shared studio item
 */
export interface SharedStudioProduct {
  id: number;
  name: string;
  image_url: string;
  match_score: number;
  price: number;
  category?: string;
  category_display?: string;
  shop_name?: string;
  shop_slug?: string;
  unique_link?: string;
  persian_reason?: string;
  match_highlights?: string[];
  description?: string;
  extra_details?: Record<string, unknown>;
  link?: string;
  available_sizes?: string[];
  available_sizes_display?: string[];
  size_prices?: Record<string, number> | null;
  size_prices_display?: Array<{
    code: string;
    display: string;
    price: number | null;
    has_specific_price: boolean;
  }>;
  price_range?: { min: number; max: number } | null;
}

/**
 * A category item in a shared studio result
 */
export interface SharedStudioCategoryItem {
  item_type: string;
  category: string;
  category_display: string;
  fit_reasoning_fa: string;
  products: SharedStudioProduct[];
}

/**
 * Shared studio item from GET /api/shared/{token}/
 */
export interface SharedStudioItem {
  type: 'studio';
  result_image_url: string;
  room_type: string;
  owner_name: string;
  created_at: string;
  items: SharedStudioCategoryItem[];
}

/**
 * Union type for shared items
 */
export type SharedItem = SharedTryOnItem | SharedStudioItem;
