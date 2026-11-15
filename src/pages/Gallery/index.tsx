import { useSeo } from "@/hooks/useSeo";
import { useSiteTranslation } from '@/i18n/siteCopy';
import { useEffect, useState } from "react";
import { useNavigate as useRouterNavigate } from "react-router-dom";
import { HomaLoader } from "../../components/HomaLoader";
import { ProductGallery } from "../../components/ProductGallery";
import { useApp } from "../../context/AppContext";
import { fetchAllProducts, fetchProduct, validateProduct } from "../../utils/productLoader";

export function GalleryPage() {
  const { siteText } = useSiteTranslation();
  useSeo({
    title: siteText("گالری الهام‌بخش"),
    description: siteText("نمونه‌های واقعی محصولات در فضای کاربران HOMA برای الهام گرفتن."),
  });
  const navigate = useRouterNavigate();
  const { allProducts, setAllProducts, setProduct, setProductVariant, trackKPI } = useApp();
  const [isLoading, setIsLoading] = useState(allProducts.length === 0);

  useEffect(() => {
    // Ensure products are loaded if user comes directly to /gallery
    if (allProducts.length === 0) {
      const loadProducts = async () => {
        try {
          setIsLoading(true);
          const products = await fetchAllProducts();
          setAllProducts(products);
        } catch (error) {
          console.error("Error loading gallery:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadProducts();
    } else {
      setIsLoading(false);
    }
  }, [allProducts.length, setAllProducts]);

  const handleProductSelect = async (productId: string) => {
    trackKPI("Gallery Product Selected", { productId });
    
    // Basic loading indicator could be added here
    try {
      const productData = await fetchProduct(productId);
      if (productData && validateProduct(productData).isValid) {
        setProduct(productData);
        setProductVariant({
          color: productData.selectedVariant?.color,
          size: productData.selectedVariant?.size,
        });
        navigate("/upload");
      }
    } catch (error) {
      console.error("Error selecting product:", error);
    }
  };

  if (isLoading) {
    return <HomaLoader />;
  }

  return (
    <ProductGallery
      products={allProducts}
      onSelectProduct={handleProductSelect}
    />
  );
}