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
} from '@/services/authService';
import { getStoredTokens, clearAuthData } from '@/utils/apiClient';
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

        // Token is valid (or was just refreshed) - restore user
        setUser(storedState.user);
        console.log('[Auth] Session restored for user:', storedState.user.name || storedState.user.phone);
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
  // Actions
  // ==========================================================================

  /**
   * Login with user data and tokens from OTP verification
   */
  const login = useCallback((userData: User, tokens: AuthTokens) => {
    storeAuthState(userData, tokens);
    setUser(userData);
    console.log('[Auth] User logged in:', userData.name || userData.phone);
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
      setIsLoading(false);
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
