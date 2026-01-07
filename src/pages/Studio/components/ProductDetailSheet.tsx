import { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  RotateCw,
  Sparkles,
  LayoutGrid,
  Bookmark,
  Share2,
  Truck,
  ShieldCheck,
  Plus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '../../../components/ui/dialog';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { formatPriceFromRial } from '../../../utils/formatters';

// --- Types ---
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  store?: string;
  style?: string;
  hotspot?: { x: number; y: number };
}

interface ProductAlternative extends Omit<Product, 'hotspot'> {
  label?: string;
}

interface ProductDetailSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onReplace: (originalId: string, newProduct: Product) => void;
}

// --- Mock Alternatives ---
const MOCK_ALTERNATIVES = [
  {
    id: 'alt-1',
    name: 'فرش وینتیج طوسی',
    price: 11800000,
    category: 'فرش دستباف',
    image: 'https://images.unsplash.com/photo-1600166898405-da9535204843?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'alt-2',
    name: 'مدرن پشمی',
    price: 13500000,
    category: 'فرش ماشینی',
    image: 'https://images.unsplash.com/photo-1575414003591-ece8d0416c7a?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'alt-3',
    name: 'گلیم دستباف',
    price: 9800000,
    category: 'گلیم',
    image: 'https://images.unsplash.com/photo-1596280687729-c725593c6628?q=80&w=300&auto=format&fit=crop'
  }
];

// Tabs Configuration
const TABS = [
  { id: 'details', label: 'مشخصات' },
  { id: 'why', label: 'چرا این؟' },
  { id: 'alternatives', label: 'جایگزین‌ها' },
];

