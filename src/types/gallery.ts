/**
 * Gallery Types
 * TypeScript definitions for user gallery (visualization results)
 */

import { apiConfig } from '@/utils/apiClient';
import { normalizeImageUrl } from '@/services/studioService';

// =============================================================================
// Backend Response Types
// =============================================================================

/**
 * Matched product in a studio gallery item (from ProductListSerializer + extras)
 * Same structure as APIMatchedProduct in studioService.ts
 */
export interface BackendGalleryStudioProduct {
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
  is_promoted?: boolean;
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
 * A category item in a studio gallery detail response
 */
export interface BackendGalleryStudioItem {
  item_type: string;
  category: string;
  category_display: string;
  fit_reasoning_fa: string;
  recommended_size?: string;
  quantity?: number;
  placement?: string;
  products: BackendGalleryStudioProduct[];
}

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
  // Fully-formed URLs from backend: product = public CDN, customer/result = presigned.
  product_image_url?: string | null;
  customer_image_url?: string | null;
  result_image_url?: string | null;
  score: 1 | 2 | 3 | null; // 1=Good, 2=Neutral, 3=Bad
  created_at: string;
  claimed_at: string | null;
  share_token?: string | null;
  // Studio detail only: matched products grouped by category
  items?: BackendGalleryStudioItem[];
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
 * Frontend matched product for studio gallery items (camelCase)
 */
export interface GalleryStudioProduct {
  id: number;
  name: string;
  imageUrl: string;
  matchScore: number;
  price: number;
  category?: string;
  categoryDisplay?: string;
  shopName?: string;
  shopSlug?: string;
  uniqueLink?: string;
  isPromoted?: boolean;
  persianReason?: string;
  matchHighlights?: string[];
  description?: string;
  extraDetails?: Record<string, unknown>;
  link?: string;
  availableSizes?: string[];
  availableSizesDisplay?: string[];
  sizePrices?: Record<string, number> | null;
  sizePricesDisplay?: Array<{
    code: string;
    display: string;
    price: number | null;
    hasSpecificPrice: boolean;
  }>;
  priceRange?: { min: number; max: number } | null;
}

/**
 * Frontend category item for studio gallery items (camelCase)
 */
export interface GalleryStudioCategoryItem {
  itemType: string;
  category: string;
  categoryDisplay: string;
  fitReasoningFa: string;
  recommendedSize: string;
  quantity: number;
  placement: string;
  products: GalleryStudioProduct[];
}

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
  // Studio detail only: matched products grouped by category
  studioItems?: GalleryStudioCategoryItem[];
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
 * Resolve a gallery image URL.
 *
 * The backend now returns fully-formed URLs (public CDN or presigned). This
 * helper is passthrough-tolerant: a full URL is returned verbatim — never
 * rewritten, since rewriting a presigned URL breaks its signature. A bare
 * object path (legacy responses) falls back to the deprecated Django route.
 *
 * The `width` argument is accepted for backward compatibility but ignored.
 */
export function getImageUrl(path: string, _width?: number): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${apiConfig.baseURL}/products/images/${path}`;
}

/**
 * Transform a backend studio product to frontend format
 */
function transformGalleryStudioProduct(
  p: BackendGalleryStudioProduct
): GalleryStudioProduct {
  return {
    id: p.id,
    name: p.name,
    imageUrl: normalizeImageUrl(p.image_url) || '',
    matchScore: p.match_score,
    price: p.price,
    category: p.category,
    categoryDisplay: p.category_display,
    shopName: p.shop_name,
    shopSlug: p.shop_slug,
    uniqueLink: p.unique_link,
    isPromoted: p.is_promoted ?? false,
    persianReason: p.persian_reason || '',
    matchHighlights: p.match_highlights || [],
    description: p.description || '',
    extraDetails: p.extra_details || {},
    link: p.link || '',
    availableSizes: p.available_sizes || [],
    availableSizesDisplay: p.available_sizes_display || [],
    sizePrices: p.size_prices,
    sizePricesDisplay: p.size_prices_display?.map(sp => ({
      code: sp.code,
      display: sp.display,
      price: sp.price,
      hasSpecificPrice: sp.has_specific_price,
    })),
    priceRange: p.price_range,
  };
}

/**
 * Transform a backend studio category item to frontend format
 */
function transformGalleryStudioItem(
  item: BackendGalleryStudioItem
): GalleryStudioCategoryItem {
  return {
    itemType: item.item_type,
    category: item.category,
    categoryDisplay: item.category_display,
    fitReasoningFa: item.fit_reasoning_fa,
    recommendedSize: item.recommended_size || '',
    quantity: item.quantity ?? 1,
    placement: item.placement || '',
    products: (item.products || []).map(transformGalleryStudioProduct),
  };
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
    // Prefer the fully-formed URLs from the backend; fall back to building from
    // the bare object path for older responses.
    productImageUrl: backendItem.product_image_url
      ?? (backendItem.product_image_path ? getImageUrl(backendItem.product_image_path) : null),
    customerImageUrl: backendItem.customer_image_url
      ?? getImageUrl(backendItem.customer_image_path),
    resultImageUrl: backendItem.result_image_url
      ?? getImageUrl(backendItem.result_image_path),
    score: backendItem.score,
    createdAt: backendItem.created_at,
    claimedAt: backendItem.claimed_at,
    shareToken: backendItem.share_token ?? null,
    isPinned: pinnedIds.has(id),
    studioItems: backendItem.items?.map(transformGalleryStudioItem),
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
