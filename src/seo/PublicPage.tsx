import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { SSRFooter } from "../components/seo/SSRFooter";
import { SeoProductLandingPage } from "../pages/ProductLanding/PublicPage";
import { ExplorePage, type ExploreServerData } from "../pages/Explore";
import { GalleryPage, type GalleryServerData } from "../pages/Gallery";
import { StorePage, type StoreServerData } from "../pages/Store";
import { ProductDetailsPage, type ProductDetailsServerData } from "../pages/ProductDetails";
import { SeoInformationPage } from "../pages/PublicSeoPages";
import type { PublicPageData, PublicProduct } from "./types";

type AppProviderComponent = ComponentType<{ children: ReactNode }>;

function UnavailablePage() {
  return <main className="min-h-screen flex items-center justify-center bg-surface-page px-6" dir="rtl"><div className="text-center space-y-4"><h1 className="text-[28px] font-light">این صفحه در دسترس نیست</h1><a href="/" className="inline-flex h-12 items-center px-6 bg-black text-white text-[13px]">بازگشت به خانه</a></div></main>;
}

/**
 * Route dispatcher. It selects the original public components and passes
 * server-rendered data when available. After hydration, the full interactive
 * components load with context providers.
 */
export function PublicPage({
  data,
  renderBasketCommerce: _renderBasketCommerce,
  renderBuyCommerce: _renderBuyCommerce,
}: {
  data: PublicPageData;
  renderBasketCommerce?: (product: PublicProduct, variantId: number | null) => ReactNode;
  renderBuyCommerce?: (product: PublicProduct) => ReactNode;
}) {
  const [AppProvider, setAppProvider] = useState<AppProviderComponent | null>(null);

  useEffect(() => {
    let active = true;
    void import("../context/AppContext").then(({ AppProvider: BrowserAppProvider }) => {
      if (active) setAppProvider(() => BrowserAppProvider);
    });
    return () => { active = false; };
  }, []);

  const controllersEnabled = Boolean(AppProvider);
  let page: ReactNode;

  if (data.kind === "home") {
    // Home page: keep SeoProductLandingPage (already uses original sections)
    page = <SeoProductLandingPage controllersEnabled={controllersEnabled} />;
  } else if (data.kind === "explore") {
    // Explore page: use original ExplorePage with server data
    const serverData: ExploreServerData = {
      shops: data.shops,
      total: data.total,
      page: data.page,
      breadcrumbs: data.breadcrumbs,
    };
    page = (
      <div className="min-h-screen bg-surface-page flex flex-col">
        <ExplorePage serverData={serverData} />
        <SSRFooter />
      </div>
    );
  } else if (data.kind === "gallery") {
    // Gallery page: use original GalleryPage with server data
    const serverData: GalleryServerData = {
      products: data.products,
      total: data.total,
      page: data.page,
      breadcrumbs: data.breadcrumbs,
    };
    page = (
      <div className="min-h-screen bg-surface-page flex flex-col">
        <GalleryPage serverData={serverData} />
        <SSRFooter />
      </div>
    );
  } else if (data.kind === "store") {
    // Store page: use original StorePage with server data
    const serverData: StoreServerData = {
      shop: data.shop!,
      products: data.products,
      total: data.total,
      page: data.page,
      breadcrumbs: data.breadcrumbs,
    };
    page = (
      <div className="min-h-screen bg-surface-page flex flex-col">
        <StorePage serverData={serverData} />
        <SSRFooter />
      </div>
    );
  } else if (data.kind === "product") {
    // Product page: use original ProductDetailsPage with server data
    const serverData: ProductDetailsServerData = {
      product: data.product!,
      shop: data.shop!,
      breadcrumbs: data.breadcrumbs,
    };
    page = (
      <div className="min-h-screen bg-surface-page flex flex-col">
        <ProductDetailsPage serverData={serverData} />
        <SSRFooter />
      </div>
    );
  } else if (data.kind === "article") {
    // Article pages (FAQ, Terms, Contact, etc.): keep SeoInformationPage
    page = (
      <div className="min-h-screen bg-surface-page flex flex-col">
        <SeoInformationPage data={data} />
        <SSRFooter />
      </div>
    );
  } else {
    page = <UnavailablePage />;
  }

  return AppProvider ? <AppProvider>{page}</AppProvider> : <>{page}</>;
}
