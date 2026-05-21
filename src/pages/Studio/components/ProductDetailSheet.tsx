import { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Check,
  RotateCw,
  Sparkles,
  LayoutGrid,
  Bookmark,
  Share2,
  Truck,
  ShieldCheck
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '../../../components/ui/dialog';
import { AuthenticatedImage } from '../../../components/figma/AuthenticatedImage';
import { BuyButton } from '../../../components/BuyButton';
import { AddToBasketButton } from '../../../components/basket/AddToBasketButton';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
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
  // Smart Redesign: New fields for real data
  persianReason?: string;
  matchHighlights?: string[];
  description?: string;
  extraDetails?: Record<string, unknown>;
  link?: string;
  uniqueLink?: string;
  availableSizes?: string[];
  availableSizesDisplay?: string[];
  sizePrices?: Record<string, number> | null;
  sizePricesDisplay?: Array<{
    code: string;
    display: string;
    price: number | null;
    hasSpecificPrice: boolean;
  }>;
  priceRange?: { min: number; max: number } | null;
  matchScore?: number;
  isPromoted?: boolean;
}

interface ProductAlternative extends Omit<Product, 'hotspot'> {
  label?: string;
}

interface ProductDetailSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onReplace: (originalId: string, newProduct: Product) => void;
  alternatives?: Product[];  // Smart Redesign: Real alternatives from session
  redesignSessionId?: string;  // For click tracking
}

// Tabs Configuration
const TABS = [
  { id: 'details', label: 'مشخصات' },
  { id: 'why', label: 'چرا این؟' },
  { id: 'alternatives', label: 'جایگزین‌ها' },
];

