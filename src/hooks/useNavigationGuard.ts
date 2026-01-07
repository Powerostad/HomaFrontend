import { useEffect, useCallback } from 'react';
import { useBlocker, type BlockerFunction } from 'react-router-dom';

/**
 * useNavigationGuard - Warns users before leaving during processing
 *
 * This hook provides two types of protection:
 * 1. Browser-level: Uses `beforeunload` to warn when closing tab/refreshing
 * 2. In-app: Uses React Router's `useBlocker` for in-app navigation
 *
 * @param shouldBlock - Whether to block navigation (e.g., during processing)
 * @param message - Optional custom message (used for in-app navigation dialog)
 *
 * @example
 * ```tsx
 * // In a progress page:
 * useNavigationGuard(processingStatus === 'processing');
 *
 * // With custom message:
 * useNavigationGuard(isUploading, 'آپلود در حال انجام است');
 * ```
 */
export function useNavigationGuard(
  shouldBlock: boolean,
  message: string = 'پردازش در حال انجام است. آیا می‌خواهید صفحه را ترک کنید؟'
): void {
  // Handle browser refresh/close with beforeunload
  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Modern browsers ignore custom messages, but we need to set returnValue
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock, message]);

  // Handle in-app navigation with React Router's blocker
  // This shows a confirmation dialog when user tries to navigate away
  const blockerFn: BlockerFunction = useCallback(
    ({ currentLocation, nextLocation }) => {
      // Only block if shouldBlock is true and we're actually navigating somewhere else
      return shouldBlock && currentLocation.pathname !== nextLocation.pathname;
    },
    [shouldBlock]
  );

  const blocker = useBlocker(blockerFn);

  // Show confirmation dialog when blocked
  useEffect(() => {
    if (blocker.state === 'blocked') {
      // Use browser's confirm dialog (works in all browsers)
      const confirmed = window.confirm(message);

      if (confirmed) {
        // User confirmed, proceed with navigation
        blocker.proceed();
      } else {
        // User cancelled, reset the blocker
        blocker.reset();
      }
    }
  }, [blocker, message]);
}

export default useNavigationGuard;
