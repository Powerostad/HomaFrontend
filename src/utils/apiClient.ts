/**
 * API Client برای HOMA Platform
 * مدیریت تمام ارتباطات با Backend
 *
 * Features:
 * - JWT token injection
 * - Automatic token refresh on 401
 * - Request queuing during refresh
 * - Type-safe responses
 */

import { AUTH_STORAGE_KEYS, type AuthTokens } from '@/types/auth';

// =============================================================================
// Environment Configuration
// =============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000; // 30 seconds

/**
 * تنظیمات API
 */
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
};

// =============================================================================
// Token Refresh State (Module-level singleton)
// =============================================================================

/**
 * Flag to prevent multiple simultaneous refresh requests
 */
let isRefreshing = false;

/**
 * Queue of requests waiting for token refresh
 */
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Process queued requests after refresh completes
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// =============================================================================
// Token Storage Functions
// =============================================================================

/**
 * Get stored auth tokens from localStorage
 */
export function getStoredTokens(): AuthTokens | null {
  try {
    const access = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    const refresh = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);

    if (access && refresh) {
      return { access, refresh };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Store auth tokens to localStorage
 */
export function setStoredTokens(tokens: AuthTokens): void {
  localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
  localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
}

/**
 * Update only the access token
 */
export function setAccessToken(token: string): void {
  localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, token);
}

/**
 * Get only the refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Clear all auth data from storage
 */
export function clearAuthData(): void {
  localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_STATE);
  localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  // Legacy cleanup
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}

// =============================================================================
// Token Refresh Logic
// =============================================================================

/**
 * Refresh access token using refresh token
 * Returns new access token or null if refresh failed
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    console.log('[Auth] No refresh token available');
    return null;
  }

  try {
    console.log('[Auth] Refreshing access token...');

    const url = new URL('/users/refresh/', apiConfig.baseURL);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      console.log('[Auth] Refresh failed with status:', response.status);
      // Refresh token is invalid/expired - clear all auth
      clearAuthData();
      return null;
    }

    const data = await response.json();

    // Token refresh endpoint returns { access: "..." } directly
    const newAccessToken = data.access;

    if (newAccessToken) {
      setAccessToken(newAccessToken);
      console.log('[Auth] Token refreshed successfully');
      return newAccessToken;
    }

    return null;
  } catch (error) {
    console.error('[Auth] Token refresh error:', error);
    clearAuthData();
    return null;
  }
}

/**
 * Handle 401 Unauthorized response
 * Queues the request if refresh is in progress, otherwise initiates refresh
 */
