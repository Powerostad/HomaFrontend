/**
 * Visualization Service
 * API integration for AI-powered product visualization (Try-On)
 *
 * This service handles the core Try-On flow:
 * 1. Upload customer's room photo
 * 2. AI processes and generates visualization with product in space
 * 3. Return the result image URL
 */

import { apiUpload, apiConfig } from '@/utils/apiClient';

// =============================================================================
// Types
// =============================================================================

/**
 * Backend response for visualization processing
 * POST /products/{unique_link}/process/
 *
 * Note: The backend uses standard APIResponse format:
 * { success: true, message: "...", data: { image_path, image_id, ... } }
 * The apiUpload() function extracts data.data, so we receive the inner object directly.
 */
export interface VisualizationResponse {
  image_path: string;
  image_id: number;
  shop_credits_remaining?: number;
}

/**
 * Processing result for frontend use
 */
export interface ProcessingResult {
  success: boolean;
  data?: {
    imageUrl: string;
    imageId: number;
    imagePath: string;
  };
  error?: string;
}

/**
 * Processing status for UI updates
 */
export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get full URL for a processed result image
 *
 * @param imagePath - The image_path from backend (e.g., "processed/results/uuid.jpg")
 * @param options - Resize options
 * @returns Full URL to the result image (requires auth for processed images)
 */
export function getResultImageUrl(
  imagePath: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  const params = new URLSearchParams();

  if (options?.width) params.set('w', String(options.width));
  if (options?.height) params.set('h', String(options.height));
  if (options?.quality) params.set('q', String(options.quality));

  const base = `${apiConfig.baseURL}/products/images/${imagePath}`;
  const queryString = params.toString();

  return queryString ? `${base}?${queryString}` : base;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Process customer image with AI visualization
 *
 * Uploads the customer's room photo and generates a visualization
 * showing the product in their space.
 *
 * @param productUniqueLink - The product's unique identifier (UUID)
 * @param customerImage - The customer's room photo file
 * @param onProgress - Optional callback for upload progress (0-100)
 * @param selectedSize - Optional size code for rug products (e.g., "200x300")
 * @returns Processing result with image URL on success
 *
 * @example
 * const result = await processVisualization(
 *   'abc123-def456',
 *   roomPhotoFile,
 *   (progress) => setUploadProgress(progress),
 *   '200x300' // optional size for rugs
 * );
 *
 * if (result.success) {
 *   setResultImage(result.data.imageUrl);
 * }
 */
export async function processVisualization(
  productUniqueLink: string,
  customerImage: File,
  onProgress?: (progress: number) => void,
  selectedSize?: string
): Promise<ProcessingResult> {
  // Null check first - ensure file exists before accessing properties
  if (!customerImage) {
    console.error('[Visualization] No customer image provided');
    return {
      success: false,
      error: 'فایل تصویر انتخاب نشده است.',
    };
  }

  // Validate file before upload
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(customerImage.type)) {
    return {
      success: false,
      error: 'فرمت تصویر پشتیبانی نمی‌شود. لطفا تصویر JPG، PNG یا WebP آپلود کنید.',
    };
  }

  // Max 10MB
  const maxSize = 10 * 1024 * 1024;
  if (customerImage.size > maxSize) {
    return {
      success: false,
      error: 'حجم تصویر بیش از ۱۰ مگابایت است.',
    };
  }

  // Build additional form data with selected size (for rug products)
  const additionalData = selectedSize ? { selected_size: selectedSize } : undefined;

  console.log('[Visualization] Processing with size:', { selectedSize, additionalData });

  const response = await apiUpload<VisualizationResponse>(
    `/products/${productUniqueLink}/process/`,
    customerImage,
    'customer_image', // Backend expects this field name
    additionalData,
    onProgress
  );

  if (response.success && response.data) {
    const data = response.data;

    // Check for successful processing - image_path presence indicates success
    if (data.image_path) {
      return {
        success: true,
        data: {
          imageUrl: getResultImageUrl(data.image_path),
          imageId: data.image_id,
          imagePath: data.image_path,
        },
      };
    }

    // API returned but missing expected data
    return {
      success: false,
      error: 'خطا در پردازش تصویر - پاسخ نامعتبر از سرور',
    };
  }

  // Handle common errors with Persian messages
  let errorMessage = response.error || 'خطا در پردازش تصویر';

  // Check for rate limiting (429)
  if (response.statusCode === 429) {
    errorMessage = 'محدودیت تعداد درخواست. لطفا کمی صبر کنید و دوباره امتحان کنید.';
  }

  // Check for insufficient credits
  if (response.statusCode === 402) {
    errorMessage = 'اعتبار کافی برای پردازش وجود ندارد.';
  }

  return {
    success: false,
    error: errorMessage,
  };
}

// =============================================================================
// Service Export
// =============================================================================

export const visualizationService = {
  processVisualization,
  getResultImageUrl,
};
