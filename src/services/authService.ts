/**
 * Auth Service - احراز هویت
 * مدیریت OTP، توکن‌ها و پروفایل کاربر
 */

import { apiPost, apiGet, apiPut, setStoredTokens, clearAuthData, setAccessToken, getRefreshToken } from '@/utils/apiClient';
import {
  AUTH_STORAGE_KEYS,
  transformBackendUser,
  type BackendUser,
  type AuthTokens,
  type User,
  type StoredAuthState,
  type OTPSendResponse,
  type OTPVerifyResponse,
  type LoginResponse,
  type ResetPasswordResponse,
  type OTPSendResult,
  type OTPVerifyResult,
  type ProfileResult,
  type LoginResult,
  type ResetPasswordResult,
} from '@/types/auth';

// =============================================================================
// Constants
// =============================================================================

/**
 * Access token expiry time in milliseconds (30 minutes)
 */
const ACCESS_TOKEN_EXPIRY_MS = 30 * 60 * 1000;

// =============================================================================
// Phone Number Utilities
// =============================================================================

/**
 * Convert Persian/Arabic digits to English
 */
export function normalizePhoneNumber(input: string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  let normalized = input;

  // Convert Persian digits
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(new RegExp(persianDigits[i], 'g'), String(i));
  }

  // Convert Arabic digits
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }

  // Remove non-digit characters
  return normalized.replace(/\D/g, '');
}

/**
 * Validate Iranian phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Iranian mobile: 09XXXXXXXXX (11 digits)
  return normalized.startsWith('09') && normalized.length === 11;
}

/**
 * Format phone number for API (add +98 prefix if needed)
 */
export function formatPhoneForAPI(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  // Backend accepts both 09XXXXXXXXX and +989XXXXXXXXX
  // We'll use the 09 format as it's more common for users
  return normalized;
}

// =============================================================================
// Storage Helpers
// =============================================================================

/**
 * Store complete auth state (user + tokens + expiry)
 */
export function storeAuthState(user: User, tokens: AuthTokens): void {
  const state: StoredAuthState = {
    user,
    tokens,
    expiresAt: Date.now() + ACCESS_TOKEN_EXPIRY_MS,
  };

  localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_STATE, JSON.stringify(state));
  setStoredTokens(tokens);
}

/**
 * Get stored auth state
 */
export function getStoredAuthState(): StoredAuthState | null {
  try {
    const stateJson = localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_STATE);
    if (!stateJson) return null;

    const state = JSON.parse(stateJson) as StoredAuthState;
    return state;
  } catch {
    return null;
  }
}

/**
 * Update stored user data (without changing tokens)
 */
export function updateStoredUser(user: User): void {
  const state = getStoredAuthState();
  if (state) {
    state.user = user;
    localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_STATE, JSON.stringify(state));
  }
}

/**
 * Check if access token is expired
 */
export function isTokenExpired(): boolean {
  const state = getStoredAuthState();
  if (!state) return true;
  return Date.now() >= state.expiresAt;
}

// =============================================================================
// OTP Service
// =============================================================================

/**
 * Send OTP to phone number
 */
export async function sendOTP(phone: string): Promise<OTPSendResult> {
  const normalizedPhone = formatPhoneForAPI(phone);

  const response = await apiPost<OTPSendResponse>(
    '/users/otp/send/',
    {
      phone_number: normalizedPhone,
      purpose: 'login',
    },
    { skipAuth: true }
  );

  if (response.success && response.data) {
    return {
      success: true,
      expiresIn: response.data.expires_in_seconds,
    };
  }

  // Parse specific error messages
  let errorMessage = response.error || 'خطا در ارسال کد تایید';

  // Rate limiting error
  if (response.statusCode === 429) {
    errorMessage = 'تعداد درخواست‌های شما از حد مجاز گذشته است. لطفا بعدا تلاش کنید';
  }

  return {
    success: false,
    error: errorMessage,
  };
}

/**
 * Verify OTP and login
 */