async function handleUnauthorized(): Promise<string | null> {
  // If already refreshing, queue this request
  if (isRefreshing) {
    console.log('[Auth] Refresh in progress, queuing request...');
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const newToken = await refreshAccessToken();
    processQueue(null, newToken);
    return newToken;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Token refresh failed');
    processQueue(err, null);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

// =============================================================================
// Header Builder
// =============================================================================

/**
 * Build request headers with optional auth token
 */
function buildHeaders(
  customHeaders?: Record<string, string>,
  skipAuth: boolean = false
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders,
  };

  // Add Authorization header if token exists and not skipped
  if (!skipAuth) {
    const tokens = getStoredTokens();
    if (tokens?.access) {
      headers['Authorization'] = `Bearer ${tokens.access}`;
    }
  }

  return headers;
}

// =============================================================================
// Error Translation (Browser errors to Persian)
// =============================================================================

/**
 * ترجمه خطاهای رایج مرورگر به فارسی
 * این تابع خطاهای انگلیسی مرورگر را به پیام‌های فارسی تبدیل می‌کند
 */
function translateErrorMessage(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;

  // Common browser/network error patterns
  const errorTranslations: Record<string, string> = {
    'Failed to fetch': 'خطا در برقراری ارتباط با سرور',
    'Network request failed': 'خطا در برقراری ارتباط با سرور',
    'NetworkError': 'خطا در اتصال به شبکه',
    'Network Error': 'خطا در اتصال به شبکه',
    'TypeError: Failed to fetch': 'خطا در برقراری ارتباط با سرور',
    'Load failed': 'خطا در بارگذاری اطلاعات',
    'net::ERR_FAILED': 'خطا در برقراری ارتباط',
    'net::ERR_CONNECTION_REFUSED': 'سرور در دسترس نیست',
    'net::ERR_CONNECTION_RESET': 'اتصال قطع شد',
    'net::ERR_CONNECTION_TIMED_OUT': 'زمان اتصال به پایان رسید',
    'net::ERR_INTERNET_DISCONNECTED': 'اتصال اینترنت قطع است',
    'net::ERR_NAME_NOT_RESOLVED': 'آدرس سرور یافت نشد',
    'AbortError': 'درخواست لغو شد',
    'TimeoutError': 'زمان درخواست به پایان رسید',
    'Request timeout': 'زمان درخواست به پایان رسید',
    'CORS error': 'خطا در دسترسی به سرور',
    'Unauthorized': 'دسترسی غیرمجاز',
    'Forbidden': 'دسترسی ممنوع',
    'Not Found': 'صفحه یافت نشد',
    'Internal Server Error': 'خطای داخلی سرور',
    'Bad Gateway': 'خطا در ارتباط با سرور',
    'Service Unavailable': 'سرویس در دسترس نیست',
    'Gateway Timeout': 'زمان پاسخ سرور به پایان رسید',
  };

  // Check for exact matches first
  if (errorTranslations[message]) {
    return errorTranslations[message];
  }

  // Check for partial matches (case-insensitive)
  const lowerMessage = message.toLowerCase();
  for (const [key, translation] of Object.entries(errorTranslations)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return translation;
    }
  }

  // If the message is already in Persian (contains Persian characters), return as-is
  if (/[\u0600-\u06FF]/.test(message)) {
    return message;
  }

  // Default fallback for unknown English errors
  return 'خطای ناشناخته رخ داد';
}

// =============================================================================
// Error Classes
// =============================================================================

/**
 * خطاهای API
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Response Type برای API
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

// =============================================================================
// Request Options
// =============================================================================

export interface RequestOptions extends Omit<RequestInit, 'headers'> {
  /**
   * Skip adding Authorization header (for public endpoints)
   */
  skipAuth?: boolean;
  /**
   * Custom headers to merge
   */
  headers?: Record<string, string>;
  /**
   * Skip automatic retry on 401 (prevent infinite loops)
   */
  skipRetryOn401?: boolean;
}

// =============================================================================
// Core Request Functions
// =============================================================================

/**
 * درخواست GET
 */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, unknown>,
  options?: RequestOptions
): Promise<APIResponse<T>> {
  const { skipAuth = false, headers: customHeaders, skipRetryOn401 = false, ...fetchOptions } = options || {};

  try {
    // ساخت URL با query parameters
    const url = new URL(endpoint, apiConfig.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    console.log('[API GET]', url.toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: buildHeaders(customHeaders, skipAuth),
      signal: controller.signal,
      ...fetchOptions,
    });

    clearTimeout(timeoutId);

    // Handle 401 with automatic retry
    if (response.status === 401 && !skipRetryOn401) {
      console.log('[API GET] Received 401, attempting token refresh...');
      const newToken = await handleUnauthorized();

      if (newToken) {
        // Retry the request with new token
        return apiGet<T>(endpoint, params, { ...options, skipRetryOn401: true });
      } else {
        // Refresh failed - return unauthorized error
        return {
          success: false,
          error: 'نشست شما منقضی شده است. لطفا دوباره وارد شوید.',
          statusCode: 401,
        };
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || data.message || 'خطا در دریافت اطلاعات',
        response.status,
        data
      );
    }

    return {
      success: true,
      data: data.data !== undefined ? data.data : data,
      message: data.message,
      statusCode: response.status,
    };
  } catch (error) {
    console.error('[API GET Error]', endpoint, error);

    if (error instanceof APIError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      };
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'زمان درخواست به پایان رسید',
        statusCode: 408,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? translateErrorMessage(error) : 'خطای ناشناخته',
      statusCode: 500,
    };
  }
}

