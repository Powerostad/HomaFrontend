/**
 * API Services برای HOMA Platform
 * سرویس‌های مختلف برای ارتباط با Backend
 */

import { apiGet, apiPost, apiUpload, type APIResponse } from './apiClient';
import type { Product } from '../types/product';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Product API Types
 */
export interface GetProductRequest {
  productId: string;
}

export interface GetProductResponse {
  product: Product;
}

export interface ListProductsRequest {
  category?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface ListProductsResponse {
  products: Product[];
  total: number;
  hasMore: boolean;
}

/**
 * Image Processing API Types
 */
export interface ProcessImageRequest {
  imageFile: File;
  productId: string;
  userId?: string;
  sessionId?: string;
  variantId?: string;
}

export interface ProcessImageResponse {
  success: boolean;
  visualizationId: string;
  visualizedImageUrl: string;
  originalImageUrl: string;
  processingTime: number;
  confidence: number;
  metadata?: {
    detectedRoom?: string;
    lighting?: string;
    angle?: string;
  };
}

/**
 * Upload API Types
 */
export interface UploadImageRequest {
  file: File;
  productId: string;
  sessionId?: string;
}

export interface UploadImageResponse {
  imageUrl: string;
  imageId: string;
  thumbnailUrl?: string;
}

/**
 * Visualization API Types
 */
export interface SaveVisualizationRequest {
  productId: string;
  originalImageUrl: string;
  visualizedImageUrl: string;
  userId?: string;
  sessionId?: string;
  variantId?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
}

export interface SaveVisualizationResponse {
  visualizationId: string;
  shareUrl?: string;
}

/**
 * Analytics API Types
 */
export interface TrackEventRequest {
  eventType: string;
  productId?: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}

export interface GetAnalyticsRequest {
  startDate?: string;
  endDate?: string;
  productId?: string;
  eventType?: string;
}

export interface GetAnalyticsResponse {
  events: Array<{
    eventType: string;
    count: number;
    timestamp: string;
  }>;
  metrics: {
    totalViews: number;
    totalUploads: number;
    totalConversions: number;
    conversionRate: number;
  };
}

/**
 * Feedback API Types
 */
export interface SubmitFeedbackRequest {
  visualizationId: string;
  rating: number;
  feedback?: string;
  wouldRecommend?: boolean;
  sessionId?: string;
}

export interface SubmitFeedbackResponse {
  feedbackId: string;
}

// ============================================================================
// PRODUCT SERVICES
// ============================================================================

/**
 * دریافت اطلاعات یک محصول
 */
export async function getProduct(
  request: GetProductRequest
): Promise<APIResponse<GetProductResponse>> {
  return apiGet<GetProductResponse>('/products/:id', {
    id: request.productId,
  });
}

/**
 * دریافت لیست محصولات
 */
export async function listProducts(
  request?: ListProductsRequest
): Promise<APIResponse<ListProductsResponse>> {
  return apiGet<ListProductsResponse>('/products', {
    category: request?.category,
    tags: request?.tags?.join(','),
    limit: request?.limit || 20,
    offset: request?.offset || 0,
  });
}

/**
 * جستجوی محصولات
 */
export async function searchProducts(
  query: string,
  limit = 10
): Promise<APIResponse<ListProductsResponse>> {
  return apiGet<ListProductsResponse>('/products/search', {
    q: query,
    limit,
  });
}

// ============================================================================
// IMAGE UPLOAD SERVICES
// ============================================================================

/**
 * آپلود تصویر اتاق
 */
export async function uploadRoomImage(
  request: UploadImageRequest,
  onProgress?: (progress: number) => void
): Promise<APIResponse<UploadImageResponse>> {
  return apiUpload<UploadImageResponse>(
    '/images/upload',
    request.file,
    {
      productId: request.productId,
      sessionId: request.sessionId,
      type: 'room',
    },
    onProgress
  );
}

// ============================================================================
// AI PROCESSING SERVICES
// ============================================================================

/**
 * پردازش تصویر با AI و جایگذاری محصول
 */
export async function processImage(
  request: ProcessImageRequest
): Promise<APIResponse<ProcessImageResponse>> {
  // ابتدا تصویر را آپلود می‌کنیم
  const uploadResponse = await uploadRoomImage({
    file: request.imageFile,
    productId: request.productId,
    sessionId: request.sessionId,
  });

  if (!uploadResponse.success || !uploadResponse.data) {
    return {
      success: false,
      error: uploadResponse.error || 'خطا در آپلود تصویر',
    };
  }

  // سپس درخواست پردازش می‌دهیم
  return apiPost<ProcessImageResponse>('/ai/process', {
    imageId: uploadResponse.data.imageId,
    imageUrl: uploadResponse.data.imageUrl,
    productId: request.productId,
    variantId: request.variantId,
    userId: request.userId,
    sessionId: request.sessionId,
  });
}

/**
 * دریافت وضعیت پردازش
 */
export async function getProcessingStatus(
  jobId: string
): Promise<APIResponse<{ status: 'pending' | 'processing' | 'completed' | 'failed'; progress: number }>> {
  return apiGet(`/ai/status/${jobId}`);
}

// ============================================================================
// VISUALIZATION SERVICES
// ============================================================================

/**
 * ذخیره visualization و دریافت لینک اشتراک‌گذاری
 */
export async function saveVisualization(
  request: SaveVisualizationRequest
): Promise<APIResponse<SaveVisualizationResponse>> {
  return apiPost<SaveVisualizationResponse>('/visualizations', {
    productId: request.productId,
    originalImageUrl: request.originalImageUrl,
    visualizedImageUrl: request.visualizedImageUrl,
    userId: request.userId,
    sessionId: request.sessionId,
    variantId: request.variantId,
    utm: request.utm,
  });
}

/**
 * دریافت یک visualization
 */
export async function getVisualization(
  visualizationId: string
): Promise<APIResponse<SaveVisualizationRequest & { createdAt: string }>> {
  return apiGet(`/visualizations/${visualizationId}`);
}

/**
 * دریافت لیست visualizations کاربر
 */
export async function getUserVisualizations(
  userId: string,
  limit = 10
): Promise<APIResponse<{ visualizations: Array<any> }>> {
  return apiGet('/visualizations/user/:userId', {
    userId,
    limit,
  });
}

// ============================================================================
// ANALYTICS SERVICES
// ============================================================================

/**
 * ثبت یک event
 */
export async function trackEvent(
  request: TrackEventRequest
): Promise<APIResponse<{ eventId: string }>> {
  return apiPost<{ eventId: string }>('/analytics/events', {
    eventType: request.eventType,
    productId: request.productId,
    sessionId: request.sessionId,
    userId: request.userId,
    metadata: request.metadata,
    utm: request.utm,
    timestamp: new Date().toISOString(),
  });
}

/**
 * دریافت آمار و analytics
 */
export async function getAnalytics(
  request?: GetAnalyticsRequest
): Promise<APIResponse<GetAnalyticsResponse>> {
  return apiGet<GetAnalyticsResponse>('/analytics', {
    startDate: request?.startDate,
    endDate: request?.endDate,
    productId: request?.productId,
    eventType: request?.eventType,
  });
}

/**
 * دریافت KPIs
 */
export async function getKPIs(): Promise<
  APIResponse<{
    uploadRate: number;
    conversionRate: number;
    avgProcessingTime: number;
    totalVisualizations: number;
  }>
> {
  return apiGet('/analytics/kpis');
}

// ============================================================================
// FEEDBACK SERVICES
// ============================================================================

/**
 * ارسال نظر و امتیاز
 */
export async function submitFeedback(
  request: SubmitFeedbackRequest
): Promise<APIResponse<SubmitFeedbackResponse>> {
  return apiPost<SubmitFeedbackResponse>('/feedback', {
    visualizationId: request.visualizationId,
    rating: request.rating,
    feedback: request.feedback,
    wouldRecommend: request.wouldRecommend,
    sessionId: request.sessionId,
  });
}

// ============================================================================
// USER SERVICES
// ============================================================================

/**
 * ثبت یا به‌روزرسانی session
 */
export async function updateSession(
  sessionId: string,
  data: {
    productId?: string;
    utm?: Record<string, string>;
    lastActivity?: string;
  }
): Promise<APIResponse<{ sessionId: string }>> {
  return apiPost(`/sessions/${sessionId}`, data);
}

/**
 * دریافت اطلاعات session
 */
export async function getSession(
  sessionId: string
): Promise<APIResponse<{ session: any }>> {
  return apiGet(`/sessions/${sessionId}`);
}
