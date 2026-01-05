import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  Sparkles,
  RefreshCw,
  Store as StoreIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProduct } from '../../context/AppProviders';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Button } from '../../components/ui/button';
import { trackEvent } from '../../utils/analytics';
import { Header } from '../../components/Header';
import { HomaLoader } from "../../components/HomaLoader";
import { ContextBar } from '../../components/ContextBar';
import { ProductSocialGallery } from '../../components/ProductSocialGallery';
import { fetchShopByUsername } from '../../services/shopService';
import { fetchProduct } from '../../services/productService';
import type { Shop } from '../../types/shop';
import type { APIProduct } from '../../types/apiProduct';
import type { Product } from '../../types/product';

/**
 * Convert APIProduct to the legacy Product type for existing components
 */
function apiProductToProduct(apiProduct: APIProduct): Product {
  return {
    id: apiProduct.uniqueLink,
    name: apiProduct.name,
    price: apiProduct.price,
    category: apiProduct.categoryDisplay,
    images: [apiProduct.imageUrl],
    thumbnail: apiProduct.imageUrl,
    brand: apiProduct.shopName,
    description: apiProduct.description,
    currency: 'تومان',
    status: 'active',
    seller: {
      name: apiProduct.shopName,
      verified: true,
    },
  };
}

export function ProductDetailsPage() {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();
  const { setProduct } = useProduct();
  const [product, setProductData] = useState<Product | null>(null);
  const [store, setStoreData] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    if (!slug || !productId) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      // Step 1: Fetch shop by slug
      const shopResult = await fetchShopByUsername(slug);

      if (!shopResult.success || !shopResult.data) {
        setError(shopResult.error || 'فروشگاه یافت نشد');
        setIsLoading(false);
        return;
      }

      setStoreData(shopResult.data);

      // Track analytics
      trackEvent('view_store', { storeId: shopResult.data.id, storeName: shopResult.data.name });

      // Step 2: Fetch product by unique_link (productId from URL is the UUID)
      const productResult = await fetchProduct(productId);

      if (!productResult.success || !productResult.data) {
        setError(productResult.error || 'محصول یافت نشد');
        setIsLoading(false);
        return;
      }

      // Convert API product to local Product type
      const convertedProduct = apiProductToProduct(productResult.data);
      setProductData(convertedProduct);

      // Track product view
      trackEvent('view_product', { productId: productResult.data.uniqueLink, productName: productResult.data.name });

      setIsLoading(false);
    };

    loadData();
  }, [slug, productId]);

  const handleTestDecor = () => {
    if (product) {
      trackEvent('click_test_decor_single_cta', { productId: product.id });
      setProduct(product);
      navigate('/try-on/upload');
    }
  };

  const handleRetry = () => {
    if (slug && productId) {
      setError(null);
      setIsLoading(true);
      window.location.reload();
    }
  };

  if (isLoading) {
    return <HomaLoader message="در حال دریافت اطلاعات محصول..." />;
  }

  // Error state
  if (error) {
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
                      {product.price?.toLocaleString()} تومان
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
                </div>

                <div className="flex flex-col gap-3 pt-6 border-t border-black/[0.05]">
                  <button className="text-[11px] font-bold text-black/60 uppercase tracking-widest text-start hover:text-black">جزئیات محصول</button>
                  <button className="text-[11px] font-bold text-black/60 uppercase tracking-widest text-start hover:text-black">ارسال و بازگشت</button>
                  <button className="text-[11px] font-bold text-black/60 uppercase tracking-widest text-start hover:text-black">موجودی در فروشگاه‌ها</button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Social Gallery - User Try-On Images */}
        {productId && (
          <div className="mt-16 md:mt-24 px-6 md:px-0">
            <ProductSocialGallery
              productId={productId}
              productName={product.name}
            />
          </div>
        )}
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