/**
 * درخواست POST
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<APIResponse<T>> {
  const { skipAuth = false, headers: customHeaders, skipRetryOn401 = false, ...fetchOptions } = options || {};

  try {
    const url = new URL(endpoint, apiConfig.baseURL);
    console.log('[API POST]', url.toString(), body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: buildHeaders(customHeaders, skipAuth),
      body: JSON.stringify(body),
      signal: controller.signal,
      ...fetchOptions,
    });

    clearTimeout(timeoutId);

    // Handle 401 with automatic retry
    if (response.status === 401 && !skipRetryOn401) {
      console.log('[API POST] Received 401, attempting token refresh...');
      const newToken = await handleUnauthorized();

      if (newToken) {
        // Retry the request with new token
        return apiPost<T>(endpoint, body, { ...options, skipRetryOn401: true });
      } else {
        return {
          success: false,
          error: 'نشست شما منقضی شده است. لطفا دوباره وارد شوید.',
          statusCode: 401,
        };
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || data.message || 'خطا در ارسال اطلاعات',
        response.status,
        data
      );
    }

    return {
      success: true,
      data: data.data !== undefined ? data.data : data,
      message: data.message,
      statusCode: response.status,
    };
  } catch (error) {
    console.error('[API POST Error]', endpoint, error);

    if (error instanceof APIError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      };
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'زمان درخواست به پایان رسید',
        statusCode: 408,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? translateErrorMessage(error) : 'خطای ناشناخته',
      statusCode: 500,
    };
  }
}

/**
 * آپلود فایل با FormData
 */
export async function apiUpload<T>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, unknown>,
  onProgress?: (progress: number) => void,
  options?: RequestOptions
): Promise<APIResponse<T>> {
  const { skipAuth = false, skipRetryOn401 = false } = options || {};

  try {
    const url = new URL(endpoint, apiConfig.baseURL);
    console.log('[API Upload]', url.toString(), {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    const formData = new FormData();
    formData.append('file', file);

    // اضافه کردن data های اضافی
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });
    }

    // Get auth token for XMLHttpRequest
    const tokens = getStoredTokens();

    // استفاده از XMLHttpRequest برای tracking progress
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      // Success/Error handling
      xhr.addEventListener('load', async () => {
        // Handle 401 with retry
        if (xhr.status === 401 && !skipRetryOn401) {
          console.log('[API Upload] Received 401, attempting token refresh...');
          const newToken = await handleUnauthorized();

          if (newToken) {
            // Retry the upload with new token
            const retryResult = await apiUpload<T>(endpoint, file, additionalData, onProgress, {
              ...options,
              skipRetryOn401: true
            });
            resolve(retryResult);
            return;
          } else {
            resolve({
              success: false,
              error: 'نشست شما منقضی شده است. لطفا دوباره وارد شوید.',
              statusCode: 401,
            });
            return;
          }
        }

        try {
          const data = JSON.parse(xhr.responseText);

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              success: true,
              data: data.data !== undefined ? data.data : data,
              message: data.message,
              statusCode: xhr.status,
            });
          } else {
            resolve({
              success: false,
              error: data.error || data.message || 'خطا در آپلود فایل',
              statusCode: xhr.status,
            });
          }
        } catch {
          resolve({
            success: false,
            error: 'خطا در پردازش پاسخ سرور',
            statusCode: xhr.status,
          });
        }
      });

      // Error
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'خطا در اتصال به سرور',
          statusCode: 0,
        });
      });

      // Timeout
      xhr.addEventListener('timeout', () => {
        resolve({
          success: false,
          error: 'زمان آپلود به پایان رسید',
          statusCode: 408,
        });
      });

      // Start request
      xhr.open('POST', url.toString());
      xhr.timeout = apiConfig.timeout;

      // Add Authorization header if available and not skipped
      if (!skipAuth && tokens?.access) {
        xhr.setRequestHeader('Authorization', `Bearer ${tokens.access}`);
      }

      xhr.send(formData);
    });
  } catch (error) {
    console.error('[API Upload Error]', endpoint, error);
    return {
      success: false,
      error: error instanceof Error ? translateErrorMessage(error) : 'خطای ناشناخته در آپلود',
      statusCode: 500,
    };
  }
}

