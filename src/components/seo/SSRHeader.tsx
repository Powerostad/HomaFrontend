import { useEffect, useState, type ComponentType } from "react";
import { Menu, ShoppingBag, User } from "lucide-react";
import { HeaderChrome } from "../HeaderChrome";

type HeaderController = ComponentType<{ hideSpacer?: boolean }>;

interface SSRHeaderProps {
  hideSpacer?: boolean;
  transparent?: boolean;
}

/**
 * SSR-safe Header: renders a server-compatible header with plain <a> tags
 * during server render and initial hydration. After mount, lazy-loads the
 * full authenticated Header component with menu, auth, and basket functionality.
 *
 * This ensures crawlers see real navigation links while users get the full
 * interactive header after client-side hydration.
 */
export function SSRHeader({ hideSpacer = false, transparent = false }: SSRHeaderProps) {
  const [HeaderController, setHeaderController] = useState<HeaderController | null>(null);
  const utilityClass = `transition-all duration-500 ${transparent ? "text-white/60 hover:text-white" : "text-black/40 hover:text-black hover:scale-110"}`;

  useEffect(() => {
    let active = true;
    void import("../Header").then(({ Header }) => {
      if (active) setHeaderController(() => Header);
    });
    return () => { active = false; };
  }, []);

  // After hydration, render the full interactive Header
  if (HeaderController) return <HeaderController hideSpacer={hideSpacer} />;

  // Server-render and initial hydration: plain <a> links
  return (
    <HeaderChrome
      hideSpacer={hideSpacer}
      transparent={transparent}
      menu={
        <a href="#homa-navigation" className={`p-2 ${utilityClass}`} aria-label="منو">
          <Menu size={18} strokeWidth={1} />
        </a>
      }
      brand={
        <a href="/" className="flex items-center">
          <span
            className={`text-[20px] md:text-[24px] font-light tracking-[0.4em] uppercase leading-none transition-all duration-700 ${transparent ? "text-white" : "text-black"}`}
            style={{ fontFamily: "var(--font-family-sf-pro)" }}
          >
            HOMA
          </span>
        </a>
      }
      utilities={
        <>
          <a href="/basket" className={`relative p-2 ${utilityClass}`} aria-label="سبد خرید">
            <ShoppingBag size={18} strokeWidth={1} />
          </a>
          <a href="/account/gallery" className={utilityClass} aria-label="حساب کاربری">
            <User size={18} strokeWidth={1} />
          </a>
        </>
      }
    />
  );
}