export function ProductDetailSheet({ product, isOpen, onClose, onReplace }: ProductDetailSheetProps) {
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isScrolling, setIsScrolling] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Refs for ScrollSpy
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Reset state when product changes
  useEffect(() => {
    setReplacingId(null);
    setIsFavorite(false);
    setActiveTab('details');
  }, [product, isOpen]);

  if (!product) return null;

  // Generate "smart" alternatives
  const alternatives = MOCK_ALTERNATIVES.map((alt, index) => ({
    ...alt,
    id: `alt-${product.id}-${alt.id}`, 
    category: product.category,
    label: index === 0 ? 'نزدیک‌ترین' : index === 1 ? 'اقتصادی‌تر' : 'جسورانه‌تر'
  }));

  const handleReplace = async (alt: ProductAlternative) => {
    setReplacingId(alt.id);
    await new Promise(resolve => setTimeout(resolve, 800));
    onReplace(product.id, { ...alt, hotspot: product.hotspot });
    setReplacingId(null);
    toast.success('محصول با موفقیت جایگزین شد', {
        className: 'font-[family-name:var(--font-family-vazirmatn)]',
        description: 'نسخه جدید در فضای شما اعمال شد.'
    });
  };

  // Scroll to Section Handler
  const scrollToSection = (id: string) => {
    setIsScrolling(true);
    setActiveTab(id);
    const element = sectionRefs.current[id];
    if (element && containerRef.current) {
        // Offset for the sticky headers (Header + Tabs) = approx 110px
        const offset = 110; 
        const top = element.offsetTop - offset;
        containerRef.current.scrollTo({ top, behavior: 'smooth' });
        
        // Reset scrolling lock after animation
        setTimeout(() => setIsScrolling(false), 600);
    }
  };

  // ScrollSpy Listener
  const handleScroll = () => {
    if (isScrolling || !containerRef.current) return;

    const scrollPosition = containerRef.current.scrollTop + 140; // Offset for detection center
    
    // Find the current section
    for (const tab of TABS) {
        const element = sectionRefs.current[tab.id];
        if (element) {
            const { offsetTop, offsetHeight } = element;
            if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                setActiveTab(tab.id);
                break;
            }
        }
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent 
        className="p-0 overflow-hidden shadow-2xl flex flex-col focus:outline-none max-w-md mx-auto"
        style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-family-vazirmatn)',
            height: '95vh',
            maxHeight: '900px',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div className="sr-only">
            <DialogTitle>جزئیات محصول</DialogTitle>
            <DialogDescription>{product.name}</DialogDescription>
        </div>

        {/* --- FLOAT CLOSE BUTTON (Zara Home Editorial) --- */}
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
            className="absolute top-10 right-6 z-[200] w-10 h-10 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-xl border border-black/[0.08] hover:bg-white hover:border-black/20 active:scale-90 transition-all shadow-sm cursor-pointer group"
            aria-label="بستن صفحه"
        >
            <X size={20} strokeWidth={1.2} className="text-black transition-transform group-hover:rotate-90" />
        </button>

        {/* --- 1. MAIN HEADER (Sticky Base) --- */}
        <div 
            className="sticky top-0 w-full flex items-center justify-center shrink-0 z-[110] border-b border-black/[0.03]"
            style={{ 
              height: '72px',
              backgroundColor: 'rgba(255, 255, 255, 0.98)', 
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
        >
           <h3 className="text-[10px] font-bold text-black uppercase tracking-[0.4em] opacity-40 select-none pointer-events-none">
              Item Information
           </h3>
        </div>

        {/* --- 2. TABS HEADER (Sticky below Main Header) --- */}
        <div 
            className="flex items-center justify-around shrink-0 z-40 border-b border-black/[0.03] px-6"
            style={{ 
              height: '48px',
              backgroundColor: 'rgba(255, 255, 255, 0.4)', 
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
        >
            {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => scrollToSection(tab.id)}
                        className={`relative flex items-center justify-center h-full px-4 text-[13px] transition-all ${isActive ? 'text-black font-bold' : 'text-black/40 hover:text-black'}`}
                        style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                    >
                        {tab.label}
                        {isActive && (
                            <motion.div 
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-black"
                                initial={false}
                            />
                        )}
                    </button>
                );
            })}
        </div>

        {/* --- SCROLLABLE CONTENT --- */}
        <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden relative scroll-smooth bg-white"
        >
            
            {/* ================= SECTION 1: DETAILS ================= */}
            <div 
                ref={(el) => (sectionRefs.current['details'] = el)}
                className="pt-6 pb-8"
                style={{ paddingInline: 'var(--spacing-md)' }}
            >
                {/* Image - Minimal Luxury Style */}
                <div 
                    className="relative aspect-square w-full bg-white overflow-hidden border border-black/[0.03] mb-8 group"
                >
                    <ImageWithFallback 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-contain p-8 mix-blend-multiply transition-transform duration-700 group-hover:scale-105" 
                    />
                </div>

                {/* Info Header */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-start gap-4">
                            <h2 className="text-[24px] font-bold text-black leading-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                                {product.name}
                            </h2>
                            <div className="flex flex-col items-end">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[22px] font-bold text-black tabular-nums">
                                        {formatPriceFromRial(product.price, false)}
                                    </span>
                                    <span className="text-[12px] text-black/40 font-bold">تومان</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-feedback-good" />
                                    <span className="text-[11px] text-black/40 font-medium">موجود در انبار</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[14px] text-black/40 font-medium">{product.category} • کالکشن ۲۰۲۶</p>
                    </div>

                    {/* Editorial Specs List - Zara Home Style */}
                    <div className="border-y border-black/5 py-5 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-black/40 font-bold uppercase tracking-[0.15em]">ترکیبات</span>
                            <span className="text-[12px] text-black font-medium">۱۰۰٪ کتان ارگانیک، چوب راش طبیعی</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-black/40 font-bold uppercase tracking-[0.15em]">ابعاد نهایی</span>
                            <span className="text-[12px] text-black font-medium tabular-nums">۱۲۰ × ۸۰ × ۴۵ سانتی‌متر</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-black/40 font-bold uppercase tracking-[0.15em]">وزن تقریبی</span>
                            <span className="text-[12px] text-black font-medium tabular-nums">۴.۲ کیلوگرم</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-[10px] text-black/40 font-bold uppercase tracking-[0.15em]">شناسه کالا</span>
                            <span className="text-[11px] text-black/50 tabular-nums tracking-tighter">REF. 7241/405/800</span>
                        </div>
                    </div>

                    {/* Bulleted Info - Editorial Style */}
                    <div className="space-y-4 pt-2">
                        <h4 className="text-[13px] font-bold text-black uppercase tracking-widest border-b border-black/5 pb-2">درباره محصول</h4>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-1.5 w-1 h-1 rounded-full bg-black/20 shrink-0" />
                                <p className="text-[13px] text-black/70 leading-relaxed">طراحی مینیمال متناسب با فضاهای مدرن و آپارتمانی</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1.5 w-1 h-1 rounded-full bg-black/20 shrink-0" />
                                <p className="text-[13px] text-black/70 leading-relaxed">استفاده از متریال ارگانیک با دوام بالا و ضد حساسیت</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1.5 w-1 h-1 rounded-full bg-black/20 shrink-0" />
                                <p className="text-[13px] text-black/70 leading-relaxed">تولید شده توسط برند هُما با تضمین اصالت کالا</p>
                            </div>
                        </div>
                        {!showFullDesc ? (
                            <button 
                                onClick={() => setShowFullDesc(true)}
                                className="text-[11px] font-bold text-black border-b border-black/20 pb-0.5 hover:border-black transition-all"
                            >
                                ادامه توضیحات
                            </button>
                        ) : (
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[13px] text-black/50 leading-relaxed text-justify"
                            >
                                این محصول با دقت فراوان و با در نظر گرفتن جزئیات ارگونومیک طراحی شده است تا بیشترین راحتی را در کنار زیبایی بصری برای شما فراهم آورد. پارچه‌های استفاده شده از بهترین کتان‌های ایتالیایی انتخاب شده‌اند.
                            </motion.p>
                        )}
                    </div>

                    {/* Service Badges */}
                    <div className="flex items-center gap-6 py-4 border-y border-black/5">
                        <div className="flex items-center gap-2">
                            <Truck size={16} className="text-black/30" />
                            <span className="text-[11px] text-black/60 font-medium">ارسال رایگان</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-black/30" />
                            <span className="text-[11px] text-black/60 font-medium">ضمنت اصالت</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= SECTION 2: WHY THIS? ================= */}
            <div 
                ref={(el) => (sectionRefs.current['why'] = el)}
                className="py-10 bg-black/[0.01]"
                style={{ paddingInline: 'var(--spacing-md)' }}
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-black/20" />
                        <h4 className="text-[15px] font-bold text-black" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                            تحلیل هوشمند هُما
                        </h4>
                    </div>
                    
                    <div className="space-y-4">
                        {[
                            'هماهنگی رنگ با پالت رنگی فضای فعلی شما',
                            'تطابق ابعاد با فضای پیشنهادی در نقشه',
                            'بهبود نورپردازی محیطی با انعکاس ملایم نور',
                            'تکمیل سبک دکوراسیون مینیمال/مدرن'
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 group">
                                <div className="w-8 h-8 rounded-full bg-white border border-black/[0.05] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                    <Check size={14} className="text-black" strokeWidth={3} />
                                </div>
                                <span className="text-[13px] font-medium text-black/80">
                                    {item}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="h-px bg-black/[0.05] w-full" />

            {/* ================= SECTION 3: ALTERNATIVES ================= */}
            <div 
                ref={(el) => (sectionRefs.current['alternatives'] = el)}
                className="pt-6 pb-32"
                style={{ paddingInline: 'var(--spacing-md)' }}
            >
                <div className="mb-4">
                    <h3 className="text-[15px] font-[900] text-[var(--foreground)] flex items-center gap-2">
                        <LayoutGrid size={16} className="text-[var(--muted-foreground)]" />
                        ۳ پیشنهاد جایگزین
                    </h3>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                        برای تغییر سریع در فضای شما
                    </p>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none -mx-2 px-2">
                    {alternatives.map((alt) => {
                        const isReplacing = replacingId === alt.id;
                        return (
                            <div 
                                key={alt.id} 
                                className="flex-shrink-0 w-[140px] flex flex-col gap-2 group cursor-pointer"
                                onClick={() => !isReplacing && handleReplace(alt)}
                            >
                                <div className="relative aspect-square rounded-[18px] overflow-hidden border border-white/40 bg-white/60 shadow-sm transition-transform active:scale-95">
                                    <ImageWithFallback 
                                        src={alt.image} 
                                        alt={alt.name} 
                                        className="w-full h-full object-cover mix-blend-multiply" 
                                    />
                                    {isReplacing && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                                <RotateCw size={24} className="text-[var(--accent)]" />
                                            </motion.div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1 px-1 text-center">
                                    <h4 className="truncate text-[12px] font-bold text-[var(--foreground)]">
                                        {alt.name}
                                    </h4>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* --- STICKY FOOTER (Editorial Minimal) --- */}
        <div 
            className="absolute bottom-0 inset-x-0 z-[100]"
            style={{ 
              padding: '16px 24px 24px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(0, 0, 0, 0.04)'
            }}
        >
           <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] text-black/30 font-bold uppercase tracking-widest">قیمت:</span>
                    <span className="text-[18px] font-bold text-black tabular-nums">
                       {formatPriceFromRial(product.price, false)}
                    </span>
                    <span className="text-[10px] text-black/40 font-bold">تومان</span>
                </div>
                
                <div className="flex gap-1">
                    <button 
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${isFavorite ? 'text-accent' : 'text-black/20 hover:text-black'}`}
                    >
                        <Bookmark size={18} className={isFavorite ? "fill-current" : ""} />
                    </button>
                    <button className="w-9 h-9 rounded-full flex items-center justify-center text-black/20 hover:text-black transition-all active:scale-90">
                        <Share2 size={18} />
                    </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                    className="flex-[2] h-[44px] bg-black text-white rounded-full flex items-center justify-center gap-2 text-[12px] font-bold tracking-tight hover:bg-black/90 transition-all active:scale-[0.98]"
                    style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                >
                    <Plus size={16} strokeWidth={3} />
                    افزودن به لیست خرید
                </button>
                
                <button 
                    className="flex-1 h-[44px] bg-white border border-black/10 text-black rounded-full flex items-center justify-center gap-2 text-[11px] font-bold hover:border-black transition-all active:scale-[0.98]"
                    style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                >
                    مشاهده در فروشگاه
                </button>
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}