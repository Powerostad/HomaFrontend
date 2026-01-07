import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  // SlidersHorizontal, // TODO: Uncomment when filter UI is implemented
  // Search, // TODO: Uncomment when search UI is implemented
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Store as StoreIcon,
} from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { ContextBar } from '../../components/ContextBar';
import { Header } from '../../components/Header';
import { fetchShops } from '../../services/shopService';
import { type Shop } from '../../types/shop';

// --- Categories ---
const CATEGORIES = [
  { id: 'all', label: 'همه' },
  // TODO: Uncomment when category filtering is implemented
  // { id: 'furniture', label: 'مبلمان' },
  // { id: 'rugs', label: 'فرش' },
  // { id: 'lighting', label: 'نورپردازی' },
  // { id: 'decor', label: 'دکوراتیو' },
];

// =============================================================================
// Loading Skeleton Components
// =============================================================================

function ShopCardSkeleton() {
  return (
    <div className="flex flex-col w-full animate-pulse">
      <div className="relative aspect-[4/5] w-full rounded-none overflow-hidden bg-black/[0.05]" />
      <div className="flex flex-col pt-4 px-0 space-y-2">
        <div className="h-4 bg-black/[0.05] rounded w-3/4" />
        <div className="h-3 bg-black/[0.05] rounded w-1/2" />
      </div>
    </div>
  );
}

function PromotedCardSkeleton() {
  return (
    <div className="relative w-full aspect-[1.6/1] rounded-none overflow-hidden bg-black/[0.03] animate-pulse">
      <div className="absolute inset-0 md:relative md:w-1/2 p-5 md:p-14 flex flex-col justify-between">
        <div className="space-y-3 md:space-y-6">
          <div className="h-4 bg-black/[0.08] rounded w-32" />
          <div className="space-y-2">
            <div className="h-8 bg-black/[0.08] rounded w-48" />
            <div className="h-4 bg-black/[0.05] rounded w-40" />
          </div>
        </div>
        <div className="h-12 bg-black/[0.08] rounded w-36" />
      </div>
    </div>
  );
}

function ExploreSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-[16px] gap-y-[24px] md:gap-y-[32px]">
      <div className="col-span-2 md:col-span-2">
        <PromotedCardSkeleton />
      </div>
      {[...Array(6)].map((_, i) => (
        <ShopCardSkeleton key={i} />
      ))}
    </div>
  );
}

// =============================================================================
// Error State Component
// =============================================================================

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mb-6">
        <StoreIcon size={24} className="text-black/20" strokeWidth={1.5} />
      </div>
      <h3 className="text-[16px] font-medium text-black/80 mb-2">
        خطا در دریافت فروشگاه‌ها
      </h3>
      <p className="text-[13px] text-black/40 mb-6 max-w-xs">
        متأسفانه در برقراری ارتباط با سرور مشکلی پیش آمده است.
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 bg-black text-white text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-black/90 transition-all"
      >
        <RefreshCw size={14} strokeWidth={2} />
        <span>تلاش مجدد</span>
      </button>
    </div>
  );
}

// =============================================================================
// Empty State Component
// =============================================================================

