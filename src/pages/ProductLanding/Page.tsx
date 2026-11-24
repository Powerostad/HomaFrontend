import { useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  fetchProduct,
  parseEntryParams,
} from "../../utils/productLoader";

// Shared Components
import { Footer } from "../../components/Footer";
import { Header } from "../../components/Header";

// Above-the-fold Components (loaded immediately)
import { ProductLandingContent } from "./PublicPage";
import { homepageMetadata } from "./metadata";
import { trackHomepageOrganicLanding, trackHomepageStudioClick } from "@/analytics/studioFunnel";

import { useSeo } from "@/hooks/useSeo";

export function ProductLandingPage() {
  useSeo(homepageMetadata);
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

  return (
    <div className="homa-homepage min-h-screen flex flex-col">
      <Header editorial hideSpacer />
      <ProductLandingContent onStudioStart={trackHomepageStudioClick} />
      <Footer />
    </div>
  );
}
