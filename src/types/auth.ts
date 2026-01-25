/**
 * Authentication Types
 * TypeScript definitions for OTP-based JWT authentication
 */

// =============================================================================
// Backend Response Types
// =============================================================================

/**
 * User as returned from Django backend
 */
export interface BackendUser {
  id: number;
  phone_number: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * JWT token pair from backend
 */
export interface AuthTokens {
  access: string;
  refresh: string;
}

/**
 * Standard API response wrapper from backend
 */
export interface APIResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

// =============================================================================
// OTP Flow Types
// =============================================================================

/**
 * OTP purpose types
 */
export type OTPPurpose = 'login' | 'reset_password' | 'verify_phone';

/**
 * Request body for POST /api/users/otp/send/
 */
export interface OTPSendRequest {
  phone_number: string;
  purpose: OTPPurpose;
}

/**
 * Response data from POST /api/users/otp/send/
 */
export interface OTPSendResponse {
  phone_number: string;
  expires_in_seconds: number;
  message: string;
}

/**
 * Request body for POST /api/users/otp/verify/
 */
export interface OTPVerifyRequest {
  phone_number: string;
  otp_code: string;
  purpose: OTPPurpose;
}

/**
 * Response data from POST /api/users/otp/verify/
 */
export interface OTPVerifyResponse {
  user: BackendUser;
  tokens: AuthTokens;
}

/**
 * Response data from POST /api/users/login/
 */
export interface LoginResponse {
  user: BackendUser;
  tokens: AuthTokens;
}

/**
 * Response data from POST /api/users/password/reset/
 */
export interface ResetPasswordResponse {
  message: string;
}

/**
 * Response data from POST /api/users/otp/send/ with check_only=true
 */
export interface CheckUserResponse {
  phone_number: string;
  user_exists: boolean;
  has_password: boolean;
}

/**
 * Response data from POST /api/users/password/set/
 * Same structure as LoginResponse
 */
export interface SetPasswordResponse {
  user: BackendUser;
  tokens: AuthTokens;
}

/**
 * Request body for POST /api/users/otp/resend/
 */
export interface OTPResendRequest {
  phone_number: string;
  purpose: OTPPurpose;
}

// =============================================================================
// Token Management Types
// =============================================================================

/**
 * Request body for POST /api/users/refresh/
 */
export interface TokenRefreshRequest {
  refresh: string;
}

/**
 * Response from POST /api/users/refresh/
 * Note: This endpoint returns directly without wrapper
 */
export interface TokenRefreshResponse {
  access: string;
}

/**
 * Request body for POST /api/users/logout/
 */
export interface LogoutRequest {
  refresh_token: string;
  all_devices?: boolean;
}

// =============================================================================
// Profile Types
// =============================================================================

/**
 * Request body for PUT /api/users/profile/
 */
export interface ProfileUpdateRequest {
  name: string;
}

// =============================================================================
// Frontend Types
// =============================================================================

/**
 * User interface for frontend (transformed from BackendUser)
 */
export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt?: string;
}

/**
 * Stored authentication state in localStorage
 */
export interface StoredAuthState {
  user: User;
  tokens: AuthTokens;
  expiresAt: number; // Timestamp when access token expires
}

// =============================================================================
// Auth Context Types
// =============================================================================

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

/**
 * Authentication actions
 */
export interface AuthActions {
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
}

/**
 * Full auth context type
 */
export type AuthContextType = AuthState & AuthActions;

// =============================================================================
// Service Response Types
// =============================================================================

/**
 * Generic service result with success/error
 */
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * OTP send service result
 */
export interface OTPSendResult extends ServiceResult {
  expiresIn?: number;
}

/**
 * OTP verify service result
 */
export interface OTPVerifyResult extends ServiceResult {
  user?: User;
  tokens?: AuthTokens;
  remainingAttempts?: number;
}

/**
 * Profile service result
 */
export interface ProfileResult extends ServiceResult {
  user?: User;
}

/**
 * Login with password service result
 */
export interface LoginResult extends ServiceResult {
  user?: User;
  tokens?: AuthTokens;
}

/**
 * Password reset service result
 */
export interface ResetPasswordResult extends ServiceResult {
  // No additional data needed on success
}

/**
 * Check user service result
 */
export interface CheckUserResult extends ServiceResult {
  exists?: boolean;
  hasPassword?: boolean;
  phoneNumber?: string;
}

/**
 * Set password service result (same as LoginResult)
 */
export interface SetPasswordResult extends ServiceResult {
  user?: User;
  tokens?: AuthTokens;
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Auth error response from backend
 */
export interface AuthErrorResponse {
  success: false;
  message: string;
  data?: {
    remaining_attempts?: number;
    [key: string]: unknown;
  };
}

/**
 * Known auth error codes
 */
export type AuthErrorCode =
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'MAX_ATTEMPTS'
  | 'RATE_LIMITED'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

// =============================================================================
// Storage Keys
// =============================================================================

/**
 * localStorage keys for auth data
 */
export const AUTH_STORAGE_KEYS = {
  AUTH_STATE: 'homa_auth_state',
  ACCESS_TOKEN: 'homa_access_token',
  REFRESH_TOKEN: 'homa_refresh_token',
} as const;

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Transform BackendUser to frontend User
 */
export function transformBackendUser(backendUser: BackendUser): User {
  return {
    id: String(backendUser.id),
    name: backendUser.name || '',
    phone: backendUser.phone_number,
    createdAt: backendUser.created_at,
  };
}
