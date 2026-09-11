import { useEffect, useState, type ComponentType } from "react";
import { Menu, ShoppingBag, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HeaderChrome } from "../components/HeaderChrome";

type HeaderController = ComponentType<{ hideSpacer?: boolean }>;

/**
 * Server markup reuses the exact HeaderChrome layout with real links. Once the
 * initial document hydrates, the existing authenticated Header controller is
 * loaded so menu, login, signed-in state, and basket behaviour are unchanged.
 */
export function PublicChromeHeader({ controllersEnabled = false }: { controllersEnabled?: boolean }) {
  const { t } = useTranslation();
  const [HeaderController, setHeaderController] = useState<HeaderController | null>(null);
  const utilityClass = "transition-all duration-500 text-black/40 hover:text-black hover:scale-110";

  useEffect(() => {
    let active = true;
    if (controllersEnabled) {
      void import("../components/Header").then(({ Header }) => {
        if (active) setHeaderController(() => Header);
      });
    }
    return () => { active = false; };
  }, [controllersEnabled]);

  if (HeaderController) return <HeaderController hideSpacer />;

  return (
    <>
      <HeaderChrome
        hideSpacer
        menu={<a href="#homa-navigation" className={`p-2 ${utilityClass}`} aria-label={t("nav.menu")} data-ph-capture-attribute-nav="menu"><Menu size={18} strokeWidth={1} /></a>}
        brand={<a href="/" className="flex items-center" data-ph-capture-attribute-nav="logo"><span className="text-[20px] md:text-[24px] font-light tracking-[0.4em] uppercase leading-none transition-all duration-700 text-black" style={{ fontFamily: "var(--font-family-sf-pro)" }}>HOMA</span></a>}
        utilities={<><a href="/basket" className={`relative p-2 ${utilityClass}`} aria-label={t("basket.title", "سبد خرید")} data-ph-capture-attribute-nav="basket"><ShoppingBag size={18} strokeWidth={1} /></a><a href="/account/gallery" className={utilityClass} aria-label={t("auth.login")} data-ph-capture-attribute-nav="account"><User size={18} strokeWidth={1} /></a></>}
      />
      <nav id="homa-navigation" className="sr-only" aria-label={t("nav.menu")}>
        <a href="/">{t("nav.home")}</a><a href="/explore">{t("nav.stores")}</a><a href="/studio/upload">{t("nav.studio")}</a><a href="/contact">{t("nav.contactUs")}</a><a href="/faq">{t("nav.faq")}</a>
      </nav>
    </>
  );
}
