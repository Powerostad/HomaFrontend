import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  X,
  ArrowRight,
  Share2,
  Download,
  Heart,
  Bookmark,
  ArrowLeftRight,
  CheckCircle2,
  Sparkles,
  Plus,
  ShoppingBag,
  Layers,
  LayoutTemplate,
  Maximize2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { BeforeAfterSlider } from '../../components/BeforeAfterSlider';
import { Button } from '../../components/ui/button';
import { Header } from '../../components/Header';
import { ContextBar } from '../../components/ContextBar';
import { ProductDetailSheet, Product } from './components/ProductDetailSheet';
import { AuthModal } from '../../components/AuthModal';
import { DecisionPointOverlay } from '../../components/DecisionPointOverlay';

// --- Mock Data ---
const MOCK_RESULT_IMAGE = "https://images.unsplash.com/photo-1597665863042-47e00964d899?q=80&w=1200&auto=format&fit=crop";
const MOCK_BEFORE_IMAGE = "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop";

const INITIAL_PRODUCTS: (Product & { store?: string; style?: string })[] = [
  { 
    id: '1', 
    name: 'افشان کلاسیک', 
    price: 12500000,
    category: 'فرش',
    style: 'دستباف',
    store: 'فرش عظیم‌زاده',
    image: 'https://images.unsplash.com/photo-1594125675036-153d1b064762?q=80&w=300&auto=format&fit=crop',
    hotspot: { x: 50, y: 75 }
  },
  { 
    id: '2', 
    name: 'جستر راحتی', 
    price: 28000000,
    category: 'مبل',
    style: 'مینیمال',
    store: 'رستوران و دکوراسیون هرندی',
    image: 'https://images.unsplash.com/photo-1759722665629-29df6ee4f9a5?q=80&w=300&auto=format&fit=crop',
    hotspot: { x: 45, y: 55 }
  },
  { 
    id: '3', 
    name: 'آباژور مدرن', 
    price: 1450000,
    category: 'نورپردازی',
    style: 'مدرن',
    store: 'روشنایی مهتاب',
    image: 'https://images.unsplash.com/photo-1756474215831-4e5f8309c6bc?q=80&w=300&auto=format&fit=crop',
    hotspot: { x: 75, y: 45 }
  }
];