function EmptyState({ searchTerm }: { searchTerm?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-black/[0.03] flex items-center justify-center mb-6">
        <StoreIcon size={24} className="text-black/20" strokeWidth={1.5} />
      </div>
      <h3 className="text-[16px] font-medium text-black/80 mb-2">
        {searchTerm ? 'فروشگاهی یافت نشد' : 'هنوز فروشگاهی ثبت نشده'}
      </h3>
      <p className="text-[13px] text-black/40 max-w-xs">
        {searchTerm
          ? `نتیجه‌ای برای "${searchTerm}" پیدا نشد. عبارت دیگری را امتحان کنید.`
          : 'به زودی فروشگاه‌های منتخب به این بخش اضافه می‌شوند.'}
      </p>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export function ExplorePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, _setSearchTerm] = useState(''); // TODO: Implement search UI
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // API State
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch shops from API
  const loadShops = async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchShops({
      search: debouncedSearch || undefined,
      page_size: 20,
    });

    if (result.success && result.data) {
      setShops(result.data.shops);
    } else {
      setError(result.error || 'خطا در دریافت فروشگاه‌ها');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadShops();
  }, [debouncedSearch]);

  // Filter shops by category (client-side for now since API doesn't support category filter)
  // In production, this would be a server-side filter
  const filteredShops = selectedCategory === 'all'
    ? shops
    : shops; // TODO: Add category filtering when backend supports it

  return (
    <div className="min-h-screen bg-white font-vazirmatn pb-32" dir="rtl">

      {/* 1. TOP UTILITY BAR (Fixed) */}
      <Header />

      {/* 2. CONTEXT BAR (Breadcrumbs) awareness */}
      <ContextBar
        items={[
          { label: 'خانه', href: '/' },
          { label: 'فروشگاه‌ها' }
        ]}
      />

      {/* 3. EDITORIAL HEADER */}
      <header className="pt-6 pb-4 px-6 md:px-16 max-w-[1440px] mx-auto w-full flex flex-col">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-[28px] md:text-[34px] font-medium text-black tracking-tight leading-none" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                فروشگاه‌های منتخب
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] md:text-[11px] font-bold text-black/20 tracking-[0.2em] uppercase">
                  Curated by HOMA Editorial
                </span>
              </div>
            </div>

            <div className="hidden md:block max-w-xs">
              <p className="text-[13px] text-black/40 font-medium leading-relaxed text-start">
                مجموعه‌ای دست‌چین شده از برترین برندهای دکوراسیون داخلی، متناسب با استانداردهای زیبایی‌شناسی هُما.
              </p>
            </div>
          </div>
          <div className="h-px w-full bg-black/[0.05]" />
        </div>
      </header>

      {/* 4. FILTER ROW (Zara Home Editorial) */}
      <div className="px-6 md:px-16 max-w-[1440px] mx-auto w-full mt-10 mb-12 flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`h-9 px-6 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] transition-all border whitespace-nowrap ${selectedCategory === cat.id
                  ? 'bg-black text-white border-black'
                  : 'text-black/30 hover:text-black/60 bg-transparent border-transparent'
                }`}
              style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* TODO: Uncomment when filter functionality is implemented */}
        {/* <div className="flex items-center gap-4">
          <div className="hidden md:flex relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black/40 transition-colors" size={14} strokeWidth={1.5} />
            <input
              type="text"
              placeholder="جستجو..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-b border-black/[0.1] focus:border-black/30 py-1.5 pr-8 pl-2 text-[11px] focus:outline-none transition-all w-32 focus:w-48 tracking-widest font-medium"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-black/10 rounded-none hover:bg-black/[0.02] transition-colors group">
            <span className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] group-hover:text-black transition-colors" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>فیلتر</span>
            <SlidersHorizontal size={14} className="text-black/40 group-hover:text-black transition-colors" strokeWidth={1.5} />
          </button>
        </div> */}
      </div>

      {/* 5. MAIN CONTENT */}
      <main className="px-6 md:px-16 max-w-[1440px] mx-auto w-full pb-32">
        {/* Loading State */}
        {isLoading && <ExploreSkeleton />}

        {/* Error State */}
        {!isLoading && error && <ErrorState onRetry={loadShops} />}

        {/* Empty State */}
        {!isLoading && !error && filteredShops.length === 0 && (
          <EmptyState searchTerm={debouncedSearch} />
        )}

        {/* Shop Grid */}
        {!isLoading && !error && filteredShops.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-[16px] gap-y-[24px] md:gap-y-[32px]">
            {filteredShops.map((shop, idx) => {
              // Only show as promoted if the shop is actually marked as promoted in the backend
              const isPromoted = shop.isPromoted && idx === 0 && selectedCategory === 'all' && !debouncedSearch;

              if (isPromoted) {
                return (
                  <motion.div
                    key={shop.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="col-span-2 md:col-span-2"
                  >
                    <PromotedStoreCard shop={shop} onClick={() => navigate(`/store/${shop.username}`)} />
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="flex flex-col group cursor-pointer w-full"
                  onClick={() => navigate(`/store/${shop.username}`)}
                >
                  {/* Image Tile - Editorial Ratio */}
                  <div className="relative aspect-[4/5] w-full rounded-none overflow-hidden bg-black/[0.02]">
                    {shop.logoUrl ? (
                      <ImageWithFallback
                        src={shop.logoUrl}
                        alt={shop.name}
                        className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black/[0.03]">
                        <StoreIcon size={48} className="text-black/10" strokeWidth={1} />
                      </div>
                    )}

                    {/* Subtle Label on Image */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                      <div className="px-4 py-2 bg-white/90 backdrop-blur-md border border-black/5">
                        <span className="text-[9px] font-bold text-black uppercase tracking-[0.2em]">مشاهده گالری</span>
                      </div>
                    </div>
                  </div>

                  {/* Text Under Tile - Zara Home Minimalist Typography */}
                  <div className="flex flex-col pt-4 px-0">
                    <h3 className="text-[14px] md:text-[16px] font-medium text-black/80 tracking-tight leading-none group-hover:text-black transition-colors" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                      {shop.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-black/20 uppercase tracking-[0.1em]">
                        {toPersianDigits(shop.productCount)} محصول
                      </span>
                      <span className="w-1 h-1 rounded-full bg-black/10" />
                      <span className="text-[10px] font-bold text-black/20 uppercase tracking-[0.1em]">
                        @{shop.username}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Subtle Footer Quote */}
        {!isLoading && !error && filteredShops.length > 0 && (
          <div className="mt-24 mb-12 flex flex-col items-center text-center">
            <div className="w-8 h-[1px] bg-black/5 mb-6" />
            <p className="text-[11px] font-bold text-black/15 max-w-[280px] leading-relaxed">
              این لیست بر اساس سلیقه و فضاهای انتخابی شما به صورت هوشمند گردآوری شده است.
            </p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#FDFDFB] to-transparent pointer-events-none z-10" />
    </div>
  );
}

// =============================================================================
// Promoted Store Card Component
// =============================================================================

function PromotedStoreCard({ shop, onClick }: { shop: Shop; onClick: () => void }) {
  return (
    <div
      className="relative w-full aspect-[1.6/1] rounded-none overflow-hidden group cursor-pointer bg-[var(--accent-light)] border border-black/[0.03] flex flex-col md:flex-row"
      onClick={onClick}
    >
      {/* Content Section */}
      <div className="absolute inset-0 md:relative md:w-1/2 p-5 md:p-14 flex flex-col justify-between z-20">
        <div className="space-y-3 md:space-y-6">
          <div className="inline-flex items-center gap-2 border-b border-[var(--accent)] text-[var(--accent)] pb-1 w-fit">
            <Sparkles size={12} strokeWidth={2} />
            <span className="md:text-[10px] font-bold uppercase tracking-[0.2em] text-[9px]">پیشنهاد ادیتوریال هُما</span>
          </div>

          <div className="space-y-1 md:space-y-3">
            <h2 className="text-[18px] md:text-[36px] font-medium text-black leading-tight tracking-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              {shop.name}
            </h2>
            <p className="text-[11px] md:text-[15px] text-black/60 md:text-black/40 font-medium leading-relaxed max-w-[180px] md:max-w-xs line-clamp-2 md:line-clamp-none">
              {toPersianDigits(shop.productCount)} محصول • @{shop.username}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <button
            className="h-9 md:h-12 px-5 md:px-8 bg-black text-white md:text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black/90 transition-all active:scale-95 flex items-center gap-2 md:gap-3 text-[10px]"
          >
            <span className="text-[12px]">مشاهده ویترین</span>
            <ArrowLeft size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Image Section */}
      <div className="absolute inset-0 md:relative md:w-1/2 overflow-hidden z-10">
        {shop.logoUrl ? (
          <ImageWithFallback
            src={shop.logoUrl}
            className="w-full h-full object-cover grayscale-[0.2] md:grayscale-[0.1] group-hover:grayscale-0 transition-transform duration-[2000ms] group-hover:scale-[1.05]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/[0.03]">
            <StoreIcon size={64} className="text-black/10" strokeWidth={1} />
          </div>
        )}
        {/* Editorial Overlay for Mobile to ensure text legibility with 1.6/1 ratio */}
        <div className="absolute inset-0 bg-gradient-to-l from-[var(--accent-light)] via-[var(--accent-light)]/90 to-transparent md:hidden" />
      </div>
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

const toPersianDigits = (num: number | string) => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};
