/**
 * ProtectedRoute - محافظت از مسیرهای احراز هویت شده
 *
 * Features:
 * - Shows loader while checking auth state
 * - Modal fallback: Shows AuthModal overlay when not logged in
 * - Redirect fallback: Redirects to login page
 * - Stores intended destination for post-login redirect
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from './AuthModal';
import { HomaLoader } from './HomaLoader';
import type { User, AuthTokens } from '@/types/auth';

// =============================================================================
// Constants
// =============================================================================

/**
 * Session storage key for storing redirect destination
 */
const AUTH_REDIRECT_KEY = 'homa_auth_redirect';

// =============================================================================
// Types
// =============================================================================

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * How to handle unauthenticated users:
   * - "modal": Show AuthModal overlay (default)
   * - "redirect": Redirect to login page
   */
  fallback?: 'modal' | 'redirect';
  /**
   * Path to redirect to when fallback is "redirect"
   * Default: "/login"
   */
  redirectTo?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Store intended destination for post-login redirect
 */
export function storeAuthRedirect(path: string): void {
  sessionStorage.setItem(AUTH_REDIRECT_KEY, path);
}

/**
 * Get and clear stored redirect destination
 */
export function getAndClearAuthRedirect(): string | null {
  const path = sessionStorage.getItem(AUTH_REDIRECT_KEY);
  if (path) {
    sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  }
  return path;
}

// =============================================================================
// Component
// =============================================================================

export function ProtectedRoute({
  children,
  fallback = 'modal',
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isInitialized, login } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ==========================================================================
  // Handle auth state changes
  // ==========================================================================
  useEffect(() => {
    if (!isInitialized) {
      // Still checking auth - wait
      return;
    }

    if (!isLoggedIn) {
      if (fallback === 'redirect') {
        // Store current path for post-login redirect
        storeAuthRedirect(location.pathname + location.search);
        // Redirect to login
        navigate(redirectTo, { replace: true });
      } else {
        // Show auth modal
        setShowAuthModal(true);
      }
    } else {
      // User is logged in - hide modal if it was showing
      setShowAuthModal(false);
    }
  }, [isLoggedIn, isInitialized, fallback, redirectTo, navigate, location]);

  // ==========================================================================
  // Handle successful login from modal
  // ==========================================================================
  const handleLoginSuccess = (user: User, tokens: AuthTokens) => {
    login(user, tokens);
    setShowAuthModal(false);

    // Check for stored redirect
    const redirectPath = getAndClearAuthRedirect();
    if (redirectPath && redirectPath !== location.pathname) {
      navigate(redirectPath, { replace: true });
    }
  };

  // ==========================================================================
  // Handle modal close (user cancelled)
  // ==========================================================================
  const handleModalClose = () => {
    setShowAuthModal(false);
    // Navigate back to previous page
    navigate(-1);
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  // Show loader while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <HomaLoader />
      </div>
    );
  }

  // User is logged in - render protected content
  if (isLoggedIn) {
    return <>{children}</>;
  }

  // Redirect fallback - will redirect in useEffect, render nothing
  if (fallback === 'redirect') {
    return null;
  }

  // Modal fallback - render children with auth modal overlay
  return (
    <>
      {/* Render children in background (possibly blurred/dimmed) */}
      <div className="pointer-events-none opacity-50 blur-sm">
        {children}
      </div>

      {/* Auth modal overlay */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleModalClose}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}

// =============================================================================
// Export default
// =============================================================================

export default ProtectedRoute;
