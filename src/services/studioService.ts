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

import { apiGet, apiPost, apiUpload, apiDelete, apiConfig, getStoredTokens } from '@/utils/apiClient';
import { convertHeicToJpeg } from '@/utils/imageConversion';

// =============================================================================
// Types - Backend Response Formats
// =============================================================================

/**
 * Session processing status
 * pending → analyzing → generating → [retrying] → matching → ready (or failed)
 * 'retrying' means the AI provider returned 503 and the task is waiting to retry
 */
export type SessionStatus =
  | 'pending'
  | 'analyzing'
  | 'generating'
  | 'retrying'
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
 * A detected item in the room (e.g., rug area, furniture spot)
 */
export interface APISessionItem {
  item_id: number;
  item_type: string; // e.g., 'rug', 'sofa', 'lamp'
  category?: string; // e.g., 'rug', 'furniture', 'cushion'
  category_display?: string; // Persian display name e.g., 'فرش و قالی'
  fit_reasoning_fa?: string; // AI reasoning in Persian for why this item fits
  recommended_size?: string; // AI-recommended size e.g., '2x3 متر'
  quantity?: number; // Number of items recommended e.g., 2
  placement?: string; // Where in the room e.g., 'وسط اتاق زیر لوستر'
  description?: Record<string, unknown>;
  matched_products: APIMatchedProduct[];
  tryon_status: 'pending' | 'processing' | 'completed' | 'failed';
  tryon_image_url: string | null;
  // Design diagnosis fields
  problem_statement?: string;
  why_change_reasons?: string[];
  design_strategy?: string;
  design_strategy_benefits?: string[];
  harmony_impact?: number;
  action_status?: 'available' | 'custom_order' | 'architectural';
  intervention_tier?: 'quick_win' | 'enhancement' | 'structural';
  impact_level?: 'low' | 'medium' | 'high';
  effort_level?: 'low' | 'medium' | 'high';
  action_type?: string;
  action_guidance?: string;
  action_difficulty?: string;
  action_estimate?: string;
  spec_note?: string;
  reference_image_url?: string;
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
  skip_image_generation?: boolean;
  items: APISessionItem[];
  created_at: string;
  updated_at?: string;
  error_message?: string;
  diagnosis?: {
    harmony_score: number;
    improvement_points: string[];
    diagnosis_detail: string;
  } | null;
}

/**
 * Create session response
 * POST /recommendations/sessions/
 */
export interface CreateSessionResponse {
  session_id: string;
  status: SessionStatus;
}

export interface CreditSummary {
  free_generations_remaining: number;
  paid_generations_balance: number;
  total_available_generations: number;
  free_generations_granted: number;
  free_generations_used: number;
  total_paid_generations_added: number;
  total_paid_generations_used: number;
}

export interface ImageCreditRequestResponse {
  id: string;
  source: 'web' | 'bale' | 'telegram';
  placement: 'limit_wall' | 'no_image_result_hero' | 'no_image_result_products';
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
  requested_generations: number;
  pending_request_id: string | null;
  redesign_session_id: string | null;
  already_requested?: boolean;
}

export interface CreditRequiredResponse {
  status: 'credit_required';
  pending_request_id: string;
  allow_continue_without_image: boolean;
  credit_summary: CreditSummary;
  existing_credit_request?: ImageCreditRequestResponse | null;
}

export interface NoImageResumeResponse {
  session_id: string;
  status: SessionStatus;
  skip_image_generation: true;
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
  skipImageGeneration: boolean;
  items: SessionItem[];
  createdAt: string;
  errorMessage?: string;
  roomType?: string;
  preferredStyle?: string;
  diagnosis?: {
    harmonyScore: number;
    improvementPoints: string[];
    diagnosisDetail: string;
  } | null;
}

/**
 * Session item with matched products
 */
