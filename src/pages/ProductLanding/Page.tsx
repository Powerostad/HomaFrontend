import { useEffect, useState } from "react";
import { useNavigate as useRouterNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import {
  parseEntryParams,
  fetchProduct,
  fetchAllProducts,
  validateProduct,
} from "../../utils/productLoader";

// Shared Components
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { ZoomParallax } from "../../components/ZoomParallax";

// Page Specific Components
import { HeroSection } from "./components/HeroSection";
import { TrustBar } from "./components/TrustBar";
import { OutputShowcase } from "./components/OutputShowcase";
import { ComparisonSection } from "./components/ComparisonSection";
import { ShoppingPropSection } from "./components/ShoppingPropSection";
import { HomaLoader } from "../../components/HomaLoader";

const PARALLAX_IMAGES = [
  // ... kept for reference if needed, but not used in render
];

export function ProductLandingPage() {
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
    navigate("/try-on/upload"); // Changed: Now goes to try-on instead of studio
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
        <HeroSection onGetStarted={handleGetStarted} />
        <OutputShowcase onGetStarted={handleGetStarted} />
        <TrustBar />
        <ComparisonSection />
        <ShoppingPropSection />
      </main>
      <Footer />
    </div>
  );
}