export async function verifyOTP(phone: string, otpCode: string): Promise<OTPVerifyResult> {
  const normalizedPhone = formatPhoneForAPI(phone);

  const response = await apiPost<OTPVerifyResponse>(
    '/users/otp/verify/',
    {
      phone_number: normalizedPhone,
      otp_code: otpCode,
      purpose: 'login',
    },
    { skipAuth: true }
  );

  if (response.success && response.data) {
    const user = transformBackendUser(response.data.user);
    const tokens = response.data.tokens;

    // Store auth state
    storeAuthState(user, tokens);

    return {
      success: true,
      user,
      tokens,
    };
  }

  // Parse specific error messages
  let errorMessage = response.error || 'کد تایید نامعتبر است';
  let remainingAttempts: number | undefined;

  // Extract remaining attempts from error message
  // Backend format: "کد تایید نامعتبر است. X تلاش باقی مانده"
  const attemptsMatch = response.error?.match(/(\d+)\s*تلاش باقی مانده/);
  if (attemptsMatch) {
    remainingAttempts = parseInt(attemptsMatch[1]);
  }

  // OTP expired (410 Gone)
  if (response.statusCode === 410) {
    errorMessage = 'کد تایید منقضی شده است. لطفا کد جدید درخواست کنید';
  }

  // Max attempts exceeded
  if (response.error?.includes('حد مجاز')) {
    errorMessage = 'تعداد تلاش‌های شما از حد مجاز گذشته است. لطفا کد جدید درخواست کنید';
    remainingAttempts = 0;
  }

  return {
    success: false,
    error: errorMessage,
    remainingAttempts,
  };
}

/**
 * Resend OTP
 */
export async function resendOTP(phone: string): Promise<OTPSendResult> {
  const normalizedPhone = formatPhoneForAPI(phone);

  const response = await apiPost<OTPSendResponse>(
    '/users/otp/resend/',
    {
      phone_number: normalizedPhone,
      purpose: 'login',
    },
    { skipAuth: true }
  );

  if (response.success && response.data) {
    return {
      success: true,
      expiresIn: response.data.expires_in_seconds,
    };
  }

  let errorMessage = response.error || 'خطا در ارسال مجدد کد تایید';

  if (response.statusCode === 429) {
    errorMessage = 'تعداد درخواست‌های شما از حد مجاز گذشته است. لطفا بعدا تلاش کنید';
  }

  return {
    success: false,
    error: errorMessage,
  };
}

// =============================================================================
// Password Authentication
// =============================================================================

/**
 * Login with phone number and password
 */
export async function loginWithPassword(phone: string, password: string): Promise<LoginResult> {
  const normalizedPhone = formatPhoneForAPI(phone);

  const response = await apiPost<LoginResponse>(
    '/users/login/',
    {
      phone_number: normalizedPhone,
      password: password,
    },
    { skipAuth: true }
  );

  if (response.success && response.data) {
    const user = transformBackendUser(response.data.user);
    const tokens = response.data.tokens;

    // Store auth state
    storeAuthState(user, tokens);

    return {
      success: true,
      user,
      tokens,
    };
  }

  // Parse specific error messages - use generic message for security
  let errorMessage = 'شماره موبایل یا رمز عبور اشتباه است';

  // Rate limiting / account locked
  if (response.statusCode === 429) {
    errorMessage = 'حساب شما موقتاً مسدود شده. لطفاً بعداً تلاش کنید';
  }

  // Network error
  if (response.statusCode === 0) {
    errorMessage = 'خطا در برقراری ارتباط با سرور';
  }

  return {
    success: false,
    error: errorMessage,
  };
}

/**
 * Send OTP for password reset
 */
export async function sendOTPForReset(phone: string): Promise<OTPSendResult> {
  const normalizedPhone = formatPhoneForAPI(phone);

  const response = await apiPost<OTPSendResponse>(
    '/users/otp/send/',
    {
      phone_number: normalizedPhone,
      purpose: 'reset_password',
    },
    { skipAuth: true }
  );

  if (response.success && response.data) {
    return {
      success: true,
      expiresIn: response.data.expires_in_seconds,
    };
  }

  let errorMessage = response.error || 'خطا در ارسال کد تایید';

  if (response.statusCode === 429) {
    errorMessage = 'تعداد درخواست‌های شما از حد مجاز گذشته است. لطفا بعدا تلاش کنید';
  }

  return {
    success: false,
    error: errorMessage,
  };
}

