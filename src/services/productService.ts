/**
 * Product Service
 * API integration for product catalog data
 */

import { apiGet, type RequestOptions } from '@/utils/apiClient';
import {
  type BackendProduct,
  type ProductListParams,
  type ProductListResult,
  type ProductDetailResult,
  type PaginatedProductResponse,
  transformBackendProduct,
} from '@/types/apiProduct';

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch list of products with optional filters, pagination, and sorting
 * GET /products/
 *
 * @example
 * // Get all products
 * fetchProducts()
 *
 * // Get products with filters
 * fetchProducts({
 *   category: 'furniture',
 *   price_min: 1000000,
 *   price_max: 5000000,
 *   sort: 'price_asc'
 * })
 */
export async function fetchProducts(
  params?: ProductListParams,
  options?: Pick<RequestOptions, 'signal'>
): Promise<ProductListResult> {
  const queryParams: Record<string, unknown> = {};

  if (params?.page) queryParams.page = params.page;
  if (params?.page_size) queryParams.page_size = params.page_size;
  if (params?.search) queryParams.search = params.search;
  if (params?.category) queryParams.category = params.category;
  if (params?.shop) queryParams.shop = params.shop;
  if (params?.price_min) queryParams.price_min = params.price_min;
  if (params?.price_max) queryParams.price_max = params.price_max;
  if (params?.sort) queryParams.sort = params.sort;

  const response = await apiGet<PaginatedProductResponse>('/products/', queryParams, {
    skipAuth: true, // Public endpoint
    ...options,
  });

  if (response.success && response.data) {
    const paginatedData = response.data;
    const products = paginatedData.results.map(transformBackendProduct);

    return {
      success: true,
      data: {
        products,
        totalCount: paginatedData.count,
        hasMore: paginatedData.next !== null,
      },
    };
  }

  return {
    success: false,
    error: response.error || 'خطا در دریافت لیست محصولات',
  };
}

/**
 * Fetch a single product by its unique link
 * GET /products/{unique_link}/
 *
 * @param uniqueLink - The product's unique identifier (UUID format)
 * @param options - Request options including signal for cancellation
 */
export async function fetchProduct(
  uniqueLink: string,
  options?: Pick<RequestOptions, 'signal'>
): Promise<ProductDetailResult> {
  const response = await apiGet<BackendProduct>(`/products/${uniqueLink}/`, undefined, {
    skipAuth: true, // Public endpoint
    ...options,
  });

  if (response.success && response.data) {
    return {
      success: true,
      data: transformBackendProduct(response.data),
    };
  }

  return {
    success: false,
    error: response.error || 'محصول یافت نشد',
  };
}

/**
 * Fetch products for a specific shop
 * Convenience wrapper around fetchProducts with shop filter
 *
 * @param shopName - The shop name to filter by
 * @param params - Additional filter parameters
 * @param options - Request options including signal for cancellation
 */
export async function fetchProductsByShop(
  shopName: string,
  params?: Omit<ProductListParams, 'shop'>,
  options?: Pick<RequestOptions, 'signal'>
): Promise<ProductListResult> {
  return fetchProducts({
    ...params,
    shop: shopName,
  }, options);
}

/**
 * Fetch products by category
 * Convenience wrapper around fetchProducts with category filter
 *
 * @param category - The category to filter by
 * @param params - Additional filter parameters
 */
export async function fetchProductsByCategory(
  category: string,
  params?: Omit<ProductListParams, 'category'>
): Promise<ProductListResult> {
  return fetchProducts({
    ...params,
    category,
  });
}

// =============================================================================
// Service Export (for backwards compatibility)
// =============================================================================

export const productService = {
  fetchProducts,
  fetchProduct,
  fetchProductsByShop,
  fetchProductsByCategory,
};
