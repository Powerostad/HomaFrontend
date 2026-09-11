import { SSRSafeLink } from "./SSRSafeLink";

interface SSRFooterProps {
  translations?: {
    tagline?: string;
    quickAccess?: string;
    home?: string;
    stores?: string;
    gallery?: string;
    collaboration?: string;
    collaborateWithHoma?: string;
    support?: string;
    faq?: string;
    terms?: string;
    contactUs?: string;
  };
}

/**
 * SSR-safe Footer: renders navigation links with plain <a> tags on server,
 * hydrates to React Router <Link> after mount. Accepts optional translations
 * to avoid requiring useTranslation during server render.
 */
export function SSRFooter({ translations = {} }: SSRFooterProps) {
  const t = {
    tagline: translations.tagline || "طراحی دکوراسیون خانه با هوش مصنوعی",
    quickAccess: translations.quickAccess || "دسترسی سریع",
    home: translations.home || "خانه",
    stores: translations.stores || "فروشگاه‌ها",
    gallery: translations.gallery || "گالری",
    collaboration: translations.collaboration || "همکاری",
    collaborateWithHoma: translations.collaborateWithHoma || "همکاری با هما",
    support: translations.support || "پشتیبانی",
    faq: translations.faq || "سوالات متداول",
    terms: translations.terms || "قوانین و مقررات",
    contactUs: translations.contactUs || "تماس با ما",
  };

  return (
    <footer
      className="w-full pt-16 pb-12 px-6 md:px-12 lg:px-24 overflow-hidden relative bg-surface-page text-content-primary border-t"
      style={{ borderColor: "var(--color-border-default)" }}
    >
      <div className="max-w-7xl mx-auto flex flex-col">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-12 lg:gap-24 mb-16 border-b pb-16" style={{ borderColor: "var(--color-border-default)" }}>
          {/* Top Section: Wordmark & Tagline */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-start max-w-sm">
            <h2
              className="text-[32px] md:text-[42px] font-light tracking-[0.4em] uppercase leading-none mb-8 text-content-primary"
              style={{ fontFamily: "var(--font-family-sf-pro)" }}
            >
              HOMA
            </h2>
            <p
              className="text-p font-light leading-relaxed opacity-40"
              style={{ fontFamily: "var(--font-family-vazirmatn)" }}
            >
              {t.tagline}
            </p>
          </div>

          {/* Middle Section: Links Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-20 w-full lg:w-auto">
            {/* Column 1 */}
            <div className="flex flex-col gap-8 items-start lg:items-end">
              <h3 className="text-[11px] font-medium tracking-[0.3em] uppercase opacity-80">
                {t.quickAccess}
              </h3>
              <ul className="flex flex-col gap-5 text-content-secondary">
                <li>
                  <SSRSafeLink to="/" className="hover:text-content-primary transition-colors text-p font-light">
                    {t.home}
                  </SSRSafeLink>
                </li>
                <li>
                  <SSRSafeLink to="/explore" className="hover:text-content-primary transition-colors text-p font-light">
                    {t.stores}
                  </SSRSafeLink>
                </li>
                <li>
                  <SSRSafeLink to="/gallery" className="hover:text-content-primary transition-colors text-p font-light">
                    {t.gallery}
                  </SSRSafeLink>
                </li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-8 items-start lg:items-end">
              <h3 className="text-[11px] font-medium tracking-[0.3em] uppercase opacity-80">
                {t.collaboration}
              </h3>
              <ul className="flex flex-col gap-5 text-content-secondary">
                <li>
                  <SSRSafeLink to="/collaboration" className="hover:text-content-primary transition-colors text-p font-light">
                    {t.collaborateWithHoma}
                  </SSRSafeLink>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col gap-8 items-start md:items-end">
              <h3 className="text-[11px] font-medium tracking-[0.3em] uppercase opacity-80">
                {t.support}
              </h3>
              <ul className="flex flex-col gap-5 text-start md:text-end text-content-secondary">
                <li>
                  <SSRSafeLink to="/faq" className="hover:text-content-primary transition-colors text-p font-light">
                    {t.faq}
                  </SSRSafeLink>
                </li>
                <li>
                  <SSRSafeLink to="/terms" className="hover:text-content-primary transition-colors text-p font-light">
                    {t.terms}
                  </SSRSafeLink>
                </li>
                <li>
                  <SSRSafeLink to="/contact" className="hover:text-content-primary transition-colors text-p font-light">
                    {t.contactUs}
                  </SSRSafeLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative">
          {/* E-Namad Trust Seal */}
          <div
            className="flex items-center"
            dangerouslySetInnerHTML={{
              __html:
                "<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=731279&Code=pgP9sQsEGONHIBBrO31WWxY6BVAww7Li'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=731279&Code=pgP9sQsEGONHIBBrO31WWxY6BVAww7Li' alt='' style='cursor:pointer' code='pgP9sQsEGONHIBBrO31WWxY6BVAww7Li'></a>",
            }}
          />

          {/* Copyright */}
          <div className="text-center md:text-end">
            <p className="text-[10px] tracking-[0.2em] uppercase text-content-tertiary font-light">
              © 2026 Homa Platform. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
