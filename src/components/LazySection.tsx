import { useRef, useState, useEffect, ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  /** How far before the element is visible to start loading (default: 200px) */
  rootMargin?: string;
  /** Minimum height for the placeholder to prevent layout shifts */
  minHeight?: string;
}

/**
 * A component that defers rendering of its children until they're near the viewport.
 * Uses IntersectionObserver for efficient visibility detection.
 *
 * @example
 * <LazySection minHeight="400px">
 *   <ExpensiveComponent />
 * </LazySection>
 */
export function LazySection({
  children,
  className = '',
  rootMargin = '200px',
  minHeight = '400px',
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        children
      ) : (
        <div
          style={{ minHeight }}
          className="bg-surface-muted/30 animate-pulse"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
