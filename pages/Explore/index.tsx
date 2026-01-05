import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ChevronRight, 
  SlidersHorizontal,
  Search
} from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { MOCK_STORES } from '../../data/mock';
import { ContextBar } from '../../components/ContextBar';
import { Header } from '../../components/Header';
import { Sparkles, ArrowLeft } from 'lucide-react';

// --- Categories ---
const CATEGORIES = [
  { id: 'all', label: 'همه' },
  { id: 'furniture', label: 'مبلمان' },
  { id: 'rugs', label: 'فرش' },
  { id: 'lighting', label: 'نورپردازی' },
  { id: 'decor', label: 'دکوراتیو' },
];

const LIFESTYLES = [
  { id: 'minimal', label: 'مینیمال لوکس', image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=400' },
  { id: 'classic', label: 'کلاسیک مدرن', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=400' },
  { id: 'boho', label: 'بوهو شیک', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=400' },
  { id: 'industrial', label: 'اینداستریال', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400' },
];

export function ExplorePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredStores = selectedCategory === 'all' 
    ? MOCK_STORES 
    : MOCK_STORES.filter(s => s.categories.some(c => c.includes(selectedCategory)));

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
                className={`h-9 px-6 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] transition-all border whitespace-nowrap ${
                  selectedCategory === cat.id 
                    ? 'bg-black text-white border-black' 
                    : 'text-black/30 hover:text-black/60 bg-transparent border-transparent'
                }`}
                style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
              >
                {cat.label}
              </button>
            ))}
         </div>
         
         <div className="flex items-center gap-4">
            <div className="hidden md:flex relative group">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black/40 transition-colors" size={14} strokeWidth={1.5} />
              <input 
                type="text" 
                placeholder="جستجو..."
                className="bg-transparent border-b border-black/[0.1] focus:border-black/30 py-1.5 pr-8 pl-2 text-[11px] focus:outline-none transition-all w-32 focus:w-48 tracking-widest font-medium"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-black/10 rounded-none hover:bg-black/[0.02] transition-colors group">
              <span className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] group-hover:text-black transition-colors" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>فیلتر</span>
              <SlidersHorizontal size={14} className="text-black/40 group-hover:text-black transition-colors" strokeWidth={1.5} />
            </button>
         </div>
      </div>

      {/* 5. CONTINUOUS STORE GRID */}
      <main className="px-6 md:px-16 max-w-[1440px] mx-auto w-full pb-32">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-[16px] gap-y-[24px] md:gap-y-[32px]">
          {filteredStores.map((store, idx) => {
            const isPromoted = idx === 0 && selectedCategory === 'all';
            
            if (isPromoted) {
              return (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className="col-span-2 md:col-span-2"
                >
                  <PromotedStoreCard store={store} onClick={() => navigate(`/store/${store.slug}`)} />
                </motion.div>
              );
            }

            return (
              <motion.div
                key={store.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex flex-col group cursor-pointer w-full"
                onClick={() => navigate(`/store/${store.slug}`)}
              >
                {/* Image Tile - Editorial Ratio */}
                <div className="relative aspect-[4/5] w-full rounded-none overflow-hidden bg-black/[0.02]">
                  <ImageWithFallback 
                    src={store.coverImage} 
                    alt={store.name} 
                    className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-[1.02]"
                  />
                  
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
                    {store.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-black/20 uppercase tracking-[0.1em]">
                      {toPersianDigits(store.productCount)} محصول
                    </span>
                    <span className="w-1 h-1 rounded-full bg-black/10" />
                    <span className="text-[10px] font-bold text-black/20 uppercase tracking-[0.1em]">
                      {store.categories?.[0] || 'دکوراسیون'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Subtle Footer Quote */}
        <div className="mt-24 mb-12 flex flex-col items-center text-center">
           <div className="w-8 h-[1px] bg-black/5 mb-6" />
           <p className="text-[11px] font-bold text-black/15 max-w-[280px] leading-relaxed">
             این لیست بر اساس سلیقه و فضاهای انتخابی شما به صورت هوشمند گردآوری شده است.
           </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#FDFDFB] to-transparent pointer-events-none z-10" />
    </div>
  );
}

// 6) PROMOTED STORE CARD (EDITORIAL REDESIGN)
function PromotedStoreCard({ store, onClick }: { store: any; onClick: () => void }) {
  return (
    <div 
      className="relative w-full aspect-[1.6/1] rounded-none overflow-hidden group cursor-pointer bg-[var(--accent-light)] border border-black/[0.03] flex flex-col md:flex-row"
      onClick={onClick}
    >
      {/* Content Section */}
      <div className="absolute inset-0 md:relative md:w-1/2 p-5 md:p-14 flex flex-col justify-between z-20">
        <div className="space-y-3 md:space-y-6">
          <div className="inline-flex items-center gap-2 border-b border-[var(--accent)] text-[var(--accent)] pb-1 w-fit">
            <Sparkles size={10} md:size={12} strokeWidth={2} />
            <span className="md:text-[10px] font-bold uppercase tracking-[0.2em] text-[9px]">پیشنهاد ادیتوریال هُما</span>
          </div>
          
          <div className="space-y-1 md:space-y-3">
            <h2 className="text-[18px] md:text-[36px] font-medium text-black leading-tight tracking-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              {store.name}
            </h2>
            <p className="text-[11px] md:text-[15px] text-black/60 md:text-black/40 font-medium leading-relaxed max-w-[180px] md:max-w-xs line-clamp-2 md:line-clamp-none">
              مجموعه‌ای الهام‌بخش از چیدمان‌های مینیمال برای خانه‌ی شما.
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <button 
            className="h-9 md:h-12 px-5 md:px-8 bg-black text-white md:text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black/90 transition-all active:scale-95 flex items-center gap-2 md:gap-3 text-[10px]"
          >
            <span className="text-[12px]">مشاهده ویترین</span>
            <ArrowLeft size={12} md:size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Image Section */}
      <div className="absolute inset-0 md:relative md:w-1/2 overflow-hidden z-10">
        <ImageWithFallback 
          src={store.coverImage} 
          className="w-full h-full object-cover grayscale-[0.2] md:grayscale-[0.1] group-hover:grayscale-0 transition-transform duration-[2000ms] group-hover:scale-[1.05]" 
        />
        {/* Editorial Overlay for Mobile to ensure text legibility with 1.6/1 ratio */}
        <div className="absolute inset-0 bg-gradient-to-l from-[var(--accent-light)] via-[var(--accent-light)]/90 to-transparent md:hidden" />
      </div>
    </div>
  );
}

// Helper for Persian Digits
const toPersianDigits = (num: number | string) => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};