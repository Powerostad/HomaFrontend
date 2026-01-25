import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, Sparkles, RefreshCw, Store as StoreIcon } from 'lucide-react';
// SlidersHorizontal - TODO: Uncomment when filter UI is implemented
import { useProduct, useShop } from '../../context/AppProviders';
import { trackEvent } from '../../utils/analytics';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { GalleryProductCard } from '../../components/store/GalleryProductCard';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { ContextBar } from '../../components/ContextBar';
import { Header } from '../../components/Header';
import { HomaLoader } from '../../components/HomaLoader';
import { fetchProductsByShop } from '../../services/productService';
import { formatPriceFromRial } from '../../utils/formatters';
import type { Shop } from '../../types/shop';
import type { APIProduct } from '../../types/apiProduct';
import type { Product } from '../../types/product';

/**
 * Convert APIProduct to the legacy Product type for existing components
 */
function apiProductToProduct(apiProduct: APIProduct): Product {
  return {
    id: apiProduct.uniqueLink, // Use uniqueLink as ID for navigation
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

// =============================================================================
// Main Component
// =============================================================================

export function StorePage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { setProduct } = useProduct();
  const { getShop, getError: getShopError, invalidateShop } = useShop();

  // State
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<APIProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [_activeTab, _setActiveTab] = useState<'all' | 'popular' | 'new'>('all'); // TODO: Implement tab filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Track if initial load is done to prevent showing loader on cached data
  const initialLoadDone = useRef(false);

  // Track which shop's products we've already fetched to prevent duplicate requests
  const productsFetchedForShop = useRef<string | null>(null);

  const PAGE_SIZE = 20;

  // Derived state from context
  const shopError = slug ? getShopError(slug) : null;

  // Fetch shop details and products
  useEffect(() => {
    if (!slug) return;

    // Reset refs when slug changes (navigating to different shop)
    initialLoadDone.current = false;
    productsFetchedForShop.current = null;

    const abortController = new AbortController();

    const loadShopAndProducts = async () => {
      // Step 1: Get shop from cache or fetch (ShopContext handles caching)
      const shopData = await getShop(slug, { signal: abortController.signal });

      // Don't update state if request was aborted (component unmounting)
      if (abortController.signal.aborted) return;

      if (!shopData) {
        // Error is already set in context
        initialLoadDone.current = true;
        return;
      }

      setShop(shopData);
      initialLoadDone.current = true;

      // Track analytics
      trackEvent('view_store', { storeId: shopData.id, storeName: shopData.name });

      // Step 2: Fetch products for this shop
      // Skip if we've already fetched products for this shop (prevents duplicate requests on re-renders)
      if (productsFetchedForShop.current === shopData.name) {
        return;
      }

      setIsLoadingProducts(true);
      setCurrentPage(1);
      productsFetchedForShop.current = shopData.name; // Mark as fetching

      const productsResult = await fetchProductsByShop(shopData.name, { page_size: PAGE_SIZE, page: 1 }, { signal: abortController.signal });

      // Don't update state if request was aborted (component unmounting)
      if (abortController.signal.aborted) {
        // Reset the ref so next mount can fetch
        productsFetchedForShop.current = null;
        setIsLoadingProducts(false);  // Must reset loading state on abort
        return;
      }

      if (productsResult.success && productsResult.data) {
        setProducts(productsResult.data.products);
        setHasMore(productsResult.data.hasMore);
      } else {
        // Don't show error if just no products - show empty state
        setProducts([]);
        setHasMore(false);
      }

      setIsLoadingProducts(false);
    };

    loadShopAndProducts();

    return () => {
      abortController.abort(); // Cleanup: abort in-flight requests
    };
  }, [slug, getShop]);

  const handleTryOn = (product: Product) => {
    trackEvent('click_try_on', { productId: product.id, source: 'store_page' });
    setProduct(product);
    // Use product's uniqueLink or id in URL path
    const productUrlId = (product as unknown as { uniqueLink?: string }).uniqueLink
      || (product as unknown as { unique_link?: string }).unique_link
      || product.id;
    navigate(`/try-on/${productUrlId}/upload`);
  };

  const handleRetry = () => {
    if (slug) {
      // Invalidate cache and re-trigger fetch
      invalidateShop(slug);
      initialLoadDone.current = false;
      setShop(null);
      // Force re-render to trigger useEffect
      window.location.reload();
    }
  };

  const handleLoadMore = async () => {
    if (!shop || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    const productsResult = await fetchProductsByShop(shop.name, {
      page_size: PAGE_SIZE,
      page: nextPage
    });

    if (productsResult.success && productsResult.data) {
      setProducts(prev => [...prev, ...productsResult.data!.products]);
      setHasMore(productsResult.data.hasMore);
      setCurrentPage(nextPage);
    }

    setIsLoadingMore(false);
  };

  // Loading state - show loader if:
  // 1. Initial load hasn't completed yet (no shop, no error), OR
  // 2. Actively loading from context
  // This prevents flash of "not found" before loading state kicks in
  if (!initialLoadDone.current && !shop && !shopError) {
    return <HomaLoader message={t('store.loadingStore', 'در حال دریافت اطلاعات فروشگاه...')} />;
  }

  // Error state
  if (shopError && !shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFB] p-6 text-center" dir="rtl">
        <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mb-6">
          <StoreIcon size={24} className="text-black/20" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold mb-2 font-vazirmatn">{shopError}</h2>
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleRetry}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            {t('common.retry', 'تلاش مجدد')}
          </Button>
          <Button onClick={() => navigate('/explore')} className="btn-primary rounded-full px-8">
            {t('common.back', 'بازگشت')}
          </Button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFB] p-6 text-center" dir="rtl">
        <h2 className="text-xl font-bold mb-2 font-vazirmatn">{t('store.notFound', 'فروشگاه پیدا نشد')}</h2>
        <Button onClick={() => navigate('/explore')} className="btn-primary rounded-full px-8">
          {t('common.back', 'بازگشت')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB] selection:bg-black/5 flex flex-col" dir="rtl">

      {/* 1. TOP UTILITY BAR (Fixed) */}
      <Header />

      {/* 2. CONTEXT BAR (Breadcrumbs) awareness */}
      <ContextBar
        items={[
          { label: t('nav.home', 'خانه'), href: '/' },
          { label: t('nav.stores', 'فروشگاه‌ها'), href: '/explore' },
          { label: shop.name }
        ]}
      />

      {/* 3. STORE HEADER (EDITORIAL IDENTITY) */}
      <header className="pt-6 pb-3 px-6 md:px-16 max-w-[1440px] mx-auto w-full">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-white border border-black/5 overflow-hidden shrink-0 shadow-sm">
                {shop.logoUrl ? (
                  <ImageWithFallback src={shop.logoUrl} className="w-full h-full object-cover scale-110" />
                ) : (
                  <StoreIcon size={32} className="text-black/20" strokeWidth={1} />
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-[28px] md:text-[34px] font-medium text-black tracking-tight leading-none" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                  {shop.name}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-black/[0.03] rounded-sm flex items-center gap-1.5 border border-black/[0.05]">
                    <Star size={10} className="fill-black text-black opacity-30" />
                    <span className="text-[10px] font-bold text-black/40">@{shop.username}</span>
                  </div>
                  <span className="text-[11px] text-black/30 font-medium uppercase tracking-widest">{t('explore.productCount', '{{count}} محصول', { count: shop.productCount })}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <p className="hidden md:block text-[13px] text-black/40 font-medium leading-relaxed max-w-xs text-start">
                {t('store.curatedDescription', 'مجموعه‌ای از بهترین کالاهای {{name}} که توسط تیم طراحی هُما برای چیدمان‌های مدرن دست‌چین شده‌اند.', { name: shop.name })}
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-black/[0.05] mt-2" />
        </div>
      </header>

      {/* 4. FILTER ROW (Zara Home Editorial) */}
      <div className="px-6 md:px-16 max-w-[1440px] mx-auto w-full mb-12 flex items-center justify-between mt-6">
        <div className="flex items-center gap-1.5">
          {/* Only show "All" tab for now */}
          <button
            className="h-9 px-6 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] transition-all border bg-black text-white border-black"
            style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
          >
            {t('common.all', 'همه')}
          </button>
          {/* TODO: Uncomment when tab filtering is implemented
          {(['all', 'popular', 'new'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-9 px-6 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${activeTab === tab
                  ? 'bg-black text-white border-black'
                  : 'text-black/30 hover:text-black/60 bg-transparent border-transparent'
                }`}
              style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
            >
              {tab === 'all' && 'همه'}
              {tab === 'popular' && 'محبوب'}
              {tab === 'new' && 'جدید'}
            </button>
          ))}
          */}
        </div>

        {/* TODO: Uncomment when filter functionality is implemented */}
        {/* <button className="flex items-center gap-2 px-4 py-2 border border-black/10 rounded-none hover:bg-black/[0.02] transition-colors group">
          <span className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] group-hover:text-black transition-colors" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>فیلترها</span>
          <SlidersHorizontal size={14} className="text-black/40 group-hover:text-black transition-colors" strokeWidth={1.5} />
        </button> */}
      </div>

      {/* 5. PRODUCT GRID */}
      <main className="px-6 md:px-16 max-w-[1440px] mx-auto w-full pb-32">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-[16px] gap-y-[18px] md:gap-y-[20px]">
          {isLoadingProducts ? (
            // Loading skeleton
            [...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[4/5] w-full rounded-[16px]" />
                <Skeleton className="w-2/3 h-4" />
                <Skeleton className="w-1/2 h-3" />
              </div>
            ))
          ) : products.length === 0 ? (
            // Empty state
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mb-6">
                <StoreIcon size={24} className="text-black/20" strokeWidth={1.5} />
              </div>
              <h3 className="text-[16px] font-medium text-black/80 mb-2">
                {t('store.noProductsYet', 'هنوز محصولی اضافه نشده')}
              </h3>
              <p className="text-[13px] text-black/40 max-w-xs">
                {t('store.emptyStoreDescription', 'این فروشگاه هنوز محصولی برای نمایش ندارد.')}
              </p>
            </div>
          ) : (
            // Products grid
            products.map((apiProduct, idx) => {
              const product = apiProductToProduct(apiProduct);
              const isFirst = idx === 0 && products.length > 1;

              if (isFirst && apiProduct.isPromoted) {
                return (
                  <motion.div
                    key={apiProduct.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="col-span-2 md:col-span-2"
                  >
                    <HomaSpecialCard
                      product={product}
                      apiProduct={apiProduct}
                      onTryOn={() => handleTryOn(product)}
                    />
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={apiProduct.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  onClick={() => navigate(`/store/${slug}/product/${apiProduct.uniqueLink}`)}
                >
                  <GalleryProductCard
                    product={product}
                    onTryOn={() => handleTryOn(product)}
                  />
                </motion.div>
              );
            })
          )}
        </div>

        {/* Load More Button */}
        {!isLoadingProducts && products.length > 0 && hasMore && (
          <div className="flex justify-center mt-12 mb-8">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="h-12 px-8 rounded-none border-black/10 text-black hover:bg-black/5 text-[12px] font-bold tracking-widest"
            >
              {isLoadingMore ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                  {t('common.loading', 'در حال بارگذاری...')}
                </span>
              ) : (
                t('store.loadMore', 'مشاهده بیشتر')
              )}
            </Button>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#FDFDFB] to-transparent pointer-events-none z-10" />
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function HomaSpecialCard({
  product,
  apiProduct,
  onTryOn
}: {
  product: Product;
  apiProduct: APIProduct;
  onTryOn: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();

  return (
    <div
      className="relative w-full aspect-[1.6/1] rounded-none overflow-hidden group cursor-pointer bg-[var(--accent-light)] border border-black/[0.03] flex flex-col md:flex-row"
      onClick={() => navigate(`/store/${slug}/product/${apiProduct.uniqueLink}`)}
    >
      {/* Content Section */}
      <div className="absolute inset-0 md:relative md:w-1/2 p-5 md:p-14 flex flex-col justify-between z-20">
        <div className="space-y-3 md:space-y-6">
          <div className="inline-flex items-center gap-2 border-b border-[var(--accent)] text-[var(--accent)] pb-1 w-fit">
            <Sparkles size={12} strokeWidth={2} />
            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em]">{t('explore.homaEditorialPick', 'پیشنهاد ادیتوریال هُما')}</span>
          </div>

          <div className="space-y-1 md:space-y-2">
            <h2 className="text-[18px] md:text-[32px] font-medium text-black leading-tight tracking-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              {product.name}
            </h2>
            <p className="text-[11px] md:text-[14px] text-black/60 md:text-black/40 font-medium leading-relaxed max-w-[180px] md:max-w-xs line-clamp-2 md:line-clamp-none">
              {t('store.smartColorPick', 'انتخابی هوشمند بر اساس پالت رنگی فضای شما.')}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTryOn();
            }}
            className="h-9 md:h-12 w-fit px-4 md:px-6 bg-black text-white text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black/90 transition-all active:scale-95 flex items-center justify-center"
          >
            {t('store.tryInMySpace', 'امتحان در فضای من')}
          </button>
          <span className="text-[14px] md:text-[18px] font-bold text-[var(--accent)]">
            {formatPriceFromRial(product.price ?? 0)}
          </span>
        </div>
      </div>

      {/* Image Section */}
      <div className="absolute inset-0 md:relative md:w-1/2 overflow-hidden z-10">
        <ImageWithFallback
          src={apiProduct.imageUrl}
          className="w-full h-full object-cover grayscale-[0.05] group-hover:grayscale-0 transition-transform duration-[2000ms] group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[var(--accent-light)] via-[var(--accent-light)]/90 to-transparent md:hidden" />
      </div>
    </div>
  );
}