/**
 * Reset password with OTP verification
 */
export async function resetPassword(
  phone: string,
  otpCode: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  const normalizedPhone = formatPhoneForAPI(phone);

  const response = await apiPost<ResetPasswordResponse>(
    '/users/password/reset/',
    {
      phone_number: normalizedPhone,
      otp_code: otpCode,
      new_password: newPassword,
      confirm_password: newPassword,
    },
    { skipAuth: true }
  );

  if (response.success) {
    return {
      success: true,
    };
  }

  // Parse specific error messages
  let errorMessage = response.error || 'خطا در تغییر رمز عبور';

  // Invalid OTP
  if (response.statusCode === 400 && response.error?.includes('کد')) {
    errorMessage = 'کد تایید نامعتبر است';
  }

  // OTP expired
  if (response.statusCode === 410) {
    errorMessage = 'کد تایید منقضی شده است. لطفا کد جدید درخواست کنید';
  }

  return {
    success: false,
    error: errorMessage,
  };
}

// =============================================================================
// Token Management
// =============================================================================

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<string | null> {
  const refreshTokenValue = getRefreshToken();

  if (!refreshTokenValue) {
    return null;
  }

  try {
    const response = await apiPost<{ access: string }>(
      '/users/refresh/',
      { refresh: refreshTokenValue },
      { skipAuth: true, skipRetryOn401: true }
    );

    if (response.success && response.data?.access) {
      const newAccessToken = response.data.access;
      setAccessToken(newAccessToken);

      // Update expiry in stored state
      const state = getStoredAuthState();
      if (state) {
        state.tokens.access = newAccessToken;
        state.expiresAt = Date.now() + ACCESS_TOKEN_EXPIRY_MS;
        localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_STATE, JSON.stringify(state));
      }

      return newAccessToken;
    }

    // Refresh failed - clear auth
    clearAuthData();
    return null;
  } catch {
    clearAuthData();
    return null;
  }
}

// =============================================================================
// Profile Operations
// =============================================================================

/**
 * Get current user profile
 */
export async function getProfile(): Promise<ProfileResult> {
  const response = await apiGet<BackendUser>('/users/profile/');

  if (response.success && response.data) {
    const user = transformBackendUser(response.data);
    updateStoredUser(user);
    return {
      success: true,
      user,
    };
  }

  return {
    success: false,
    error: response.error || 'خطا در دریافت اطلاعات پروفایل',
  };
}

/**
 * Update user profile
 */
export async function updateProfile(name: string): Promise<ProfileResult> {
  const response = await apiPut<BackendUser>('/users/profile/', { name });

  if (response.success && response.data) {
    const user = transformBackendUser(response.data);
    updateStoredUser(user);
    return {
      success: true,
      user,
    };
  }

  return {
    success: false,
    error: response.error || 'خطا در به‌روزرسانی پروفایل',
  };
}

// =============================================================================
// Session Management
// =============================================================================

/**
 * Logout user (invalidate refresh token)
 */
export async function logout(allDevices: boolean = false): Promise<void> {
  const refreshTokenValue = getRefreshToken();

  if (refreshTokenValue) {
    // Best effort - don't wait or handle errors
    apiPost(
      '/users/logout/',
      {
        refresh_token: refreshTokenValue,
        all_devices: allDevices,
      },
      { skipRetryOn401: true }
    ).catch(() => {
      // Ignore errors - we're logging out anyway
    });
  }

  // Always clear local auth data
  clearAuthData();
}

// =============================================================================
// Auth Service Object (for backwards compatibility)
// =============================================================================

export const authService = {
  // Phone utilities
  normalizePhoneNumber,
  isValidPhoneNumber,
  formatPhoneForAPI,

  // OTP flow
  sendOTP,
  verifyOTP,
  resendOTP,

  // Password authentication
  loginWithPassword,
  sendOTPForReset,
  resetPassword,

  // Token management
  refreshToken,

  // Profile
  getProfile,
  updateProfile,

  // Session
  logout,

  // Storage
  storeAuthState,
  getStoredAuthState,
  updateStoredUser,
  isTokenExpired,
  clearAuth: clearAuthData,
};

export default authService;