export function StudioResultPage() {
  const navigate = useNavigate();
  const { selectedFile, isLoggedIn, setUser } = useApp() as any;
  
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [displayProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(!isLoggedIn);
  const [showExitDecision, setShowExitDecision] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const totalPrice = displayProducts.reduce((acc, curr) => acc + curr.price, 0);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      setIsFullScreen(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => setOriginalImage(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile]);

  // Content shared between mobile/desktop (Zara Home Editorial Style)
  const InsightContent = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <div className={`flex flex-col gap-6 ${isDesktop ? 'px-10' : 'px-8'} pb-10`}> {/* Reduced gap from 10 to 6 */}
      
      {/* 1. Suggested Products - Editorial List */}
      <div className="space-y-2 pt-0"> {/* Reduced space and padding */}
        <div className="flex items-baseline justify-between border-b border-black/[0.05] pb-2"> {/* Reduced pb */}
          <h2 className="text-[20px] font-medium text-black tracking-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
            محصولات پیشنهادی
          </h2>
          <span className="text-[10px] text-black/30 font-medium tracking-wide uppercase" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
            Curated
          </span>
        </div>
        
        <div className="flex flex-col">
          {displayProducts.map((item, index) => {
            const isTopPick = index === 0;
            return (
              <div 
                key={item.id}
                className="group flex flex-row gap-6 py-8 first:pt-4 border-b border-black/[0.04] last:border-0"
              >
                {/* Product Frame - Editorial Compact Look */}
                <div 
                  className="relative w-[130px] aspect-[3/4] bg-black/[0.02] overflow-hidden cursor-pointer shrink-0 transition-all duration-500"
                  onClick={() => setSelectedProduct(item)}
                >
                  <ImageWithFallback 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" 
                  />
                  
                  {isTopPick && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-1.5 py-0.5 flex items-center gap-1.5">
                       <div className="w-1 h-1 rounded-full bg-accent" />
                       <span className="text-[7px] font-bold text-black uppercase tracking-[0.2em]" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                          انتخاب هُما
                       </span>
                    </div>
                  )}
                </div>

                {/* Content Section - Zara Editorial Hierarchy Compact */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[13px] font-bold text-black uppercase tracking-[0.05em] leading-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 opacity-30">
                          <span className="text-[8px] text-black font-bold uppercase tracking-[0.1em]">{item.category}</span>
                          <span className="w-0.5 h-0.5 rounded-full bg-black" />
                          <span className="text-[8px] text-black font-bold uppercase tracking-[0.1em]">{item.store}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }}
                        className={`transition-all active:scale-90 ${isSaved ? 'text-accent' : 'text-black/10 hover:text-black'}`}
                      >
                        <Bookmark size={16} strokeWidth={1.5} className={isSaved ? 'fill-current' : ''} />
                      </button>
                    </div>

                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-[18px] font-bold text-black tabular-nums tracking-tighter">
                        {item.price.toLocaleString('fa-IR')}
                      </span>
                      <span className="text-[9px] text-black/40 font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                        تومان
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedProduct(item)}
                    className="w-full h-10 border border-black/10 text-black text-[9px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-black hover:text-white active:scale-[0.98]"
                    style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                  >
                    جزییات محصول
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-8 pt-10 border-t border-black/[0.06]">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <span className="block text-[9px] text-black/30 font-bold uppercase tracking-[0.3em]">Collection Summary</span>
            <span className="block text-[11px] text-black/60 font-medium" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              {displayProducts.length.toLocaleString('fa-IR')} محصول در لیست نهایی
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[26px] font-bold text-black tabular-nums tracking-tighter">
              {totalPrice.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-black/40 font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              تومان
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            className="w-full h-12 bg-black text-white text-[11px] font-bold rounded-none uppercase tracking-[0.3em] hover:bg-black/90 transition-all active:scale-[0.99]"
            style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
          >
            نهایی‌سازی لیست
          </button>
          
          <div className="text-center pt-2">
            <p className="text-[9px] font-medium text-black/20 uppercase tracking-[0.5em]">Studio Homa • Editorial Selection</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-background relative overflow-hidden flex flex-col font-vazirmatn select-none" dir="rtl">
      
      {/* 1. Mobile-only Global Header */}
      {!isFullScreen && (
        <div className="md:hidden">
          <Header />
          <ContextBar 
            items={[
              { label: 'استودیو', href: '/studio' },
              { label: 'نتیجه طراحی' }
            ]}
            price={totalPrice}
          />
        </div>
      )}

      {/* 2. MAIN LAYOUT (Matches Try-On Split View) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* RIGHT PANEL (Desktop Sidebar) */}
        <div className="hidden md:flex flex-col w-[450px] h-full bg-card z-50 overflow-y-auto border-l border-border relative scrollbar-hide">
          <div className="p-8 pb-2 flex flex-col gap-2"> {/* Reduced padding and gap */}
            <div className="flex flex-col gap-0"> {/* Removed gap between subtitle and title */}
              <span className="text-muted-foreground uppercase tracking-widest leading-none mb-1" style={{ fontSize: '10px', fontWeight: 'var(--font-weight-bold)' }}>Studio Result</span>
              <h1 className="text-foreground leading-[1.1] m-0" style={{ fontSize: 'var(--text-h3-size)', fontWeight: 'var(--font-weight-bold)', fontFamily: 'var(--font-family-vazirmatn)' }}>تحلیل هوشمند فضا</h1>
            </div>
          </div>
          
          <InsightContent isDesktop />
        </div>

        {/* LEFT PANEL (Main Hero Area) */}
        <div className="hidden md:block flex-1 h-full bg-zinc-900 relative overflow-hidden group">
          <ImageWithFallback 
            src={MOCK_RESULT_IMAGE}
            alt="Studio Result" 
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${showOriginal ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100'}`}
          />
          {originalImage && (
            <img 
              src={originalImage}
              alt="Original" 
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${showOriginal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            />
          )}

          {/* Floating Actions (Try-On Style) */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top Bar */}
            <div className="absolute top-8 left-0 right-0 px-8 flex justify-between items-start pointer-events-auto">
              <button 
                onClick={() => setShowExitDecision(true)}
                className="w-12 h-12 rounded-full bg-black/10 backdrop-blur-xl border border-white/20 text-white hover:bg-black/20 flex items-center justify-center transition-all active:scale-90"
              >
                <ArrowRight size={24} />
              </button>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsSaved(!isSaved)}
                  className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center border transition-all active:scale-90 ${isSaved ? 'bg-white border-white text-accent' : 'bg-black/10 border-white/20 text-white hover:bg-black/20'}`}
                >
                  <Heart size={20} className={isSaved ? 'fill-current' : ''} />
                </button>
                <button className="w-12 h-12 rounded-full bg-black/10 backdrop-blur-xl border border-white/20 text-white hover:bg-black/20 flex items-center justify-center transition-all active:scale-90">
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-6">
              {/* Toggle Before/After */}
              <div className="flex items-center gap-0.5 p-1 bg-black/25 backdrop-blur-3xl rounded-full border border-white/5 shadow-xl">
                <button 
                  onClick={() => setShowOriginal(true)}
                  className={`px-5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-500 ${showOriginal ? 'bg-white/95 text-black' : 'text-white/40 hover:text-white'}`}
                >
                  قبل
                </button>
                <button 
                  onClick={() => setShowOriginal(false)}
                  className={`px-5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-500 ${!showOriginal ? 'bg-white/95 text-black' : 'text-white/40 hover:text-white'}`}
                >
                  بعد
                </button>
              </div>

              <button 
                onClick={() => setIsFullScreen(true)}
                className="flex items-center gap-3 px-8 h-[56px] bg-black/40 hover:bg-black/60 backdrop-blur-2xl rounded-full border border-white/20 text-white shadow-2xl transition-all active:scale-95 group/btn"
              >
                <Maximize2 size={18} />
                <span className="text-[13px] font-bold tracking-wide">مشاهده تمام صفحه</span>
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE LAYOUT (Unified Scroll) */}
        <div className="md:hidden absolute inset-0 bg-background flex flex-col z-0">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {/* Hero Image */}
            <div className="relative w-full h-[65vh]">
              <ImageWithFallback 
                src={MOCK_RESULT_IMAGE}
                alt="Studio Result" 
                className={`w-full h-full object-cover transition-opacity duration-500 ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
              />
              <button 
                className="absolute inset-0"
                onClick={() => setIsFullScreen(true)}
              />

              {/* Mobile Actions Overlay */}
              <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-center z-20">
                <button 
                  onClick={() => setShowExitDecision(true)}
                  className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90"
                >
                  <ArrowRight size={20} />
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsSaved(!isSaved)} 
                    className={`w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center border border-white/10 transition-all active:scale-90 ${isSaved ? 'text-accent bg-white' : 'text-white'}`}
                  >
                    <Heart size={18} className={isSaved ? 'fill-current' : ''} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90">
                    <Download size={18} />
                  </button>
                </div>
              </div>

              {/* View Fullscreen button - minimal style */}
              <button 
                onClick={() => setIsFullScreen(true)}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 active:scale-95 transition-all"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black/40 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl"
                >
                  <Maximize2 size={13} className="text-white/80" />
                  <span className="text-[10px] text-white tracking-[0.05em] uppercase font-bold" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                    نمای تمام‌صفحه
                  </span>
                </motion.div>
              </button>
            </div>

            {/* Scrolling Card Content */}
            <div className="relative -mt-8 bg-card rounded-t-[32px] pt-12 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] z-30 min-h-[50vh] pb-10">
              <InsightContent />
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN OVERLAY */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-[#121212] flex items-center justify-center overflow-hidden"
            onClick={() => setIsFullScreen(false)}
          >
            {/* Main Interactive Image Layer */}
            <motion.div 
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.y) > 100) setIsFullScreen(false);
              }}
              className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Container - Full Bleed */}
              <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4 md:p-8">
                <ImageWithFallback 
                  src={MOCK_RESULT_IMAGE}
                  alt="Studio Result" 
                  className={`max-w-full max-h-full object-contain transition-opacity duration-700 ease-in-out shadow-2xl ${showOriginal ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
                />
                {originalImage && (
                  <img 
                    src={originalImage}
                    alt="Original" 
                    className={`absolute inset-0 m-auto max-w-full max-h-full object-contain transition-opacity duration-700 ease-in-out shadow-2xl ${showOriginal ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                  />
                )}
                {/* Subtle Gradient Overlays for UI Readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
              </div>

              {/* Top Action Bar */}
              <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-50">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsFullScreen(false)}
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-2xl flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-all active:scale-90"
                  >
                    <X size={22} />
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-2xl flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-all active:scale-90">
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={() => setIsSaved(!isSaved)}
                    className={`w-12 h-12 rounded-full backdrop-blur-2xl flex items-center justify-center border border-white/10 transition-all active:scale-90 ${isSaved ? 'bg-white text-accent' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    <Bookmark size={20} className={isSaved ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>

              {/* Floating Comparison Toggle - Editorial Style */}
              <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-4 z-50">
                <div className="p-1 bg-black/30 backdrop-blur-3xl rounded-full border border-white/10 shadow-2xl flex items-center gap-1">
                  <button 
                    onClick={() => setShowOriginal(true)}
                    className={`px-8 h-10 rounded-full text-[12px] font-bold transition-all duration-500 ${showOriginal ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                    style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                  >
                    قبل
                  </button>
                  <button 
                    onClick={() => setShowOriginal(false)}
                    className={`px-8 h-10 rounded-full text-[12px] font-bold transition-all duration-500 ${!showOriginal ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                    style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                  >
                    بعد
                  </button>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-[0.3em]" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                    نگه‌دار برای مقایسه
                  </span>
                  <div className="w-1 h-1 rounded-full bg-white/20 animate-pulse" />
                </div>
              </div>

              {/* Hint for dismissal */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/20 z-50 pointer-events-none" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      {selectedProduct && (
         <ProductDetailSheet 
            product={selectedProduct} 
            isOpen={!!selectedProduct} 
            onClose={() => setSelectedProduct(null)}
            onReplace={() => {}} 
         />
      )}

      {/* Exit Decision Overlay (Try-On Style) */}
      <AnimatePresence>
        {showExitDecision && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/10 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.05, opacity: 0 }}
              className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[32px] p-8 max-w-[340px] w-full shadow-[0_24px_80px_rgba(0,0,0,0.15)] flex flex-col items-center text-center gap-8"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-[18px] font-bold text-black" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>ذخیره و خروج</h3>
                <p className="text-[14px] text-black/70 leading-relaxed font-medium" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                  طراحی شما ذخیره شده و به استودیو باز می‌گردید.
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => {
                    setIsSaved(true);
                    setShowExitDecision(false);
                    navigate('/studio/upload');
                  }}
                  className="w-full h-[56px] bg-black text-white rounded-full font-bold text-[14px] hover:opacity-90 transition-all active:scale-95 shadow-lg"
                  style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                >
                  تایید و بازگشت
                </button>
                <button 
                  onClick={() => setShowExitDecision(false)}
                  className="w-full h-[56px] bg-white/20 text-black border border-white/20 rounded-full font-bold text-[14px] hover:bg-white/30 transition-all active:scale-95"
                  style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal over the Result */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => {
          if (isLoggedIn) setIsAuthModalOpen(false);
          else navigate('/studio/upload');
        }} 
        onSuccess={(user) => {
          setUser?.(user);
          setIsAuthModalOpen(false);
        }}
      />
      
    </div>
  );
}