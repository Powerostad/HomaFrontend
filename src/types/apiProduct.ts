/**
 * API Product Types
 * TypeScript definitions for product data from the backend API
 *
 * Note: These types are separate from the existing frontend Product type
 * in types/product.ts which was designed for the mock data structure.
 * This file contains types that match the actual backend API responses.
 */

import { appConfig } from '@/config/appConfig';
import type { Product } from './product';

/** MinIO bucket name for path-style public CDN URLs. */
const PUBLIC_MEDIA_BUCKET = appConfig.publicMediaBucket;

// =============================================================================
// Backend Response Types
// =============================================================================

/**
 * Product as returned from Django backend
 * GET /api/products/
 * GET /api/products/{unique_link}/
 */
/**
 * Product variant as returned from backend
 */
export interface BackendProductVariant {
  id: number;
  width_cm: string | null;
  length_cm: string | null;
  height_cm: string | null;
  shape: string;
  label_fa: string;
  price: number | null;
  is_default: boolean;
}

/**
 * Public CDN URLs for the eagerly-generated product image variants.
 * Use `card` for grid/thumbnails, `detail` for product pages.
 */
export interface ProductImageUrls {
  card: string | null;
  detail: string | null;
  original: string | null;
}

export interface BackendProduct {
  id: number;
  name: string;
  category: string;
  category_display: string;
  price: number;
  image_path: string;
  image_version?: number;
  image_url: string;  // Full public CDN URL from backend (detail variant)
  image_urls?: ProductImageUrls;  // Variant URL map: { card, detail, original }
  unique_link: string;
  shop_name: string;
  shop_slug: string;
  description?: string;
  link?: string | null;
  extra_details?: Record<string, string | string[]> | null;
  variants?: BackendProductVariant[];
  // Legacy fields (may still be present on older endpoints)
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
  is_promoted?: boolean;
  created_at?: string;
}

/**
 * Paginated response wrapper from backend
 */
export interface PaginatedProductResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendProduct[];
}

// =============================================================================
// Frontend Types (Transformed)
// =============================================================================

/**
 * Product for frontend use (transformed from BackendProduct)
 */
/**
 * Transformed product variant for frontend use
 */
export interface ProductVariant {
  id: number;
  widthCm: string | null;
  lengthCm: string | null;
  heightCm: string | null;
  shape: string;
  labelFa: string;
  price: number | null;
  isDefault: boolean;
}

/**
 * Product for frontend use (transformed from BackendProduct)
 */
export interface APIProduct {
  id: string;
  name: string;
  category: string;
  categoryDisplay: string;
  price: number;
  imageUrl: string;
  imageUrls?: ProductImageUrls;
  imagePath: string;
  uniqueLink: string;
  shopName: string;
  shopSlug: string;
  description?: string;
  externalLink?: string;
  extraDetails?: Record<string, string | string[]> | null;
  variants?: ProductVariant[];
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
  isPromoted?: boolean;
  createdAt?: string;
}

// =============================================================================
// Query Parameters
// =============================================================================

/**
 * Parameters for product list query
 */
export interface ProductListParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  shop?: string;
  price_min?: number;
  price_max?: number;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
}

// =============================================================================
// Service Result Types
// =============================================================================

/**
 * Product list fetch result
 */
export interface ProductListResult {
  success: boolean;
  data?: {
    products: APIProduct[];
    totalCount: number;
    hasMore: boolean;
  };
  error?: string;
}

/**
 * Single product fetch result
 */
