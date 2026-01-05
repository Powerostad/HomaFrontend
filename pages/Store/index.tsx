import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, SlidersHorizontal, ArrowRight, ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';
import { MOCK_STORES } from '../../data/mock';
import { useApp } from '../../context/AppContext';
import { trackEvent } from '../../utils/analytics';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { GalleryProductCard } from '../../components/store/GalleryProductCard';
import { Skeleton } from '../../components/ui/skeleton';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose, DrawerDescription } from '../../components/ui/drawer';
import { Button } from '../../components/ui/button';
const exampleImage = 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200';
import { ContextBar } from '../../components/ContextBar';
import { Header } from '../../components/Header';
import { HomaLoader } from '../../components/HomaLoader';

export function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { setProduct } = useApp();
  const [store, setStore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'new'>('all');
  const [gridItems, setGridItems] = useState<any[]>([]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const foundStore = MOCK_STORES.find(s => s.slug.toLowerCase() === slug?.toLowerCase());
      setStore(foundStore);

      if (foundStore) {
        const interleaved: any[] = [];
        const products = [...foundStore.products];
        const decors = [...(foundStore.decorExamples || [])];

        let productIdx = 0;
        let decorIdx = 0;

        // Add HOMA Special at the beginning
        if (products.length > 0) {
          interleaved.push({ type: 'homa-special', data: products[productIdx++] });
        }

        while (productIdx < products.length || decorIdx < decors.length) {
          for (let i = 0; i < 4 && productIdx < products.length; i++) {
            interleaved.push({ type: 'product', data: products[productIdx++] });
          }
          if (decorIdx < decors.length) {
            interleaved.push({ type: 'decor', data: decors[decorIdx++] });
          }
        }

        setGridItems(interleaved);
        trackEvent('view_store', { storeId: foundStore.id, storeName: foundStore.name });
      }
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [slug]);

  const handleTryOn = (product: any) => {
    trackEvent('click_try_on', { productId: product.id, source: 'store_page' });
    setProduct(product);
    navigate('/try-on/upload');
  };

  if (isLoading) {
    return <HomaLoader message="در حال دریافت اطلاعات فروشگاه..." />;
  }

  if (!store && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFB] p-6 text-center" dir="rtl">
        <h2 className="text-xl font-bold mb-2 font-vazirmatn">فروشگاه پیدا نشد</h2>
        <Button onClick={() => navigate('/explore')} className="btn-primary rounded-full px-8">
          بازگشت
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
          { label: 'خانه', href: '/' },
          { label: 'فروشگاه‌ها', href: '/explore' },
          { label: store?.name || 'فروشگاه' }
        ]}
      />

      {/* 3. STORE HEADER (EDITORIAL IDENTITY) */}
      <header className="pt-6 pb-3 px-6 md:px-16 max-w-[1440px] mx-auto w-full">
        {!isLoading && store && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-white border border-black/5 overflow-hidden shrink-0 shadow-sm">
                  <ImageWithFallback src={store.logo} className="w-full h-full object-cover scale-110" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-[28px] md:text-[34px] font-medium text-black tracking-tight leading-none" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                    {store.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-black/[0.03] rounded-sm flex items-center gap-1.5 border border-black/[0.05]">
                      <Star size={10} className="fill-black text-black opacity-30" />
                      <span className="text-[10px] font-bold text-black/40">{toPersianDigits(store.rating)}</span>
                    </div>
                    <span className="text-[11px] text-black/30 font-medium uppercase tracking-widest">{toPersianDigits(store.productCount)} محصول منتخب</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <p className="hidden md:block text-[13px] text-black/40 font-medium leading-relaxed max-w-xs text-start">
                  مجموعه‌ای از بهترین کالاهای {store.name} که توسط تیم طراحی هُما برای چیدمان‌های مدرن دست‌چین شده‌اند.
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-black/[0.05] mt-2" />
          </div>
        )}
      </header>

      {/* 4. FILTER ROW (Zara Home Editorial) */}
      <div className="px-6 md:px-16 max-w-[1440px] mx-auto w-full mb-12 flex items-center justify-between mt-6">
        <div className="flex items-center gap-1.5">
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
        </div>

        <button className="flex items-center gap-2 px-4 py-2 border border-black/10 rounded-none hover:bg-black/[0.02] transition-colors group">
          <span className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] group-hover:text-black transition-colors" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>فیلترها</span>
          <SlidersHorizontal size={14} className="text-black/40 group-hover:text-black transition-colors" strokeWidth={1.5} />
        </button>
      </div>

      {/* 5. PRODUCT GRID (CONTINUOUS) */}
      <main className="px-6 md:px-16 max-w-[1440px] mx-auto w-full pb-32">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-[16px] gap-y-[18px] md:gap-y-[20px]">
          {isLoading ? (
            [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[4/5] w-full rounded-[16px]" />
                <Skeleton className="w-2/3 h-4" />
                <Skeleton className="w-1/2 h-3" />
              </div>
            ))
          ) : (
            gridItems.map((item: any, idx: number) => {
              if (item.type === 'homa-special') {
                return (
                  <motion.div
                    key="homa-special"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="col-span-2 md:col-span-2"
                  >
                    <HomaSpecialCard product={item.data} onTryOn={() => handleTryOn(item.data)} />
                  </motion.div>
                );
              }
              if (item.type === 'product') {
                const displayProduct = item.data;
                return (
                  <motion.div
                    key={`${displayProduct.id}-${idx}`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    onClick={() => navigate(`/store/${slug}/product/${displayProduct.id}`)}
                  >
                    <GalleryProductCard product={displayProduct} onTryOn={() => handleTryOn(displayProduct)} />
                  </motion.div>
                );
              } else {
                return (
                  <motion.div
                    key={`${item.data.id}-${idx}`}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                  >
                    <DecorGridCard decor={item.data} />
                  </motion.div>
                );
              }
            })
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#FDFDFB] to-transparent pointer-events-none z-10" />
    </div>
  );
}

