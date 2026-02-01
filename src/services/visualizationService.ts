/**
 * Visualization Service
 * API integration for AI-powered product visualization (Try-On)
 *
 * This service handles the core Try-On flow:
 * 1. Upload customer's room photo
 * 2. AI processes and generates visualization with product in space
 * 3. Return the result image URL
 *
 * Two-phase async flow:
 * 1. submitVisualizationTask() - Upload image, get task_id
 * 2. pollTaskStatus() - Poll until completed/failed
 */

import { apiUpload, apiGet, apiConfig, getStoredTokens } from '@/utils/apiClient';
import { convertHeicToJpeg } from '@/utils/imageConversion';

// =============================================================================
// Types
// =============================================================================

/**
 * Task status from backend
 */
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Backend response for task submission
 * POST /products/{unique_link}/process/
 */
export interface SubmitTaskResponse {
  task_id: string;
  status: TaskStatus;
}

/**
 * Backend response for task status polling
 * GET /products/tasks/{task_id}/status/
 */
export interface TaskStatusResponse {
  task_id: string;
  status: TaskStatus;
  created_at: string;
  started_at?: string;
  image_path?: string;
  image_id?: number;
  processing_time_ms?: number;
  error_code?: string;
  error_message?: string;
}

/**
 * Legacy: Backend response for synchronous processing
 * @deprecated Use SubmitTaskResponse instead
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
 * Submit a visualization task for async processing
 *
 * @param productUniqueLink - The product's unique identifier (UUID)
 * @param customerImage - The customer's room photo file
 * @param onProgress - Optional callback for upload progress (0-100)
 * @param selectedSize - Optional size code for rug products
 * @returns task_id for polling
 */
export async function submitVisualizationTask(
  productUniqueLink: string,
  customerImage: File,
  onProgress?: (progress: number) => void,
  selectedSize?: string
): Promise<{
  success: boolean;
  taskId?: string;
  error?: string;
}> {
  // Null check first - ensure file exists before accessing properties
  if (!customerImage) {
    console.error('[Visualization] No customer image provided');
    return {
      success: false,
      error: 'فایل تصویر انتخاب نشده است.',
    };
  }

  // Pre-flight auth check - ensure tokens exist before making API call
  const tokens = getStoredTokens();
  if (!tokens?.access) {
    console.error('[Visualization] No auth tokens available');
    return {
      success: false,
      error: 'لطفا ابتدا وارد حساب کاربری خود شوید.',
    };
  }

  // Convert HEIC to JPEG if needed (iPhone default format)
  const convertedImage = await convertHeicToJpeg(customerImage);

  // Validate file type after conversion
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(convertedImage.type)) {
    return {
      success: false,
      error: 'فرمت تصویر پشتیبانی نمی‌شود. لطفا تصویر JPG، PNG یا WebP آپلود کنید.',
    };
  }

  // Max 10MB
  const maxSize = 10 * 1024 * 1024;
  if (convertedImage.size > maxSize) {
    return {
      success: false,
      error: 'حجم تصویر بیش از ۱۰ مگابایت است.',
    };
  }

  // Build additional form data with selected size (for rug products)
  const additionalData = selectedSize ? { selected_size: selectedSize } : undefined;

  console.log('[Visualization] Submitting task with size:', { selectedSize, additionalData });

  const response = await apiUpload<SubmitTaskResponse>(
    `/products/${productUniqueLink}/process/`,
    convertedImage,
    'customer_image',
    additionalData,
    onProgress
  );

  if (response.success && response.data?.task_id) {
    console.log('[Visualization] Task submitted:', response.data.task_id);
    return {
      success: true,
      taskId: response.data.task_id,
    };
  }

  // Handle errors with Persian messages
  let errorMessage = response.error || 'خطا در ارسال درخواست پردازش';

  if (response.statusCode === 429) {
    errorMessage = 'محدودیت تعداد درخواست. لطفا کمی صبر کنید و دوباره امتحان کنید.';
  }
  if (response.statusCode === 402) {
    errorMessage = 'اعتبار کافی برای پردازش وجود ندارد.';
  }
  if (response.statusCode === 404) {
    errorMessage = 'محصول یافت نشد.';
  }

  return { success: false, error: errorMessage };
}

