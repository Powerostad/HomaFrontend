import { lazy, Suspense, useEffect } from "react";
import { useNavigate as useRouterNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import {
  fetchProduct,
  parseEntryParams,
} from "../../utils/productLoader";

// Shared Components
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";
import { LazySection } from "../../components/LazySection";

// Above-the-fold Components (loaded immediately)
import { RoomEntrySection } from './components/RoomEntrySection';
import { HomeIntro } from "./components/HomeIntro";
import { homepageMetadata } from "./metadata";
import { trackHomepageOrganicLanding, trackHomepageStudioClick } from "@/analytics/studioFunnel";
import { OutputShowcase } from "./components/OutputShowcase";
import { TrustBar } from "./components/TrustBar";

// Below-the-fold Components (lazy loaded for better performance)
const ComparisonSection=lazy(() => import("./components/ComparisonSection").then(m => ({ default: m.ComparisonSection })));
const ShoppingPropSection=lazy(() => import("./components/ShoppingPropSection").then(m => ({ default: m.ShoppingPropSection })));

import { useSeo } from "@/hooks/useSeo";

export function ProductLandingPage() {
  useSeo(homepageMetadata);
  const navigate = useRouterNavigate();
  const { setProduct, setProductVariant } = useApp();

  useEffect(() => {
    trackHomepageOrganicLanding();
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

      } catch (error) {
        console.error("Failed to initialize page:", error);
      }
    };

    initPage();
  }, [setProduct, setProductVariant]);

  const handleGetStarted = () => {
    trackHomepageStudioClick();
    navigate("/studio");
  };

  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Above-the-fold content (loaded immediately) */}
        <HomeIntro onStudioStart={trackHomepageStudioClick} />
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
