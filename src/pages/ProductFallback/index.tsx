import { useLocation as useRouterLocation, useNavigate as useRouterNavigate } from "react-router-dom";
import { ProductFallback } from "../../components/ProductFallback";
import { useSession } from "../../context/AppProviders";
import { getSuggestedProducts } from "../../utils/productLoader";
import { useState, useEffect } from "react";
import type { Product } from "../../types/product";

// Valid reason types matching ProductFallback component
type FallbackReason = "not_found" | "inactive" | "out_of_stock" | "error";

const VALID_REASONS: FallbackReason[] = ["not_found", "inactive", "out_of_stock", "error"];

function isValidReason(reason: string): reason is FallbackReason {
  return VALID_REASONS.includes(reason as FallbackReason);
}

export function ProductFallbackPage() {
  const location = useRouterLocation();
  const navigate = useRouterNavigate();
  const { trackKPI } = useSession();
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);

  const state = location.state as { reason?: string; category?: string } | null;
  const reasonParam = state?.reason || "not_found";
  const reason: FallbackReason = isValidReason(reasonParam) ? reasonParam : "not_found";
  const category = state?.category || "furniture";

  useEffect(() => {
    setSuggestedProducts(getSuggestedProducts(category, 3));
  }, [category]);

  const handleSelectSuggested = (productId: string) => {
    trackKPI("Suggested Product Selected", { newProductId: productId, previousReason: reason });
    // Reload/Navigate to entry with new product
    window.location.href = `/?productId=${productId}&utm_source=suggestion`;
  };

  const handleUploadFallback = () => {
    trackKPI("Fallback Upload", { reason });
    navigate("/upload"); // or wherever default upload goes
  };

  return (
    <ProductFallback
      reason={reason}
      suggestedProducts={suggestedProducts}
      onSelectProduct={handleSelectSuggested}
      onUploadForSuggestions={handleUploadFallback}
    />
  );
}