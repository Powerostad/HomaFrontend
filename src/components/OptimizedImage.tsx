import { useState } from 'react';

interface OptimizedImageProps {
  src: string;              // Original path with extension (e.g., /images/hero/before.png)
  alt: string;
  className?: string;
  priority?: boolean;       // true for LCP images (adds fetchpriority="high")
  lazy?: boolean;           // true for below-fold images
}

/**
 * Optimized image component with WebP support and mobile variants.
 *
 * Expects images to exist as:
 * - {basePath}.webp (desktop WebP)
 * - {basePath}-mobile.webp (mobile WebP, max 768px)
 * - Original file as fallback
 *
 * @example
 * // For LCP image (hero)
 * <OptimizedImage src="/images/hero/before.png" alt="Before" priority />
 *
 * // For below-fold images
 * <OptimizedImage src="/images/comparison/rug/before.jpg" alt="Before" lazy />
 */
export function OptimizedImage({
  src,
  alt,
  className = '',
  priority = false,
  lazy = false,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  // Extract base path and extension
  const lastDot = src.lastIndexOf('.');
  const basePath = lastDot > 0 ? src.substring(0, lastDot) : src;

  // WebP paths
  const webpSrc = `${basePath}.webp`;
  const webpMobileSrc = `${basePath}-mobile.webp`;

  if (error) {
    // Fallback to original format if WebP fails
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={lazy ? 'lazy' : undefined}
        decoding={priority ? 'sync' : 'async'}
        draggable={false}
      />
    );
  }

  return (
    <picture>
      {/* Mobile WebP (smaller file for viewports < 768px) */}
      <source
        media="(max-width: 767px)"
        srcSet={webpMobileSrc}
        type="image/webp"
      />
      {/* Desktop WebP */}
      <source
        srcSet={webpSrc}
        type="image/webp"
      />
      {/* Fallback to original format */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={lazy ? 'lazy' : undefined}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        onError={() => setError(true)}
        draggable={false}
      />
    </picture>
  );
}
