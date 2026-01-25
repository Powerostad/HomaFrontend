/**
 * Studio Service
 * API integration for AI-powered room redesign and product recommendations
 *
 * This service handles the Studio flow:
 * 1. Upload room photo → Create redesign session
 * 2. Poll session status until AI processing completes
 * 3. Display redesigned room image with matched product recommendations
 * 4. Try individual products on detected items
 */

import { apiGet, apiPost, apiUpload, apiDelete, apiConfig } from '@/utils/apiClient';

// =============================================================================
// Types - Backend Response Formats
// =============================================================================

/**
 * Session processing status
 * pending → analyzing → generating → matching → ready (or failed)
 */
export type SessionStatus =
  | 'pending'
  | 'analyzing'
  | 'generating'
  | 'matching'
  | 'ready'
  | 'failed';

/**
 * A product matched by AI for a detected item
 */
export interface APIMatchedProduct {
  id: number;
  name: string;
  image_url: string;
  match_score: number;
  price: number;
  category?: string;
  category_display?: string;
  shop_name?: string;
  unique_link?: string;
  is_promoted?: boolean;
  // Smart Redesign: Persian explanations for product recommendation
  persian_reason?: string;
  match_highlights?: string[];
  // Additional product details
  description?: string;
  extra_details?: Record<string, unknown>;
  link?: string;
  available_sizes?: string[];
  available_sizes_display?: string[];
}

/**
 * A detected item in the room (e.g., rug area, furniture spot)
 */
export interface APISessionItem {
  item_id: number;
  item_type: string; // e.g., 'rug', 'sofa', 'lamp'
  description?: Record<string, unknown>;
  matched_products: APIMatchedProduct[];
  tryon_status: 'pending' | 'processing' | 'completed' | 'failed';
  tryon_image_url: string | null;
}

/**
 * Full session data from backend
 * GET /recommendations/sessions/{session_id}/
 */
export interface APIRedesignSession {
  session_id: string;
  status: SessionStatus;
  room_type?: string;
  preferred_style?: string;
  room_image_url?: string;
  redesigned_image_url?: string;
  items: APISessionItem[];
  created_at: string;
  updated_at?: string;
  error_message?: string;
}

/**
 * Create session response
 * POST /recommendations/sessions/
 */
export interface CreateSessionResponse {
  session_id: string;
  status: SessionStatus;
}

/**
 * Session list response
 * GET /recommendations/sessions/list/
 */
export interface SessionListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: APIRedesignSession[];
}

/**
 * Try-on response for a specific item
 * POST /recommendations/sessions/{session_id}/items/{item_id}/tryon/
 */
export interface TryOnResponse {
  success: boolean;
  tryon_image_url?: string;
  message?: string;
}

// =============================================================================
// Frontend Types (transformed for UI use)
// =============================================================================

/**
 * Simplified session for list views
 */
export interface SessionListItem {
  id: string;
  status: SessionStatus;
  thumbnailUrl: string | null;
  createdAt: string;
  itemCount: number;
}

/**
 * Full session for detail/result views
 */
export interface RedesignSession {
  id: string;
  status: SessionStatus;
  roomImageUrl: string | null;
  redesignedImageUrl: string | null;
  items: SessionItem[];
  createdAt: string;
  errorMessage?: string;
}

/**
 * Session item with matched products
 */
export interface SessionItem {
  id: number;
  type: string;
  matchedProducts: MatchedProduct[];
  tryonStatus: 'pending' | 'processing' | 'completed' | 'failed';
  tryonImageUrl: string | null;
}

/**
 * Product recommendation
 */