export interface SessionItem {
  id: number;
  type: string;
  category: string;
  categoryDisplay: string;
  fitReasoningFa: string;
  recommendedSize: string;
  quantity: number;
  placement: string;
  matchedProducts: MatchedProduct[];
  tryonStatus: 'pending' | 'processing' | 'completed' | 'failed';
  tryonImageUrl: string | null;
  // Design diagnosis fields
  problemStatement?: string;
  whyChangeReasons?: string[];
  designStrategy?: string;
  designStrategyBenefits?: string[];
  harmonyImpact?: number;
  actionStatus?: 'available' | 'custom_order' | 'architectural';
  interventionTier?: 'quick_win' | 'enhancement' | 'structural';
  impactLevel?: 'low' | 'medium' | 'high';
  effortLevel?: 'low' | 'medium' | 'high';
  actionType?: string;
  actionGuidance?: string;
  actionDifficulty?: string;
  actionEstimate?: string;
  specNote?: string;
  referenceImageUrl?: string;
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
  sizePrices?: Record<string, number> | null;
  sizePricesDisplay?: Array<{
    code: string;
    display: string;
    price: number | null;
    hasSpecificPrice: boolean;
  }>;
  priceRange?: { min: number; max: number } | null;
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
 * Normalize a backend image URL to use the frontend's API host.
 * Rewrites CDN_BASE_URL to match VITE_API_BASE_URL, preserving query params.
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  return getSessionImageUrl(url);
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
    skipImageGeneration: apiSession.skip_image_generation ?? false,
    items: (apiSession.items || []).map(transformSessionItem),
    createdAt: apiSession.created_at,
    errorMessage: apiSession.error_message,
    roomType: apiSession.room_type,
    preferredStyle: apiSession.preferred_style,
    diagnosis: apiSession.diagnosis
      ? {
          harmonyScore: apiSession.diagnosis.harmony_score,
          improvementPoints: apiSession.diagnosis.improvement_points,
          diagnosisDetail: apiSession.diagnosis.diagnosis_detail,
        }
      : null,
  };
}

/**
 * Transform backend session item to frontend format
 */
