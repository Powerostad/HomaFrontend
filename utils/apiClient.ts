/**
 * API Client برای HOMA Platform
 * مدیریت تمام ارتباطات با Backend
 */

// Environment Variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000; // 30 seconds

/**
 * تنظیمات API
 */
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * خطاهای API
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Response Type برای API
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

/**
 * درخواست GET
 */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, any>,
  options?: RequestInit
): Promise<APIResponse<T>> {
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
      headers: apiConfig.headers,
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

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
      data: data.data || data,
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
      error: error instanceof Error ? error.message : 'خطای ناشناخته',
      statusCode: 500,
    };
  }
}

/**
 * درخواست POST
 */
export async function apiPost<T>(
  endpoint: string,
  body?: any,
  options?: RequestInit
): Promise<APIResponse<T>> {
  try {
    const url = new URL(endpoint, apiConfig.baseURL);
    console.log('[API POST]', url.toString(), body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: apiConfig.headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

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
      data: data.data || data,
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
      error: error instanceof Error ? error.message : 'خطای ناشناخته',
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
  additionalData?: Record<string, any>,
  onProgress?: (progress: number) => void
): Promise<APIResponse<T>> {
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

    // استفاده از XMLHttpRequest برای tracking progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      // Success
      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              success: true,
              data: data.data || data,
              statusCode: xhr.status,
            });
          } else {
            resolve({
              success: false,
              error: data.error || data.message || 'خطا در آپلود فایل',
              statusCode: xhr.status,
            });
          }
        } catch (error) {
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
      xhr.send(formData);
    });
  } catch (error) {
    console.error('[API Upload Error]', endpoint, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطای ناشناخته در آپلود',
      statusCode: 500,
    };
  }
}

/**
 * درخواست PUT
 */
export async function apiPut<T>(
  endpoint: string,
  body?: any,
  options?: RequestInit
): Promise<APIResponse<T>> {
  try {
    const url = new URL(endpoint, apiConfig.baseURL);
    console.log('[API PUT]', url.toString(), body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: apiConfig.headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

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
      data: data.data || data,
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
      error: error instanceof Error ? error.message : 'خطای ناشناخته',
      statusCode: 500,
    };
  }
}

/**
 * درخواست DELETE
 */
export async function apiDelete<T>(
  endpoint: string,
  options?: RequestInit
): Promise<APIResponse<T>> {
  try {
    const url = new URL(endpoint, apiConfig.baseURL);
    console.log('[API DELETE]', url.toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: apiConfig.headers,
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

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
      data: data.data || data,
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
      error: error instanceof Error ? error.message : 'خطای ناشناخته',
      statusCode: 500,
    };
  }
}

/**
 * Health check برای بررسی وضعیت API
 */
export async function apiHealthCheck(): Promise<boolean> {
  try {
    const response = await apiGet('/health');
    return response.success;
  } catch (error) {
    console.error('[API Health Check Failed]', error);
    return false;
  }
}
