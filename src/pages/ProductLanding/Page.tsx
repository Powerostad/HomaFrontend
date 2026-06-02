import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate as useRouterNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import {
  parseEntryParams,
  fetchProduct,
  fetchAllProducts,
} from "../../utils/productLoader";

// Shared Components
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { LazySection } from "../../components/LazySection";

// Above-the-fold Components (loaded immediately)
import { HeroSection } from "./components/HeroSection";
import { TrustBar } from "./components/TrustBar";
import { OutputShowcase } from "./components/OutputShowcase";

// Below-the-fold Components (lazy loaded for better performance)
const ComparisonSection = lazy(() => import("./components/ComparisonSection").then(m => ({ default: m.ComparisonSection })));
const ShoppingPropSection = lazy(() => import("./components/ShoppingPropSection").then(m => ({ default: m.ShoppingPropSection })));

import { HomaLoader } from "../../components/HomaLoader";
import { useSeo } from "@/hooks/useSeo";

export function ProductLandingPage() {
  useSeo({
    description: "با هوش مصنوعی HOMA محصولات را قبل از خرید در فضای خانه خود ببینید.",
  });
  const navigate = useRouterNavigate();
  const { setProduct, setAllProducts, trackKPI, setProductVariant } = useApp();
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, [setProduct, setAllProducts, trackKPI, setProductVariant]);

  const handleGetStarted = () => {
    trackKPI("CTA Clicked", { location: "Landing" });
    // Navigate to explore page where users can select a product to try-on
    // (Try-on flow now requires a product ID in URL: /try-on/:productId/upload)
    navigate("/explore");
  };

  if (isLoading) {
    return <HomaLoader />;
  }

  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      <Header 
        hideSpacer={true}
      />
      
      <main className="flex-grow">
        {/* Above-the-fold content (loaded immediately) */}
        <HeroSection onGetStarted={handleGetStarted} />
        <OutputShowcase onGetStarted={handleGetStarted} />
        <TrustBar />

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