export interface ProductDetailResult {
  success: boolean;
  data?: APIProduct;
  error?: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get full URL for product image with optional resize parameters
 *
 * Product images are now served directly from the CDN. The backend returns a
 * fully-formed `image_url`, so prefer that. This helper is a passthrough-tolerant
 * fallback: a value that is already a full URL is returned unchanged; a bare
 * MinIO object path is turned into a public CDN URL.
 *
 * The `options` argument is accepted for backward compatibility but ignored —
 * resizing is done server-side via fixed variants (see ProductImageUrls).
 *
 * @param imagePath - A full image URL, or a bare object path ("products/uuid.jpg")
 * @returns Full URL to the image
 */
export function getProductImageUrl(
  imagePath: string,
  _options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  // Return empty string for missing image paths to allow fallback handling
  if (!imagePath || imagePath.trim() === '') {
    console.warn('[getProductImageUrl] Empty image_path provided');
    return '';
  }

  // Already a full URL (CDN or presigned) — never rewrite it.
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Bare object path → build a public CDN URL (path-style, bucket included).
  const base = appConfig.publicMediaBaseUrl.replace(/\/$/, '');
  return `${base}/${PUBLIC_MEDIA_BUCKET}/${imagePath}`;
}

/**
 * Transform BackendProduct to frontend APIProduct
 */
export function transformBackendProduct(backendProduct: BackendProduct): APIProduct {
  // Transform variants from backend format
  const variants = backendProduct.variants?.map(v => ({
    id: v.id,
    widthCm: v.width_cm,
    lengthCm: v.length_cm,
    heightCm: v.height_cm,
    shape: v.shape,
    labelFa: v.label_fa,
    price: v.price,
    isDefault: v.is_default,
  }));

  // Derive availableSizes from variants for backwards compatibility
  const availableSizes = variants && variants.length > 0
    ? variants.map(v => String(v.id))
    : backendProduct.available_sizes;
  const availableSizesDisplay = variants && variants.length > 0
    ? variants.map(v => v.labelFa)
    : backendProduct.available_sizes_display;

  return {
    id: String(backendProduct.id),
    name: backendProduct.name,
    category: backendProduct.category,
    categoryDisplay: backendProduct.category_display,
    price: backendProduct.price,
    // Prefer the fully-formed CDN URL from the backend; fall back to building
    // one from the bare object path for older responses.
    imageUrl: backendProduct.image_url || getProductImageUrl(backendProduct.image_path),
    imageUrls: backendProduct.image_urls,
    imagePath: backendProduct.image_path,
    uniqueLink: backendProduct.unique_link,
    shopName: backendProduct.shop_name,
    shopSlug: backendProduct.shop_slug,
    description: backendProduct.description,
    externalLink: backendProduct.link || undefined,
    extraDetails: backendProduct.extra_details,
    variants,
    availableSizes,
    availableSizesDisplay,
    sizePrices: backendProduct.size_prices,
    sizePricesDisplay: backendProduct.size_prices_display?.map(sp => ({
      code: sp.code,
      display: sp.display,
      price: sp.price,
      hasSpecificPrice: sp.has_specific_price,
    })),
    priceRange: backendProduct.price_range,
    isPromoted: backendProduct.is_promoted,
    createdAt: backendProduct.created_at,
  };
}

// Note: Use formatPriceFromRial() from '@/utils/formatters' for price formatting
// It handles Rial→Toman conversion and Persian digit formatting

/**
 * Convert APIProduct to frontend Product type
 * Used when loading products from API into contexts that expect the Product type
 *
 * Key conversion: imageUrl (string) → images (string[])
 */
export function apiProductToProduct(apiProduct: APIProduct): Product {
  return {
    id: apiProduct.uniqueLink,
    name: apiProduct.name,
    price: apiProduct.price,
    category: apiProduct.categoryDisplay,
    images: [apiProduct.imageUrl],  // Convert single imageUrl to images array
    thumbnail: apiProduct.imageUrl,
    brand: apiProduct.shopName,
    description: apiProduct.description,
    currency: 'تومان',
    status: 'active',
    seller: {
      name: apiProduct.shopName,
      verified: true,
    },
    shopSlug: apiProduct.shopSlug,
    extraDetails: apiProduct.extraDetails,
    availableSizes: apiProduct.availableSizes,
    availableSizesDisplay: apiProduct.availableSizesDisplay,
    sizePrices: apiProduct.sizePrices,
    sizePricesDisplay: apiProduct.sizePricesDisplay,
    priceRange: apiProduct.priceRange ?? undefined,
    externalLink: apiProduct.externalLink,
  };
}