function transformSessionItem(apiItem: APISessionItem): SessionItem {
  return {
    id: apiItem.item_id,
    type: apiItem.item_type,
    category: apiItem.category || apiItem.item_type || '',
    categoryDisplay: apiItem.category_display || apiItem.item_type || '',
    fitReasoningFa: apiItem.fit_reasoning_fa || '',
    recommendedSize: apiItem.recommended_size || '',
    quantity: apiItem.quantity ?? 1,
    placement: apiItem.placement || '',
    matchedProducts: (apiItem.matched_products || []).map(transformMatchedProduct),
    tryonStatus: apiItem.tryon_status,
    tryonImageUrl: getSessionImageUrl(apiItem.tryon_image_url),
    // Design diagnosis fields
    problemStatement: apiItem.problem_statement || '',
    whyChangeReasons: apiItem.why_change_reasons || [],
    designStrategy: apiItem.design_strategy || '',
    designStrategyBenefits: apiItem.design_strategy_benefits || [],
    harmonyImpact: apiItem.harmony_impact ?? 0,
    actionStatus: apiItem.action_status || 'available',
    interventionTier: apiItem.intervention_tier || 'quick_win',
    impactLevel: apiItem.impact_level || 'medium',
    effortLevel: apiItem.effort_level || 'medium',
    actionType: apiItem.action_type || '',
    actionGuidance: apiItem.action_guidance || '',
    actionDifficulty: apiItem.action_difficulty || '',
    actionEstimate: apiItem.action_estimate || '',
    specNote: apiItem.spec_note || '',
    referenceImageUrl: apiItem.reference_image_url || '',
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
    sizePrices: apiProduct.size_prices,
    sizePricesDisplay: apiProduct.size_prices_display?.map(sp => ({
      code: sp.code,
      display: sp.display,
      price: sp.price,
      hasSpecificPrice: sp.has_specific_price,
    })),
    priceRange: apiProduct.price_range,
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
  creditRequired?: boolean;
  creditData?: {
    pendingRequestId: string;
    allowContinueWithoutImage: boolean;
    creditSummary: CreditSummary;
    existingCreditRequest?: ImageCreditRequestResponse | null;
  };
  error?: string;
}> {
  // Pre-flight auth check - ensure tokens exist before making API call
  const tokens = getStoredTokens();
  if (!tokens?.access) {
    console.error('[StudioService] No auth tokens available for createRedesignSession');
    return {
      success: false,
      error: 'لطفا ابتدا وارد حساب کاربری خود شوید.',
    };
  }

  // Convert HEIC to JPEG if needed (iPhone default format)
  const convertedImage = await convertHeicToJpeg(roomImage);

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

  // Build form data with optional parameters
  const additionalData: Record<string, string> = {};
  if (options?.roomType) additionalData['room_type'] = options.roomType;
  if (options?.preferredStyle) additionalData['preferred_style'] = options.preferredStyle;
  if (options?.preferredColors) additionalData['preferred_colors'] = JSON.stringify(options.preferredColors);
  if (options?.userNotes) additionalData['user_notes'] = options.userNotes;

  const response = await apiUpload<CreateSessionResponse | CreditRequiredResponse>(
    '/recommendations/sessions/',
    convertedImage,  // Use converted image
    'room_image',
    additionalData,
    onProgress
  );

  if (response.success && response.data) {
    if ('status' in response.data && response.data.status === 'credit_required') {
      return {
        success: false,
        creditRequired: true,
        creditData: {
          pendingRequestId: response.data.pending_request_id,
          allowContinueWithoutImage: response.data.allow_continue_without_image,
          creditSummary: response.data.credit_summary,
          existingCreditRequest: response.data.existing_credit_request,
        },
        error: response.message || 'اعتبار تولید تصویر شما تمام شده است',
      };
    }

    const createData = response.data as CreateSessionResponse;
    return {
      success: true,
      data: {
        sessionId: createData.session_id,
        status: createData.status,
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

export async function createImageCreditRequest(params: {
  source: 'web' | 'bale' | 'telegram';
  placement: 'limit_wall' | 'no_image_result_hero' | 'no_image_result_products';
  pendingRequestId?: string;
  redesignSessionId?: string;
}): Promise<{
  success: boolean;
  data?: ImageCreditRequestResponse;
  error?: string;
}> {
  const response = await apiPost<ImageCreditRequestResponse>(
    '/recommendations/credit-requests/',
    {
      source: params.source,
      placement: params.placement,
      ...(params.pendingRequestId && { pending_request_id: params.pendingRequestId }),
      ...(params.redesignSessionId && { redesign_session_id: params.redesignSessionId }),
    }
  );

  if (response.success && response.data) {
    return { success: true, data: response.data };
  }

  return {
    success: false,
    error: response.error || 'خطا در ثبت درخواست اعتبار',
  };
}

export async function resumeSessionWithoutImage(pendingRequestId: string): Promise<{
  success: boolean;
  data?: { sessionId: string; status: SessionStatus; skipImageGeneration: true };
  error?: string;
}> {
  const response = await apiPost<NoImageResumeResponse>(
    '/recommendations/sessions/no-image/',
    { pending_request_id: pendingRequestId }
  );

  if (response.success && response.data) {
    return {
      success: true,
      data: {
        sessionId: response.data.session_id,
        status: response.data.status,
        skipImageGeneration: response.data.skip_image_generation,
      },
    };
  }

  return {
    success: false,
    error: response.error || 'خطا در ادامه بدون تصویر بازطراحی',
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

/**
 * Submit a consultation request for a session
 *
 * @param sessionId - The session UUID
 * @param data - Consultation request data
 */
export async function submitConsultationRequest(sessionId: string, data: {
  fullName: string;
  phone: string;
  message?: string;
  selectedItemIds?: number[];
}): Promise<void> {
  await apiPost(`/recommendations/sessions/${sessionId}/consultation/`, {
    full_name: data.fullName,
    phone: data.phone,
    message: data.message || '',
    selected_item_ids: data.selectedItemIds || [],
  });
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
  submitConsultationRequest,
};
