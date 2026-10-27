import { useSiteTranslation } from '@/i18n/siteCopy';
import { lazy, Suspense, useEffect } from "react";
import { useNavigate as useRouterNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import {
  fetchAllProducts,
  fetchProduct,
  parseEntryParams,
} from "../../utils/productLoader";

// Shared Components
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { LazySection } from "../../components/LazySection";

// Above-the-fold Components (loaded immediately)
import { RoomEntrySection } from './components/RoomEntrySection';
import { HeroSection } from "./components/HeroSection";
import { OutputShowcase } from "./components/OutputShowcase";
import { TrustBar } from "./components/TrustBar";

// Below-the-fold Components (lazy loaded for better performance)
const ComparisonSection=lazy(() => import("./components/ComparisonSection").then(m => ({ default: m.ComparisonSection })));
const ShoppingPropSection=lazy(() => import("./components/ShoppingPropSection").then(m => ({ default: m.ShoppingPropSection })));

import { useSeo } from "@/hooks/useSeo";

export function ProductLandingPage() {
  const { siteText } = useSiteTranslation();
  useSeo({
    description: siteText("با هوش مصنوعی HOMA محصولات را قبل از خرید در فضای خانه خود ببینید."),
  });
  const navigate = useRouterNavigate();
  const { setProduct, setAllProducts, trackKPI, setProductVariant } = useApp();

  useEffect(() => {
    const initPage = async () => {
      try {
        // 1. Check for product ID in URL
        const entryContext = parseEntryParams(window.location.href);
        
        if (entryContext?.productId) {
          const currentProduct = await fetchProduct(entryContext.productId);
          if (currentProduct) {
            setProduct(currentProduct);
            if (currentProduct.selectedVariant) {
               setProductVariant(currentProduct.selectedVariant);
            }
          }
        }

        // 2. Load all products for the gallery/suggestions
        const products = await fetchAllProducts();
        setAllProducts(products);

        // 3. Track page view
        trackKPI("Page View", { 
          page: "Landing", 
          productId: entryContext?.productId 
        });

      } catch (error) {
        console.error("Failed to initialize page:", error);
      }
    };

    initPage();
  }, [setProduct, setAllProducts, trackKPI, setProductVariant]);

  const handleGetStarted = () => {
    trackKPI("CTA Clicked", { location: "Landing" });
    navigate("/studio");
  };

  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Above-the-fold content (loaded immediately) */}
        <HeroSection onGetStarted={handleGetStarted} />
        <OutputShowcase onGetStarted={handleGetStarted} />
        <TrustBar />
        <RoomEntrySection />

        {/* Below-the-fold content (lazy loaded for better performance) */}
        <LazySection minHeight="600px">
          <Suspense fallback={<div className="h-96 bg-surface-muted/30 animate-pulse" />}>
            <ComparisonSection />
          </Suspense>
        </LazySection>

        <LazySection minHeight="400px">
          <Suspense fallback={<div className="h-64 bg-surface-muted/30 animate-pulse" />}>
            <ShoppingPropSection />
          </Suspense>
        </LazySection>
      </main>
      <Footer />
    </div>
  );
}