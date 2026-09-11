import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * SSR-safe link: renders a plain <a> during server render and initial hydration,
 * then switches to React Router <Link> for client-side navigation after mount.
 * This ensures crawlers see real href links while users get SPA navigation.
 */
export function SSRSafeLink({
  to,
  children,
  className,
  "aria-label": ariaLabel,
  ...rest
}: {
  to: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  [key: string]: unknown;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <a href={to} className={className} aria-label={ariaLabel} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className} aria-label={ariaLabel} {...rest}>
      {children}
    </Link>
  );
}
