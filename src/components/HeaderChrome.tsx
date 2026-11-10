import { useSiteTranslation } from '@/i18n/siteCopy';
import type { ReactNode } from "react";

interface HeaderChromeProps {
  transparent?: boolean;
  hideSpacer?: boolean;
  menu: ReactNode;
  brand: ReactNode;
  utilities: ReactNode;
}

/** Shared, provider-free markup for the established public header. */
export function HeaderChrome({
  transparent = false,
  hideSpacer = false,
  menu,
  brand,
  utilities,
}: HeaderChromeProps) {
  const { siteValue, siteDirection } = useSiteTranslation();
  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 w-full transition-all duration-500 ${transparent ? "bg-transparent border-transparent" : "bg-surface-page/90 backdrop-blur-xl border-b"}`}
        style={{
          zIndex: "var(--z-fixed)",
          height: "var(--header-height)",
          borderColor: transparent ? "transparent" : "var(--color-border-default)",
        }}
        dir={siteDirection()}
      >
        <div className="h-full border-b transition-colors duration-700" style={{ borderColor: transparent ? "rgba(255,255,255,0.1)" : "var(--color-border-default)" }}>
          <div className="h-full mx-auto px-8 md:px-16 grid grid-cols-3 items-center" style={{ maxWidth: "var(--max-width-content)" }}>
            <div className="flex justify-start">{siteValue(menu)}</div>
            <div className="flex justify-center">{siteValue(brand)}</div>
            <div className="flex justify-end items-center gap-4 md:gap-6">{siteValue(utilities)}</div>
          </div>
        </div>
      </header>
      {siteValue(!transparent && !hideSpacer && <div className="h-[64px] md:h-[80px]" />)}
    </>
  );
}