export function ProductDetailSheet({ product, isOpen, onClose, onReplace, alternatives: propAlternatives, redesignSessionId }: ProductDetailSheetProps) {
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isScrolling, setIsScrolling] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { t } = useTranslation();

  // Refs for ScrollSpy
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Reset state when product changes
  useEffect(() => {
    setReplacingId(null);
    setIsFavorite(false);
    setActiveTab('details');
    setSelectedSize(null);
  }, [product, isOpen]);

  // Computed price based on selected size. This hook must run unconditionally
  // — before the early return below — so it guards against a null product.
  const { displayPrice, selectedSizeHasPrice } = useMemo(() => {
    if (!product) {
      return { displayPrice: 0, selectedSizeHasPrice: false };
    }
    if (selectedSize && product.sizePrices && product.sizePrices[selectedSize] != null) {
      return { displayPrice: product.sizePrices[selectedSize], selectedSizeHasPrice: true };
    }
    return { displayPrice: product.price, selectedSizeHasPrice: !selectedSize };
  }, [selectedSize, product]);

  if (!product) return null;

  // Use passed alternatives or empty array, add labels
  const alternatives: ProductAlternative[] = (propAlternatives || []).map((alt, index) => ({
    ...alt,
    label: index === 0 ? 'نزدیک‌ترین' : index === 1 ? 'اقتصادی‌تر' : 'پیشنهاد دیگر'
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
                    <AuthenticatedImage
                        src={product.image}
                        alt={product.name}
                        imageWidth={600}
                        imageQuality={85}
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
                                {selectedSizeHasPrice ? (
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[22px] font-bold text-black tabular-nums">
                                            {formatPriceFromRial(displayPrice, false)}
                                        </span>
                                        <span className="text-[12px] text-black/40 font-bold">تومان</span>
                                    </div>
                                ) : product.link ? (
                                    <a href={product.link} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-brand-primary hover:underline">
                                        {t('product.checkPriceOnWebsite', 'مشاهده قیمت در سایت فروشنده')}
                                    </a>
                                ) : (
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[22px] font-bold text-black tabular-nums">
                                            {formatPriceFromRial(displayPrice, false)}
                                        </span>
                                        <span className="text-[12px] text-black/40 font-bold">تومان</span>
                                    </div>
                                )}
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
                        {(product.extraDetails as Record<string, string> | undefined)?.composition && (
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-black/40 font-bold uppercase tracking-[0.15em]">ترکیبات</span>
                                <span className="text-[12px] text-black font-medium">{(product.extraDetails as Record<string, string>).composition}</span>
                            </div>
                        )}
                        {(product.extraDetails as Record<string, string> | undefined)?.dimensions && (
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-black/40 font-bold uppercase tracking-[0.15em]">ابعاد نهایی</span>
                                <span className="text-[12px] text-black font-medium tabular-nums">{(product.extraDetails as Record<string, string>).dimensions}</span>
                            </div>
                        )}
                        {product.sizePricesDisplay && product.sizePricesDisplay.length > 0 ? (
                            <div className="space-y-3">
                                <span className="text-[10px] text-black/40 font-bold uppercase tracking-[0.15em]">{t('product.selectSize', 'انتخاب سایز')}</span>
                                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                                    {product.sizePricesDisplay.map((sizeInfo) => (
                                        <button
                                            key={sizeInfo.code}
                                            onClick={() => setSelectedSize(selectedSize === sizeInfo.code ? null : sizeInfo.code)}
                                            className={`flex-shrink-0 px-3 py-2 rounded-lg border transition-all text-center min-w-[80px] ${
                                                selectedSize === sizeInfo.code
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-black border-black/10 hover:border-black/30'
                                            }`}
                                        >
                                            <div className="text-[12px] font-bold">{sizeInfo.display}</div>
                                            {sizeInfo.hasSpecificPrice && sizeInfo.price != null ? (
                                                <div className={`text-[10px] mt-0.5 ${selectedSize === sizeInfo.code ? 'text-white/70' : 'text-black/40'}`}>
                                                    {formatPriceFromRial(sizeInfo.price, false)}
                                                </div>
                                            ) : (
                                                <div className={`text-[9px] mt-0.5 ${selectedSize === sizeInfo.code ? 'text-white/70' : 'text-black/30'}`}>
                                                    {t('product.priceOnSellerSite', 'قیمت در سایت')}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : product.availableSizesDisplay && product.availableSizesDisplay.length > 0 ? (
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-black/40 font-bold uppercase tracking-[0.15em]">سایزهای موجود</span>
                                <span className="text-[12px] text-black font-medium">{product.availableSizesDisplay.join('، ')}</span>
                            </div>
                        ) : null}
                        {(product.extraDetails as Record<string, string> | undefined)?.weight && (
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-black/40 font-bold uppercase tracking-[0.15em]">وزن تقریبی</span>
                                <span className="text-[12px] text-black font-medium tabular-nums">{(product.extraDetails as Record<string, string>).weight}</span>
                            </div>
                        )}
                        {product.uniqueLink && (
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-[10px] text-black/40 font-bold uppercase tracking-[0.15em]">شناسه کالا</span>
                                <span className="text-[11px] text-black/50 tabular-nums tracking-tighter">REF. {product.uniqueLink}</span>
                            </div>
                        )}
                        {/* Show category if no other specs available */}
                        {!product.extraDetails && !product.availableSizesDisplay?.length && !product.uniqueLink && (
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-black/40 font-bold uppercase tracking-[0.15em]">دسته‌بندی</span>
                                <span className="text-[12px] text-black font-medium">{product.category}</span>
                            </div>
                        )}
                    </div>

                    {/* Bulleted Info - Editorial Style */}
                    <div className="space-y-4 pt-2">
                        <h4 className="text-[13px] font-bold text-black uppercase tracking-widest border-b border-black/5 pb-2">درباره محصول</h4>
                        {product.description ? (
                            <p className="text-[13px] text-black/70 leading-relaxed text-justify">
                                {product.description}
                            </p>
                        ) : (
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
                        )}
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
                        {/* Show real AI reason if available */}
                        {product.persianReason ? (
                            <div className="flex items-center gap-4 group">
                                <div className="w-8 h-8 rounded-full bg-white border border-black/[0.05] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                    <Check size={14} className="text-black" strokeWidth={3} />
                                </div>
                                <span className="text-[13px] font-medium text-black/80">
                                    {product.persianReason}
                                </span>
                            </div>
                        ) : (
                            /* Fallback generic reasons when no AI reason available */
                            ['هماهنگی با فضای اتاق شما', 'تطابق سبک و رنگ با دکوراسیون'].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 group">
                                    <div className="w-8 h-8 rounded-full bg-white border border-black/[0.05] flex items-center justify-center shrink-0 shadow-sm">
                                        <Check size={14} className="text-black" strokeWidth={3} />
                                    </div>
                                    <span className="text-[13px] font-medium text-black/80">{item}</span>
                                </div>
                            ))
                        )}

                        {/* Show match highlights as tags */}
                        {product.matchHighlights && product.matchHighlights.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {product.matchHighlights.map((highlight, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 text-[11px] font-bold bg-black/5 rounded-full text-black/60"
                                    >
                                        {highlight}
                                    </span>
                                ))}
                            </div>
                        )}
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
                        {alternatives.length > 0 ? `${alternatives.length} پیشنهاد جایگزین` : 'جایگزین‌ها'}
                    </h3>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                        برای تغییر سریع در فضای شما
                    </p>
                </div>

                {alternatives.length > 0 ? (
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
                                        <AuthenticatedImage
                                            src={alt.image}
                                            alt={alt.name}
                                            imageWidth={300}
                                            imageQuality={80}
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
                                        {alt.label && (
                                            <span className="text-[10px] text-black/40">{alt.label}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-[12px] text-black/40 text-center py-4">
                        جایگزین‌های مشابه یافت نشد
                    </p>
                )}
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
                    {selectedSizeHasPrice ? (
                        <>
                            <span className="text-[18px] font-bold text-black tabular-nums">
                               {formatPriceFromRial(displayPrice, false)}
                            </span>
                            <span className="text-[10px] text-black/40 font-bold">تومان</span>
                        </>
                    ) : product.link ? (
                        <a href={product.link} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-brand-primary hover:underline">
                            {t('product.checkPriceOnWebsite', 'مشاهده قیمت در سایت فروشنده')}
                        </a>
                    ) : (
                        <>
                            <span className="text-[18px] font-bold text-black tabular-nums">
                               {formatPriceFromRial(displayPrice, false)}
                            </span>
                            <span className="text-[10px] text-black/40 font-bold">تومان</span>
                        </>
                    )}
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
                {product.uniqueLink && (
                  <AddToBasketButton
                    productUniqueLink={product.uniqueLink}
                    sourceContext="studio"
                    redesign_session_id={redesignSessionId || undefined}
                    openOnAdd
                    className="flex-[2] h-[44px] rounded-full text-[12px] font-bold tracking-tight"
                  />
                )}

                {product.uniqueLink && (
                  <BuyButton
                    productId={product.uniqueLink}
                    sourceContext="studio"
                    redesignSessionId={redesignSessionId}
                    shopName={product.store}
                    className="flex-1 h-[44px] bg-white border border-black/10 text-black rounded-full flex items-center justify-center gap-2 text-[11px] font-bold hover:border-black transition-all active:scale-[0.98]"
                  />
                )}
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}