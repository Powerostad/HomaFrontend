/**
 * AuthContext - مدیریت احراز هویت کاربر
 *
 * Features:
 * - JWT token management
 * - Auto-restore session from localStorage
 * - Auto-refresh expired tokens on init
 * - Loading states for UI feedback
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  getStoredAuthState,
  storeAuthState,
  isTokenExpired,
  refreshToken,
  logout as authLogout,
  updateProfile as authUpdateProfile,
  getProfile as authGetProfile,
} from '@/services/authService';
import { getStoredTokens, clearAuthData, AUTH_LOGOUT_EVENT, AUTH_LOGIN_EVENT } from '@/utils/apiClient';
import { identifyUser, resetUser, trackAuthEvent } from '@/analytics/events';
import type { User, AuthTokens, AuthContextType } from '@/types/auth';

// Re-export User type for backwards compatibility
export type { User } from '@/types/auth';

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// Provider
// =============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ==========================================================================
  // Initialize auth state on mount
  // ==========================================================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedState = getStoredAuthState();

        if (!storedState?.user || !storedState?.tokens) {
          // No stored auth - user is logged out
          setIsInitialized(true);
          return;
        }

        // Check if access token is expired
        if (isTokenExpired()) {
          console.log('[Auth] Token expired, attempting refresh...');

          // Try to refresh the token
          const newToken = await refreshToken();

          if (!newToken) {
            // Refresh failed - clear everything and require re-login
            console.log('[Auth] Token refresh failed, clearing auth');
            clearAuthData();
            setIsInitialized(true);
            return;
          }

          console.log('[Auth] Token refreshed successfully');
        }

        // Token is valid (or was just refreshed) - fetch fresh profile
        console.log('[Auth] Fetching fresh profile...');
        const profileResult = await authGetProfile();

        if (profileResult.success && profileResult.user) {
          setUser(profileResult.user);
          identifyUser(profileResult.user);
          console.log('[Auth] Session restored with fresh profile for:', profileResult.user.name || profileResult.user.phone);
        } else {
          // Profile fetch failed but we have stored data - use that
          setUser(storedState.user);
          identifyUser(storedState.user);
          console.log('[Auth] Profile fetch failed, using stored data for:', storedState.user.name || storedState.user.phone);
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
        clearAuthData();
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  // ==========================================================================
  // Listen for forced logout events (e.g., token refresh failure)
  // ==========================================================================
  useEffect(() => {
    const handleForcedLogout = () => {
      console.log('[Auth] Received forced logout event - clearing user state');
      setUser(null);
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
  }, []);

  // ==========================================================================
  // Actions
  // ==========================================================================

  /**
   * Login with user data and tokens from OTP verification
   * Optionally fetches fresh profile to ensure we have latest data
   */
  const login = useCallback(async (userData: User, tokens: AuthTokens) => {
    // Store auth state and set user immediately for fast UI response
    storeAuthState(userData, tokens);
    setUser(userData);
    identifyUser(userData);
    trackAuthEvent({ step: 'login_success' });
    console.log('[Auth] User logged in:', userData.name || userData.phone);

    // Notify BasketContext so it can merge the anonymous basket into the user's.
    try {
      window.dispatchEvent(new CustomEvent(AUTH_LOGIN_EVENT));
    } catch {
      // window unavailable
    }

    // Fetch fresh profile in background to ensure we have latest data
    // This is non-blocking - we don't wait for it
    authGetProfile()
      .then((result) => {
        if (result.success && result.user) {
          setUser(result.user);
          console.log('[Auth] Profile synced after login');
        }
      })
      .catch(() => {
        // Profile fetch failed - we already have user data from login
        console.log('[Auth] Profile sync failed, using login data');
      });
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authLogout();
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      setUser(null);
      resetUser();
      trackAuthEvent({ step: 'logout' });
      setIsLoading(false);
      // Notify BasketContext (and other listeners) so user-scoped state is
      // dropped and the anonymous-session basket is re-hydrated. The forced-
      // logout path already dispatches this from apiClient; a user-initiated
      // logout must do the same.
      try {
        window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
      } catch {
        // window unavailable
      }
      console.log('[Auth] User logged out');
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (name: string) => {
    setIsLoading(true);
    try {
      const result = await authUpdateProfile(name);
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        throw new Error(result.error || 'خطا در به‌روزرسانی پروفایل');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get current access token (for manual use if needed)
   */
  const getAccessToken = useCallback((): string | null => {
    const tokens = getStoredTokens();
    return tokens?.access || null;
  }, []);

  /**
   * Manually refresh access token (for rare edge cases)
   */
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    return refreshToken();
  }, []);

  // ==========================================================================
  // Context Value
  // ==========================================================================

  const value: AuthContextType = {
    // State
    user,
    isLoggedIn: !!user,
    isLoading,
    isInitialized,

    // Actions
    login,
    logout,
    updateProfile,
    getAccessToken,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// =============================================================================
// Backwards Compatibility
// =============================================================================

/**
 * @deprecated Use login(user, tokens) instead
 * This is kept for backwards compatibility with old code
 */
export function useAuthLegacy() {
  const auth = useAuth();

  return {
    ...auth,
    // Old setUser behavior (without tokens) - for migration period
    setUser: (userData: User | null) => {
      console.warn('[Auth] setUser is deprecated. Use login(user, tokens) instead.');
      if (userData) {
        // Create placeholder tokens - this won't work with real backend
        const placeholderTokens: AuthTokens = {
          access: `placeholder_${userData.id}`,
          refresh: `placeholder_refresh_${userData.id}`,
        };
        auth.login(userData, placeholderTokens);
      } else {
        auth.logout();
      }
    },
  };
}