// 4) DECOR GRID CARD - Minimal & Faded Label
function DecorGridCard({ decor }: { decor: any }) {
  return (
    <div className="flex flex-col group cursor-pointer w-full">
      {/* Editorial Style: Sharp Corners */}
      <div className="relative aspect-[4/5] w-full rounded-none overflow-hidden bg-black/[0.02]">
        <ImageWithFallback
          src={decor.image}
          alt={decor.title}
          className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-[1.01]"
        />

        {/* Real Home Label: Small, 0.6 opacity, minimal corner label */}
        <div className="absolute top-4 right-4 opacity-60">
          <div className="px-2 py-1 bg-black/10 backdrop-blur-sm border border-white/10">
            <span className="text-[9px] font-bold text-white tracking-widest uppercase">فضای واقعی</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col pt-3 px-0">
        <h3 className="text-[13px] md:text-[14px] font-medium text-black/60 line-clamp-1 leading-tight group-hover:text-black transition-colors" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
          {decor.title}
        </h3>
        <p className="text-[10px] font-bold text-black/20 mt-2 tracking-widest uppercase">
          {toPersianDigits(decor.productCount)} محصول هماهنگ
        </p>
      </div>
    </div>
  );
}

// 7) HOMA SPECIAL RECOMMENDATION CARD
function HomaSpecialCard({ product, onTryOn }: { product: any; onTryOn: () => void }) {
  const navigate = useNavigate();
  const { slug } = useParams();

  return (
    <div
      className="relative w-full aspect-[1.6/1] rounded-none overflow-hidden group cursor-pointer bg-[var(--accent-light)] border border-black/[0.03] flex flex-col md:flex-row"
      onClick={() => navigate(`/store/${slug}/product/${product.id}`)}
    >
      {/* Content Section */}
      <div className="absolute inset-0 md:relative md:w-1/2 p-5 md:p-14 flex flex-col justify-between z-20">
        <div className="space-y-3 md:space-y-6">
          <div className="inline-flex items-center gap-2 border-b border-[var(--accent)] text-[var(--accent)] pb-1 w-fit">
            <Sparkles size={10} md:size={12} strokeWidth={2} />
            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em]">پیشنهاد ادیتوریال هُما</span>
          </div>

          <div className="space-y-1 md:space-y-2">
            <h2 className="text-[18px] md:text-[32px] font-medium text-black leading-tight tracking-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              {product.name}
            </h2>
            <p className="text-[11px] md:text-[14px] text-black/60 md:text-black/40 font-medium leading-relaxed max-w-[180px] md:max-w-xs line-clamp-2 md:line-clamp-none">
              انتخابی هوشمند بر اساس پالت رنگی فضای شما.
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
            امتحان در فضای من
          </button>
          <span className="text-[14px] md:text-[18px] font-bold text-[var(--accent)]">
            {toPersianDigits(product.price?.toLocaleString() || '۰')} تومان
          </span>
        </div>
      </div>

      {/* Image Section */}
      <div className="absolute inset-0 md:relative md:w-1/2 overflow-hidden z-10">
        <ImageWithFallback
          src={product.thumbnail || product.image}
          className="w-full h-full object-cover grayscale-[0.05] group-hover:grayscale-0 transition-transform duration-[2000ms] group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[var(--accent-light)] via-[var(--accent-light)]/90 to-transparent md:hidden" />
      </div>
    </div>
  );
}

// Helper for Persian Digits
const toPersianDigits = (num: number | string) => {
  if (num === undefined || num === null) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};