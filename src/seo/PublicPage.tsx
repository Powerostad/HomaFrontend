import { useSiteTranslation } from '@/i18n/siteCopy';
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BilingualSwitch } from '../components/BilingualSwitch';
import { SSRFooter } from "../components/seo/SSRFooter";
import { isRTL } from "../i18n/config";
import {
  SeoExplorePage,
  SeoGalleryPage,
  SeoHome,
  SeoInformationPage,
  SeoProductDetailsPage,
  SeoStorePage,
} from "../pages/PublicSeoPages";
import "./public.css";
import type { PublicPageData, PublicProduct } from "./types";

type AppProviderComponent = ComponentType<{ children: ReactNode }>;

function UnavailablePage() {
  const { siteText, siteDirection } = useSiteTranslation();
  return <main className="min-h-screen flex items-center justify-center bg-surface-page px-6" dir={siteDirection()}><div className="text-center space-y-4"><h1 className="text-[28px] font-light">{siteText("این صفحه در دسترس نیست")}</h1><a href="/" className="inline-flex h-12 items-center px-6 bg-black text-white text-[13px]">{siteText("بازگشت به خانه")}</a></div></main>;
}

/**
 * Crawlable shell header. Renders real <a> navigation with the language of
 * the active i18n instance so crawlers see translated chrome; the interactive
 * header loads client-side after hydration.
 */
function SeoHeader() {
  const { siteText } = useSiteTranslation();
  const { t, i18n } = useTranslation();
  return (
    <header className="seo-header" lang={i18n.language} dir={isRTL(i18n.language) ? "rtl" : "ltr"}>
      <a className="seo-brand" href="/" aria-label="HOMA">
        HOMA<span>{siteText("هُما")}</span>
      </a>
      <nav aria-label={t("seo.header.label", "راهبری اصلی")}>
        <a href="/explore">{t("seo.header.explore", "فروشگاه‌ها")}</a>
        <a href="/gallery">{t("seo.header.gallery", "محصولات")}</a>
        <a href="/account/gallery">{t("seo.header.account", "حساب کاربری")}</a>
        <a href="/basket">{t("seo.header.basket", "سبد خرید")}</a>
        <BilingualSwitch />
      </nav>
    </header>
  );
}

/**
 * Route dispatcher. It selects the crawler-safe public components that render
 * complete content from server data (no router hooks, no browser globals).
 * After hydration, the AppProvider enables the commerce slots on product pages
 * and the full interactive chrome takes over client-side.
 */
export function PublicPage({
  data,
  renderBasketCommerce,
  renderBuyCommerce,
}: {
  data: PublicPageData;
  renderBasketCommerce?: (product: PublicProduct, variantId: number | null) => ReactNode;
  renderBuyCommerce?: (product: PublicProduct) => ReactNode;
}) {
  const { siteText, siteValue, siteDirection } = useSiteTranslation();
  const { i18n } = useTranslation();
  const [AppProvider, setAppProvider] = useState<AppProviderComponent | null>(null);

  useEffect(() => {
    let active = true;
    void import("../context/AppContext").then(({ AppProvider: BrowserAppProvider }) => {
      if (active) setAppProvider(() => BrowserAppProvider);
    });
    return () => { active = false; };
  }, []);

  let content: ReactNode;
  if (data.kind === "home") {
    content = <SeoHome />;
  } else if (data.kind === "explore") {
    content = <SeoExplorePage data={data} />;
  } else if (data.kind === "gallery") {
    content = <SeoGalleryPage data={data} />;
  } else if (data.kind === "store") {
    content = <SeoStorePage data={data} />;
  } else if (data.kind === "product") {
    content = (
      <SeoProductDetailsPage
        data={data}
        renderBasketCommerce={renderBasketCommerce}
        renderBuyCommerce={renderBuyCommerce}
      />
    );
  } else if (data.kind === "article") {
    content = <SeoInformationPage data={data} />;
  } else {
    content = <UnavailablePage />;
  }

  const shell = (
    <div className="seo-public" dir={siteDirection()} lang={i18n.language}>
      <a className="seo-skip" href="#seo-main">{siteText("پرش به محتوای اصلی")}</a>
      <SeoHeader />
      <main id="seo-main" className="seo-main">
        {siteValue(content)}
      </main>
      <SSRFooter />
    </div>
  );

  return AppProvider ? <AppProvider>{siteValue(shell)}</AppProvider> : shell;
}
