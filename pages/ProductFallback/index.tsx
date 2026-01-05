import { useLocation as useRouterLocation, useNavigate as useRouterNavigate } from "react-router-dom";
import { ProductFallback } from "../../components/ProductFallback";
import { useApp } from "../../context/AppContext";
import { getSuggestedProducts } from "../../utils/productLoader";
import { useState, useEffect } from "react";

export function ProductFallbackPage() {
  const location = useRouterLocation();
  const navigate = useRouterNavigate();
  const { trackKPI } = useApp();
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  const state = location.state as { reason?: string; category?: string } | null;
  const reason = state?.reason || "not_found";
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
      reason={reason as any}
      suggestedProducts={suggestedProducts}
      onSelectProduct={handleSelectSuggested}
      onUploadForSuggestions={handleUploadFallback}
    />
  );
}