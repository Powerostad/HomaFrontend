import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  Sparkles,
  RefreshCw,
  Store as StoreIcon,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProduct, useShop } from '../../context/AppProviders';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Button } from '../../components/ui/button';
import { trackEvent } from '../../utils/analytics';
import { Header } from '../../components/Header';
import { HomaLoader } from "../../components/HomaLoader";
import { ContextBar } from '../../components/ContextBar';
import { BuyButton } from '../../components/BuyButton';
import { formatPriceFromRial } from '../../utils/formatters';
// TODO: Re-enable when backend /api/recommendations/gallery/product is ready
// import { ProductSocialGallery } from '../../components/ProductSocialGallery';
import { fetchProduct } from '../../services/productService';
import { apiProductToProduct } from '../../types/apiProduct';
import type { Shop } from '../../types/shop';
import type { APIProduct } from '../../types/apiProduct';
import type { Product } from '../../types/product';

export function ProductDetailsPage() {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();
  const { setProduct } = useProduct();
  const { getShop, getError: getShopError, invalidateShop } = useShop();

  const [product, setProductData] = useState<Product | null>(null);
  const [apiProduct, setApiProduct] = useState<APIProduct | null>(null);
  const [store, setStoreData] = useState<Shop | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Derived state from shop context
  const shopError = slug ? getShopError(slug) : null;

  useEffect(() => {
    if (!slug || !productId) return;

    const abortController = new AbortController();

    const loadData = async () => {
      setIsLoadingProduct(true);
      setProductError(null);

      // Step 1: Get shop from cache or fetch (ShopContext handles caching)
      const shopData = await getShop(slug, { signal: abortController.signal });

      // Don't update state if request was aborted (component unmounting)
      if (abortController.signal.aborted) return;

      if (!shopData) {
        // Error is already set in context
        setIsLoadingProduct(false);
        return;
      }

      setStoreData(shopData);

      // Track analytics
      trackEvent('view_store', { storeId: shopData.id, storeName: shopData.name });

      // Step 2: Fetch product by unique_link (productId from URL is the UUID)
      const productResult = await fetchProduct(productId, { signal: abortController.signal });

      // Don't update state if request was aborted (component unmounting)
      if (abortController.signal.aborted) return;

      if (!productResult.success || !productResult.data) {
        // Only show error if not aborted
        if (!abortController.signal.aborted) {
          setProductError(productResult.error || 'محصول یافت نشد');
          setIsLoadingProduct(false);
        }
        return;
      }

      // Store raw API product for extra_details access
      setApiProduct(productResult.data);

      // Convert API product to local Product type
      const convertedProduct = apiProductToProduct(productResult.data);
      setProductData(convertedProduct);

      // Track product view
      trackEvent('view_product', { productId: productResult.data.uniqueLink, productName: productResult.data.name });

      setIsLoadingProduct(false);
    };

    loadData();

    return () => {
      abortController.abort(); // Cleanup: abort in-flight requests
    };
  }, [slug, productId, getShop]);

  const handleTestDecor = () => {
    // Transform APIProduct to Product format (sets id = uniqueLink/UUID and preserves availableSizes)
    if (apiProduct) {
      trackEvent('click_test_decor_single_cta', { productId: apiProduct.uniqueLink });
      const productData = apiProductToProduct(apiProduct);
      setProduct(productData);
      // Navigate with product's uniqueLink in URL path
      navigate(`/try-on/${apiProduct.uniqueLink}/upload`);
    }
  };

  const handleRetry = () => {
    if (slug && productId) {
      // Invalidate shop cache and re-trigger fetch
      invalidateShop(slug);
      setStoreData(null);
      setProductData(null);
      setProductError(null);
      window.location.reload();
    }
  };

  // Combined error from shop or product
  const error = shopError || productError;

  // Loading state - show loader while fetching product data
  if (isLoadingProduct) {
    return <HomaLoader message="در حال دریافت اطلاعات محصول..." />;
  }

  // Error state
  if (error && !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFB] p-6 text-center" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mb-6">
          <StoreIcon size={24} className="text-black/20" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold mb-2 font-vazirmatn">{error}</h2>
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleRetry}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            تلاش مجدد
          </Button>
          <Button onClick={() => navigate('/explore')} className="btn-primary rounded-full px-8">
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  if (!product) return <div className="p-8 text-center text-muted-foreground">محصول یافت نشد</div>;

  // Future use: const currentPrice = PRODUCT_SIZES.find(s => s.id === selectedSize)?.price || product.price;

  return (
    <div className="min-h-screen bg-[#FDFDFB] selection:bg-black/5 flex flex-col" dir="rtl">
      <Header />
      <ContextBar 
        items={[
          { label: 'خانه', href: '/' },
          { label: 'فروشگاه‌ها', href: '/explore' },
          { label: store?.name || 'فروشگاه', href: `/store/${slug}` },
          { label: product.name }
        ]}
      />

      <main className="relative z-10 flex-1 w-full max-w-[1440px] mx-auto px-0 md:px-16 pt-0 md:pt-10 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-16">
          
          {/* IMAGE SECTION - Vertical Gallery + Main */}
          <div className="md:col-span-8 flex flex-row-reverse gap-4">
            {/* Main Image */}
            <div className="flex-1 relative aspect-square overflow-hidden bg-black/[0.01]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImageIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="w-full h-full"
                >
                  <ImageWithFallback
                    src={product.images?.[activeImageIdx] || product.thumbnail}
                    alt={product.name}
                    className="w-full h-full object-cover aspect-square"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Vertical Thumbnails - only show if multiple images */}
            {product.images && product.images.length > 1 && (
              <div className="hidden md:flex flex-col gap-2 shrink-0">
                {product.images.map((imgSrc, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`w-20 h-20 overflow-hidden border transition-all duration-300 ${
                      activeImageIdx === i ? 'border-black' : 'border-transparent opacity-40 hover:opacity-100'
                    }`}
                  >
                    <ImageWithFallback src={imgSrc} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* EDITORIAL INFO PANEL */}
          <div className="md:col-span-4 px-6 md:px-0 mt-8 md:mt-0">
            <div className="flex flex-col gap-6 md:sticky md:top-32">
              
              {/* Product Heading */}
              <div className="space-y-4">
                {product.category && (
                  <div className="flex items-center gap-2 text-[10px] text-black/40 font-bold uppercase tracking-widest">
                    <span>{product.category}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <h1 className="text-[22px] md:text-[24px] font-bold text-black leading-tight tracking-wide">
                    {product.name}
                  </h1>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[16px] md:text-[18px] font-bold text-black">
                      {product.price ? formatPriceFromRial(product.price) : '۰ تومان'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="py-6 border-t border-black/[0.05]">
                  <p className="text-[13px] text-black/60 leading-relaxed font-medium">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-8 space-y-3">
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleTestDecor}
                    className="w-full h-14 rounded-none bg-black text-white hover:bg-black/90 text-[14px] font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl"
                  >
                    <Sparkles size={20} />
                    امتحانش کن در فضای خودت (AI Try-On)
                  </Button>
                  <div className="flex gap-2 w-full">
                    <Button 
                      variant="outline"
                      className="flex-1 h-12 rounded-none border-black/10 text-black hover:bg-black/5 text-[13px] font-bold tracking-widest"
                    >
                      افزودن به سبد
                    </Button>
                    <button className="flex-1 h-12 flex items-center justify-center border border-black/10 hover:bg-black/5 transition-all text-black/60 font-bold text-[12px] gap-2">
                      <Heart size={18} strokeWidth={1} />
                      ذخیره برای بعد
                    </button>
                  </div>
                  {/* Buy Button - Opens retailer in new tab */}
                  {apiProduct && (
                    <BuyButton
                      productId={apiProduct.uniqueLink}
                      sourceContext="product_page"
                      shopName={apiProduct.shopName}
                      variant="outline"
                      size="lg"
                      className="w-full h-12 rounded-none border-black/10 text-black hover:bg-black/5 text-[13px] font-bold tracking-widest mt-3"
                    />
                  )}
                </div>

                {/* Product Details Toggle */}
                {apiProduct?.extraDetails && Object.keys(apiProduct.extraDetails).length > 0 && (
                  <div className="pt-6 border-t border-black/[0.05]">
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="flex items-center justify-between w-full text-[11px] font-bold text-black/60 uppercase tracking-widest hover:text-black transition-colors"
                    >
                      <span>جزئیات محصول</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <AnimatePresence>
                      {showDetails && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <table className="w-full mt-4 text-[13px]">
                            <tbody>
                              {Object.entries(apiProduct.extraDetails).map(([key, value]) => (
                                <tr key={key} className="border-b border-black/[0.05]">
                                  <td className="py-3 text-black/40 font-medium w-1/3">{key}</td>
                                  <td className="py-3 text-black/80 font-medium">
                                    {Array.isArray(value) ? value.join('، ') : value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Social Gallery - User Try-On Images */}
        {/* TODO: Re-enable when backend /api/recommendations/gallery/product is ready
        {productId && (
          <div className="mt-16 md:mt-24 px-6 md:px-0">
            <ProductSocialGallery
              productId={productId}
              productName={product.name}
            />
          </div>
        )}
        */}
      </main>

      {/* STICKY MOBILE CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-black/[0.02] z-[120] md:hidden">
        <Button 
          onClick={handleTestDecor}
          className="w-full h-12 rounded-none bg-black text-white text-[13px] font-bold active:scale-[0.98]"
        >
          امتحانش کن در فضای خودت
        </Button>
      </div>

    </div>
  );
}