/**
 * Fetch current status of a processing task
 */
export async function fetchTaskStatus(taskId: string): Promise<{
  success: boolean;
  data?: TaskStatusResponse;
  error?: string;
}> {
  const response = await apiGet<TaskStatusResponse>(
    `/products/tasks/${taskId}/status/`
  );

  if (response.success && response.data) {
    return { success: true, data: response.data };
  }

  return { success: false, error: response.error || 'خطا در دریافت وضعیت' };
}

/**
 * Poll task status until completed or failed
 *
 * @param taskId - Task UUID
 * @param onStatusChange - Callback when status changes
 * @param maxAttempts - Max polling attempts (default: 150 = 5 minutes at 2s intervals)
 */
export async function pollTaskStatus(
  taskId: string,
  onStatusChange?: (status: TaskStatus) => void,
  maxAttempts: number = 150
): Promise<ProcessingResult> {
  let attempts = 0;
  let lastStatus: TaskStatus | null = null;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;

  const poll = async (): Promise<ProcessingResult> => {
    attempts++;

    if (attempts > maxAttempts) {
      console.error('[Visualization] Polling timeout');
      return {
        success: false,
        error: 'زمان انتظار برای پردازش به پایان رسید. لطفا دوباره امتحان کنید.',
      };
    }

    const result = await fetchTaskStatus(taskId);

    if (!result.success) {
      consecutiveErrors++;
      console.warn(`[Visualization] Poll error (${consecutiveErrors}/${maxConsecutiveErrors}):`, result.error);

      if (consecutiveErrors >= maxConsecutiveErrors) {
        return { success: false, error: result.error };
      }

      // Continue polling despite errors
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return poll();
    }

    // Reset error counter on success
    consecutiveErrors = 0;

    const task = result.data!;

    // Notify status change
    if (task.status !== lastStatus) {
      lastStatus = task.status;
      console.log('[Visualization] Task status:', task.status);
      onStatusChange?.(task.status);
    }

    // Terminal states
    if (task.status === 'completed') {
      return {
        success: true,
        data: {
          imageUrl: getResultImageUrl(task.image_path!),
          imageId: task.image_id!,
          imagePath: task.image_path!,
        },
      };
    }

    if (task.status === 'failed') {
      return {
        success: false,
        error: task.error_message || 'خطا در پردازش تصویر',
      };
    }

    // Continue polling - wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return poll();
  };

  return poll();
}

/**
 * Process customer image with AI visualization (combined submit + poll)
 *
 * Uploads the customer's room photo and generates a visualization
 * showing the product in their space.
 *
 * @param productUniqueLink - The product's unique identifier (UUID)
 * @param customerImage - The customer's room photo file
 * @param onProgress - Optional callback for upload progress (0-100)
 * @param selectedSize - Optional size code for rug products (e.g., "200x300")
 * @param onStatusChange - Optional callback for task status changes
 * @returns Processing result with image URL on success
 */
export async function processVisualization(
  productUniqueLink: string,
  customerImage: File,
  onProgress?: (progress: number) => void,
  selectedSize?: string,
  onStatusChange?: (status: TaskStatus) => void
): Promise<ProcessingResult> {
  // Phase 1: Submit task
  const submitResult = await submitVisualizationTask(
    productUniqueLink,
    customerImage,
    onProgress,
    selectedSize
  );

  if (!submitResult.success || !submitResult.taskId) {
    return { success: false, error: submitResult.error };
  }

  // Trigger status change for 'pending' -> 'processing' transition
  onStatusChange?.('pending');

  // Phase 2: Poll for completion
  return pollTaskStatus(submitResult.taskId, onStatusChange);
}

// =============================================================================
// Service Export
// =============================================================================

export const visualizationService = {
  submitVisualizationTask,
  fetchTaskStatus,
  pollTaskStatus,
  processVisualization,
  getResultImageUrl,
};
