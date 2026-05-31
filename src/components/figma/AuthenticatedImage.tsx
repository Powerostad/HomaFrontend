import React, { useState, useEffect, forwardRef } from 'react';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

interface AuthenticatedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  /** The image URL — a public CDN URL or a presigned URL. */
  src: string;
  /** Optional fallback image URL shown if the image fails to load. */
  fallbackSrc?: string;
  /** @deprecated No longer used — images load directly via <img>. */
  skipAuth?: boolean;
  /** @deprecated No-op — resizing is server-side (eager variants). */
  imageWidth?: number;
  /** @deprecated No-op — resizing is server-side (eager variants). */
  imageHeight?: number;
  /** @deprecated No-op — resizing is server-side (eager variants). */
  imageQuality?: number;
}

/**
 * AuthenticatedImage component
 *
 * Renders an image with a plain <img> tag. Images are served directly from the
 * CDN (public) or via presigned URLs (private) — no Authorization header is
 * needed, so no fetch()/blob indirection. Kept as a thin wrapper purely so the
 * many existing call sites (and their loading/error UX) stay unchanged.
 */
export const AuthenticatedImage = forwardRef<HTMLImageElement, AuthenticatedImageProps>(function AuthenticatedImage({
  src,
  fallbackSrc,
  // Deprecated props — destructured so they are not spread onto the DOM node.
  skipAuth: _skipAuth,
  imageWidth: _imageWidth,
  imageHeight: _imageHeight,
  imageQuality: _imageQuality,
  alt,
  style,
  className,
  ...rest
}, ref) {
  const [isLoading, setIsLoading] = useState(true);
  const [didError, setDidError] = useState(false);

  // Reset load/error state whenever the source changes.
  useEffect(() => {
    setIsLoading(true);
    setDidError(false);
  }, [src]);

  // Missing src — show the error placeholder.
  if (!src || didError) {
    if (fallbackSrc && !didError) {
      // (fallbackSrc with no error is unreachable, kept for clarity)
    }
    const resolvedSrc = didError && fallbackSrc ? fallbackSrc : null;
    if (resolvedSrc) {
      return (
        <img
          ref={ref}
          src={resolvedSrc}
          alt={alt}
          className={className}
          style={style}
          {...rest}
        />
      );
    }
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

  return (
    <>
      {isLoading && (
        <div
          className={`inline-block image-loading ${className ?? ''}`}
          style={style}
          role="img"
          aria-label={alt || 'در حال بارگذاری...'}
        />
      )}
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        style={isLoading ? { ...style, display: 'none' } : style}
        {...rest}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setDidError(true);
        }}
      />
    </>
  );
});
