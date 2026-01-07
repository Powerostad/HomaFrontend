/**
 * Social Gallery Service
 *
 * Handles gallery submission and product social proof features.
 * Users can submit their try-on results to a public gallery for social proof.
 */

import { apiGet, apiPost, translateErrorMessage } from '@/utils/apiClient';

// ============================================================================
// Types
// ============================================================================

/**
 * Gallery submission request
 */
export interface GallerySubmissionRequest {
  /** Session ID from redesign/studio flow */
  session_id?: string;
  /** Item ID within the session */
  item_id?: number;
  /** Processed image ID from try-on flow */
  image_id?: number;
}

/**
 * Gallery submission data (returned in response.data)
 */
export interface GallerySubmissionData {
  submission_id: string;
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * Public gallery item (approved submissions)
 */
export interface PublicGalleryItem {
  id: number;
  imageUrl: string;
  thumbnailUrl: string;
  productId: number;
  productName: string;
  submittedAt: string;
  likeCount: number;
}

/**
 * Backend response format for gallery items
 */
interface APIGalleryItem {
  id: number;
  image_url: string;
  thumbnail_url: string;
  product_id: number;
  product_name: string;
  submitted_at: string;
  like_count: number;
}

/**
 * Product gallery response
 */
export interface ProductGalleryResponse {
  count: number;
  items: PublicGalleryItem[];
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform API gallery item to frontend format
 */
function transformGalleryItem(item: APIGalleryItem): PublicGalleryItem {
  return {
    id: item.id,
    imageUrl: item.image_url,
    thumbnailUrl: item.thumbnail_url,
    productId: item.product_id,
    productName: item.product_name,
    submittedAt: item.submitted_at,
    likeCount: item.like_count,
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Submit a try-on result to the public gallery for moderation
 *
 * @param request - Submission details (session_id + item_id OR image_id)
 * @returns Submission result with status
 */
export async function submitToGallery(
  request: GallerySubmissionRequest
): Promise<{ success: boolean; submissionId?: string; status?: string; error?: string }> {
  try {
    const response = await apiPost<GallerySubmissionData>(
      '/recommendations/gallery/submit/',
      request
    );

    if (response.success && response.data) {
      return {
        success: true,
        submissionId: response.data.submission_id,
        status: response.data.status
      };
    }

    return { success: false, error: response.message || 'خطا در ارسال به گالری' };
  } catch (error: any) {
    console.error('[socialGalleryService] submitToGallery error:', error);
    return {
      success: false,
      error: translateErrorMessage(error?.message || 'خطا در ارسال به گالری')
    };
  }
}

/**
 * Fetch approved gallery images for a specific product
 *
 * @param productId - Product ID or unique_link
 * @param options - Pagination options
 * @returns List of approved gallery items
 */
export async function fetchProductGallery(
  productId: string | number,
  options?: { page?: number; pageSize?: number }
): Promise<{ success: boolean; data?: ProductGalleryResponse; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.pageSize) params.set('page_size', String(options.pageSize));

    const queryString = params.toString();
    const url = `/recommendations/gallery/product/${productId}/${queryString ? '?' + queryString : ''}`;

    // The API returns { success, data: { count, results } }
    // So we use this as the type for the data field
    interface GalleryListData {
      count: number;
      results: APIGalleryItem[];
    }

    const response = await apiGet<GalleryListData>(url);

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          count: response.data.count,
          items: response.data.results.map(transformGalleryItem),
        },
      };
    }

    return { success: false, error: 'خطا در دریافت گالری محصول' };
  } catch (error: any) {
    // 404 means no gallery items yet - not an error
    if (error?.status === 404) {
      return {
        success: true,
        data: { count: 0, items: [] },
      };
    }

    console.error('[socialGalleryService] fetchProductGallery error:', error);
    return {
      success: false,
      error: translateErrorMessage(error?.message || 'خطا در دریافت گالری محصول')
    };
  }
}

/**
 * Like a gallery submission (if authenticated)
 *
 * @param galleryItemId - Gallery item ID to like
 */
export async function likeGalleryItem(
  galleryItemId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await apiPost<{ success: boolean }>(`/recommendations/gallery/${galleryItemId}/like/`, {});
    return { success: response.success };
  } catch (error: any) {
    console.error('[socialGalleryService] likeGalleryItem error:', error);
    return {
      success: false,
      error: translateErrorMessage(error?.message || 'خطا در ثبت لایک')
    };
  }
}
