import { useEffect } from 'react';

/**
 * useNavigationGuard - Warns users before leaving during processing
 *
 * Uses browser's `beforeunload` event to warn when closing tab/refreshing.
 *
 * Note: In-app navigation blocking (useBlocker) requires a data router
 * (createBrowserRouter). Since we use BrowserRouter, we only support
 * browser-level protection for now.
 *
 * @param shouldBlock - Whether to block navigation (e.g., during processing)
 * @param _message - Optional custom message (kept for API compatibility)
 *
 * @example
 * ```tsx
 * // In a progress page:
 * useNavigationGuard(processingStatus === 'processing');
 * ```
 */
export function useNavigationGuard(
  shouldBlock: boolean,
  _message?: string
): void {
  // Handle browser refresh/close with beforeunload
  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Modern browsers ignore custom messages, but we need to set returnValue
      event.preventDefault();
      // Note: Custom messages are ignored by modern browsers for security
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock]);
}

export default useNavigationGuard;