/**
 * درخواست PUT
 */
export async function apiPut<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<APIResponse<T>> {
  const { skipAuth = false, headers: customHeaders, skipRetryOn401 = false, ...fetchOptions } = options || {};

  try {
    const url = new URL(endpoint, apiConfig.baseURL);
    console.log('[API PUT]', url.toString(), body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: buildHeaders(customHeaders, skipAuth),
      body: JSON.stringify(body),
      signal: controller.signal,
      ...fetchOptions,
    });

    clearTimeout(timeoutId);

    // Handle 401 with automatic retry
    if (response.status === 401 && !skipRetryOn401) {
      console.log('[API PUT] Received 401, attempting token refresh...');
      const newToken = await handleUnauthorized();

      if (newToken) {
        return apiPut<T>(endpoint, body, { ...options, skipRetryOn401: true });
      } else {
        return {
          success: false,
          error: 'نشست شما منقضی شده است. لطفا دوباره وارد شوید.',
          statusCode: 401,
        };
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || data.message || 'خطا در به‌روزرسانی',
        response.status,
        data
      );
    }

    return {
      success: true,
      data: data.data !== undefined ? data.data : data,
      message: data.message,
      statusCode: response.status,
    };
  } catch (error) {
    console.error('[API PUT Error]', endpoint, error);

    if (error instanceof APIError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? translateErrorMessage(error) : 'خطای ناشناخته',
      statusCode: 500,
    };
  }
}

/**
 * درخواست DELETE
 */
export async function apiDelete<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<APIResponse<T>> {
  const { skipAuth = false, headers: customHeaders, skipRetryOn401 = false, ...fetchOptions } = options || {};

  try {
    const url = new URL(endpoint, apiConfig.baseURL);
    console.log('[API DELETE]', url.toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: buildHeaders(customHeaders, skipAuth),
      signal: controller.signal,
      ...fetchOptions,
    });

    clearTimeout(timeoutId);

    // Handle 401 with automatic retry
    if (response.status === 401 && !skipRetryOn401) {
      console.log('[API DELETE] Received 401, attempting token refresh...');
      const newToken = await handleUnauthorized();

      if (newToken) {
        return apiDelete<T>(endpoint, { ...options, skipRetryOn401: true });
      } else {
        return {
          success: false,
          error: 'نشست شما منقضی شده است. لطفا دوباره وارد شوید.',
          statusCode: 401,
        };
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || data.message || 'خطا در حذف',
        response.status,
        data
      );
    }

    return {
      success: true,
      data: data.data !== undefined ? data.data : data,
      message: data.message,
      statusCode: response.status,
    };
  } catch (error) {
    console.error('[API DELETE Error]', endpoint, error);

    if (error instanceof APIError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? translateErrorMessage(error) : 'خطای ناشناخته',
      statusCode: 500,
    };
  }
}

/**
 * Health check برای بررسی وضعیت API
 */
export async function apiHealthCheck(): Promise<boolean> {
  try {
    const response = await apiGet('/health', undefined, { skipAuth: true });
    return response.success;
  } catch {
    console.error('[API Health Check Failed]');
    return false;
  }
}

// =============================================================================
// Auth-specific exports for authService
// =============================================================================

export { refreshAccessToken, translateErrorMessage };
