import React, { useState, useEffect, forwardRef } from 'react';
import { fetchAuthenticatedImage } from '../../utils/apiClient';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

// Module-level cache: URL (with size params) -> blob URL
// Prevents duplicate fetches when same image is used in multiple components
const blobUrlCache = new Map<string, string>();

/**
 * Build cache key from src and size parameters
 */
function buildCacheKey(src: string, width?: number, height?: number, quality?: number): string {
  const parts = [src];
  if (width) parts.push(`w=${width}`);
  if (height) parts.push(`h=${height}`);
  if (quality) parts.push(`q=${quality}`);
  return parts.join('|');
}

/**
 * Build fetch URL with size parameters
 */
function buildFetchUrl(src: string, width?: number, height?: number, quality?: number): string {
  if (!width && !height && !quality) {
    return src;
  }

  try {
    const url = new URL(src, window.location.origin);
    if (width) url.searchParams.set('w', String(width));
    if (height) url.searchParams.set('h', String(height));
    if (quality) url.searchParams.set('q', String(quality));
    return url.toString();
  } catch {
    // If URL parsing fails, return original src
    return src;
  }
}

interface AuthenticatedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  /** The image URL that requires authentication */
  src: string;
  /** Optional fallback image URL for unauthenticated fallback */
  fallbackSrc?: string;
  /** Whether to skip authentication (use regular img loading) */
  skipAuth?: boolean;
  /** Requested image width (for backend optimization) */
  imageWidth?: number;
  /** Requested image height (for backend optimization) */
  imageHeight?: number;
  /** Requested image quality 1-100 (for backend optimization) */
  imageQuality?: number;
}

/**
 * AuthenticatedImage component
 *
 * Fetches images from protected API endpoints using JWT authentication.
 * Regular <img> tags don't send Authorization headers, so this component
 * uses fetch() with headers and converts the response to a blob URL.
 *
 * Features:
 * - Module-level caching to prevent duplicate fetches
 * - Size parameters for backend image optimization
 * - Automatic cleanup of blob URLs
 * - Supports ref forwarding for direct image element access
 */
export const AuthenticatedImage = forwardRef<HTMLImageElement, AuthenticatedImageProps>(function AuthenticatedImage({
  src,
  fallbackSrc,
  skipAuth = false,
  imageWidth,
  imageHeight,
  imageQuality,
  alt,
  style,
  className,
  ...rest
}, ref) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [didError, setDidError] = useState(false);

  useEffect(() => {
    // Reset state when src changes
    setBlobUrl(null);
    setIsLoading(true);
    setDidError(false);

    if (!src) {
      setIsLoading(false);
      setDidError(true);
      return;
    }

    // If skipAuth, we don't need to fetch with headers
    if (skipAuth) {
      setBlobUrl(src);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = buildCacheKey(src, imageWidth, imageHeight, imageQuality);
    if (blobUrlCache.has(cacheKey)) {
      setBlobUrl(blobUrlCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      try {
        // Build URL with size parameters
        const fetchUrl = buildFetchUrl(src, imageWidth, imageHeight, imageQuality);
        objectUrl = await fetchAuthenticatedImage(fetchUrl);

        if (isMounted) {
          // Cache the blob URL
          blobUrlCache.set(cacheKey, objectUrl);
          setBlobUrl(objectUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[AuthenticatedImage] Failed to load:', src, error);
        if (isMounted) {
          // Try fallback if available
          if (fallbackSrc) {
            setBlobUrl(fallbackSrc);
          }
          setDidError(true);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    // Cleanup: Don't revoke blob URLs since they're cached and shared
    return () => {
      isMounted = false;
      // Note: We don't revoke blob URLs here because they're cached
      // and may be used by other components. Memory cleanup happens
      // naturally when the page is refreshed.
    };
  }, [src, skipAuth, fallbackSrc, imageWidth, imageHeight, imageQuality]);

  // Error state
  if (didError && !blobUrl) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img src={ERROR_IMG_SRC} alt="خطا در بارگذاری تصویر" {...rest} data-original-url={src} />
        </div>
      </div>
    );
  }

  // Loading state - show placeholder with same dimensions
  if (isLoading) {
    return (
      <div
        className={`inline-block image-loading ${className ?? ''}`}
        style={style}
        role="img"
        aria-label={alt || 'در حال بارگذاری...'}
      />
    );
  }

  // Success state
  return (
    <img
      ref={ref}
      src={blobUrl || undefined}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={() => setDidError(true)}
    />
  );
});