export interface MatchedProduct {
  id: number;
  name: string;
  imageUrl: string;
  matchScore: number;
  price: number;
  category?: string;
  categoryDisplay?: string;
  shopName?: string;
  uniqueLink?: string;
  isPromoted?: boolean;
  // Smart Redesign: Persian explanations for product recommendation
  persianReason?: string;
  matchHighlights?: string[];
  // Additional product details
  description?: string;
  extraDetails?: Record<string, unknown>;
  link?: string;
  availableSizes?: string[];
  availableSizesDisplay?: string[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get full URL for session images (room or redesigned)
 *
 * Handles both relative paths and full URLs from backend:
 * - Relative paths: Constructs URL using frontend's apiConfig.baseURL
 * - Full URLs with /api/products/images/: Extracts path and uses frontend's apiConfig.baseURL
 *   (fixes port mismatch between backend CDN_BASE_URL and actual API server)
 */
export function getSessionImageUrl(
  imagePath: string | null | undefined,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string | null {
  if (!imagePath) return null;

  let path = imagePath;

  // If it's a full URL, extract the path portion after /api/products/images/
  // This fixes port mismatch when backend CDN_BASE_URL differs from actual API port
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    const imagePathMarker = '/api/products/images/';
    const markerIndex = imagePath.indexOf(imagePathMarker);
    if (markerIndex !== -1) {
      // Extract path after the marker (e.g., "products/20/uuid.jpg" or "sessions/redesign/uuid.jpg")
      path = imagePath.substring(markerIndex + imagePathMarker.length);
    } else {
      // Not an image serving URL - return as-is (e.g., external URLs)
      return imagePath;
    }
  }

  const params = new URLSearchParams();
  if (options?.width) params.set('w', String(options.width));
  if (options?.height) params.set('h', String(options.height));
  if (options?.quality) params.set('q', String(options.quality));

  const base = `${apiConfig.baseURL}/products/images/${path}`;
  const queryString = params.toString();

  return queryString ? `${base}?${queryString}` : base;
}

/**
 * Transform backend session to frontend format
 */
function transformSession(apiSession: APIRedesignSession): RedesignSession {
  return {
    id: apiSession.session_id,
    status: apiSession.status,
    roomImageUrl: getSessionImageUrl(apiSession.room_image_url),
    redesignedImageUrl: getSessionImageUrl(apiSession.redesigned_image_url),
    items: (apiSession.items || []).map(transformSessionItem),
    createdAt: apiSession.created_at,
    errorMessage: apiSession.error_message,
  };
}

/**
 * Transform backend session item to frontend format
 */
function transformSessionItem(apiItem: APISessionItem): SessionItem {
  return {
    id: apiItem.item_id,
    type: apiItem.item_type,
    matchedProducts: (apiItem.matched_products || []).map(transformMatchedProduct),
    tryonStatus: apiItem.tryon_status,
    tryonImageUrl: getSessionImageUrl(apiItem.tryon_image_url),
  };
}

/**
 * Transform backend matched product to frontend format
 */
function transformMatchedProduct(apiProduct: APIMatchedProduct): MatchedProduct {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    imageUrl: getSessionImageUrl(apiProduct.image_url) || '',
    matchScore: apiProduct.match_score,
    price: apiProduct.price,
    category: apiProduct.category,
    categoryDisplay: apiProduct.category_display,
    shopName: apiProduct.shop_name,
    uniqueLink: apiProduct.unique_link,
    isPromoted: apiProduct.is_promoted ?? false,
    // Smart Redesign: Persian explanations
    persianReason: apiProduct.persian_reason || '',
    matchHighlights: apiProduct.match_highlights || [],
    // Additional product details
    description: apiProduct.description || '',
    extraDetails: apiProduct.extra_details || {},
    link: apiProduct.link || '',
    availableSizes: apiProduct.available_sizes || [],
    availableSizesDisplay: apiProduct.available_sizes_display || [],
  };
}

/**
 * Transform session list response
 */
function transformSessionListItem(apiSession: APIRedesignSession): SessionListItem {
  return {
    id: apiSession.session_id,
    status: apiSession.status,
    thumbnailUrl: getSessionImageUrl(apiSession.redesigned_image_url || apiSession.room_image_url, {
      width: 400,
    }),
    createdAt: apiSession.created_at,
    itemCount: apiSession.items?.length || 0,
  };
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Create a new redesign session
 *
 * Uploads the room photo and starts AI processing.
 *
 * @param roomImage - The room photo file
 * @param options - Optional parameters (room type, style, etc.)
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Session ID and initial status
 *
 * @example
 * const result = await createRedesignSession(
 *   roomPhotoFile,
 *   { roomType: 'living_room', preferredStyle: 'modern' },
 *   (progress) => setUploadProgress(progress)
 * );
 *
 * if (result.success) {
 *   setSessionId(result.data.sessionId);
 * }
 */
export async function createRedesignSession(
  roomImage: File,
  options?: {
    roomType?: string;
    preferredStyle?: string;
    preferredColors?: string[];
    userNotes?: string;
  },
  onProgress?: (progress: number) => void
): Promise<{
  success: boolean;
  data?: { sessionId: string; status: SessionStatus };
  error?: string;
}> {
  // Validate file before upload
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(roomImage.type)) {
    return {
      success: false,
      error: 'فرمت تصویر پشتیبانی نمی‌شود. لطفا تصویر JPG، PNG یا WebP آپلود کنید.',
    };
  }

  // Max 10MB
  const maxSize = 10 * 1024 * 1024;
  if (roomImage.size > maxSize) {
    return {
      success: false,
      error: 'حجم تصویر بیش از ۱۰ مگابایت است.',
    };
  }

  // Build form data with optional parameters
  const additionalData: Record<string, string> = {};
  if (options?.roomType) additionalData['room_type'] = options.roomType;
  if (options?.preferredStyle) additionalData['preferred_style'] = options.preferredStyle;
  if (options?.preferredColors) additionalData['preferred_colors'] = JSON.stringify(options.preferredColors);
  if (options?.userNotes) additionalData['user_notes'] = options.userNotes;

  const response = await apiUpload<CreateSessionResponse>(
    '/recommendations/sessions/',
    roomImage,
    'room_image', // Backend expects this field name
    additionalData,
    onProgress
  );

  if (response.success && response.data) {
    return {
      success: true,
      data: {
        sessionId: response.data.session_id,
        status: response.data.status,
      },
    };
  }

  // Handle common errors with Persian messages
  let errorMessage = response.error || 'خطا در ایجاد جلسه طراحی';

  if (response.statusCode === 429) {
    errorMessage = 'محدودیت تعداد درخواست. لطفا کمی صبر کنید و دوباره امتحان کنید.';
  }

  if (response.statusCode === 402) {
    errorMessage = 'اعتبار کافی برای پردازش وجود ندارد.';
  }

  return {
    success: false,
    error: errorMessage,
  };
}

/**
 * Fetch session status and details
 *
 * @param sessionId - The session UUID
 * @returns Session data with current status
 */
export async function fetchSessionStatus(sessionId: string): Promise<{
  success: boolean;
  data?: RedesignSession;
  error?: string;
}> {
  const response = await apiGet<APIRedesignSession>(
    `/recommendations/sessions/${sessionId}/`
  );

  if (response.success && response.data) {
    return {
      success: true,
      data: transformSession(response.data),
    };
  }

  return {
    success: false,
    error: response.error || 'خطا در دریافت وضعیت جلسه',
  };
}

/**
 * Poll session status until ready or failed
 *
 * Polls every 2 seconds until status is 'ready' or 'failed'.
 *
 * @param sessionId - The session UUID
 * @param onStatusChange - Callback when status changes
 * @param maxAttempts - Maximum polling attempts (default: 150 = 5 minutes)
 * @returns Final session data
 *
 * @example
 * const session = await pollSessionStatus(
 *   sessionId,
 *   (status) => setCurrentPhase(status)
 * );
 */
export async function pollSessionStatus(
  sessionId: string,
  onStatusChange?: (status: SessionStatus) => void,
  maxAttempts: number = 150
): Promise<{
  success: boolean;
  data?: RedesignSession;
  error?: string;
}> {
  let attempts = 0;
  let lastStatus: SessionStatus | null = null;

  const poll = async (): Promise<{
    success: boolean;
    data?: RedesignSession;
    error?: string;
  }> => {
    attempts++;

    if (attempts > maxAttempts) {
      return {
        success: false,
        error: 'زمان انتظار برای پردازش به پایان رسید. لطفا دوباره امتحان کنید.',
      };
    }

    const result = await fetchSessionStatus(sessionId);

    if (!result.success) {
      return result;
    }

    const session = result.data!;

    // Notify status change
    if (session.status !== lastStatus) {
      lastStatus = session.status;
      onStatusChange?.(session.status);
    }

    // Terminal states
    if (session.status === 'ready') {
      return { success: true, data: session };
    }

    if (session.status === 'failed') {
      return {
        success: false,
        data: session,
        error: session.errorMessage || 'خطا در پردازش تصویر',
      };
    }

    // Continue polling - wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return poll();
  };

  return poll();
}

/**
 * Fetch user's session list
 *
 * @param params - Pagination parameters
 * @returns List of sessions
 */
export async function fetchUserSessions(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{
  success: boolean;
  data?: {
    sessions: SessionListItem[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', String(params.page));
  if (params?.pageSize) queryParams.set('page_size', String(params.pageSize));

  const url = `/recommendations/sessions/list/${queryParams.toString() ? '?' + queryParams : ''}`;
  const response = await apiGet<SessionListResponse>(url);

  if (response.success && response.data) {
    return {
      success: true,
      data: {
        sessions: response.data.results.map(transformSessionListItem),
        total: response.data.count,
        hasMore: response.data.next !== null,
      },
    };
  }

  return {
    success: false,
    error: response.error || 'خطا در دریافت لیست جلسات',
  };
}

/**
 * Try a product on a specific item in the session
 *
 * @param sessionId - The session UUID
 * @param itemId - The item ID within the session
 * @param productId - The product ID to try
 * @param selectedSize - Optional size selection (for rugs, etc.)
 * @returns Try-on result with image URL
 */
export async function tryProductOnItem(
  sessionId: string,
  itemId: number,
  productId: number,
  selectedSize?: string
): Promise<{
  success: boolean;
  data?: { tryonImageUrl: string };
  error?: string;
}> {
  const response = await apiPost<TryOnResponse>(
    `/recommendations/sessions/${sessionId}/items/${itemId}/tryon/`,
    {
      product_id: productId,
      ...(selectedSize && { selected_size: selectedSize }),
    }
  );

  if (response.success && response.data?.success && response.data?.tryon_image_url) {
    return {
      success: true,
      data: {
        tryonImageUrl: getSessionImageUrl(response.data.tryon_image_url) || '',
      },
    };
  }

  return {
    success: false,
    error: response.data?.message || response.error || 'خطا در امتحان محصول',
  };
}

/**
 * Delete a session
 *
 * @param sessionId - The session UUID to delete
 */
export async function deleteSession(sessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const response = await apiDelete(`/recommendations/sessions/${sessionId}/`);

  if (response.success) {
    return { success: true };
  }

  return {
    success: false,
    error: response.error || 'خطا در حذف جلسه',
  };
}

// =============================================================================
// Service Export
// =============================================================================

export const studioService = {
  createRedesignSession,
  fetchSessionStatus,
  pollSessionStatus,
  fetchUserSessions,
  tryProductOnItem,
  deleteSession,
  getSessionImageUrl,
};
