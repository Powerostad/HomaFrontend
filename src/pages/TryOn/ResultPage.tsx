import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import {
   ArrowRight,
   Share2,
   Download,
   ShoppingBag,
   Image as ImageIcon,
   Maximize2,
   ChevronLeft,
   X,
   Menu,
   Heart,
   CheckCircle2
} from "lucide-react";
import { useApp } from '../../context/AppContext';
import { useAuth, useUpload, useProduct } from '../../context/AppProviders';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Button } from '../../components/ui/button';
import { Header } from '../../components/Header';
import { Logo } from '../../components/Logo';
import { MOCK_STORES } from '../../data/mock';
import { AuthModal } from '../../components/AuthModal';
import { SidebarMenu } from '../../components/SidebarMenu';
import { toast } from "sonner";
import type { User } from '../../context/AuthContext';
import type { Product } from '../../types/product';
const resultImage = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200";

// --- Constants ---
// const ABSTRACT_CHROME_URL = "https://images.unsplash.com/photo-1631663026562-1f55f0ecac3e?q=80&w=600"; // Unused

// --- Helper for Persian Digits ---
const toPersianDigits = (value: number | string) => {
   if (value === undefined || value === null) return '';
   const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
   return value.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

// --- Mock Data ---
const MOCK_RESULT_IMAGE = resultImage;

const PRODUCT_CENTRIC_RECOMMENDATIONS = [
   {
      id: 'rel-1',
      name: 'آباژور مدرن لونا',
      price: 3450000,
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=400',
      category: 'نورپردازی',
      reason: 'برای تعادل نوری در شب',
      specs: [
         { label: 'جنس پایه', value: 'فلز آنودایز شده' },
         { label: 'ابعاد', value: '۴۵ × ۲۰ سانتی‌متر' }
      ]
   },
   {
      id: 'rel-2',
      name: 'گلدان مدرن بیستون',
      price: 1200000,
      image: 'https://images.unsplash.com/photo-1581781870027-04212e231e96?q=80&w=400',
      category: 'دکوراتیو',
      reason: 'برای گرم‌تر شدن فضا',
      specs: [
         { label: 'متریال', value: 'سرامیک دست‌ساز' },
         { label: 'رنگ', value: 'کرم مات' }
      ]
   }
];

function copyToClipboard(text: string) {
   try {
      if (navigator.clipboard && window.isSecureContext) {
         navigator.clipboard.writeText(text)
            .then(() => toast.success('لینک صفحه کپی شد'))
            .catch(() => fallbackCopy(text));
      } else {
         fallbackCopy(text);
      }
   } catch (err) {
      fallbackCopy(text);
   }
}

function fallbackCopy(text: string) {
   try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
         toast.success('لینک صفحه کپی شد');
      } else {
         toast.error('کپی انجام نشد. لطفا آدرس را دستی کپی کنید');
      }
   } catch (err) {
      toast.error('خطا در دسترسی به حافظه موقت');
   }
}

export function TryOnResultPage() {
   const navigate = useNavigate();
   const { isLoggedIn, login } = useAuth();
   const { selectedFile } = useUpload();
   const { product } = useProduct();
   const [originalImage, setOriginalImage] = useState<string | null>(null);
   const [showOriginal, setShowOriginal] = useState(false);
   const [isSaved, setIsSaved] = useState(false);
   const [isFullScreen, setIsFullScreen] = useState(false);
   const [showDownloadMenu, setShowDownloadMenu] = useState(false);
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [showExitConfirm, setShowExitConfirm] = useState(false);
   const [showAutoSaveNotice, setShowAutoSaveNotice] = useState(false);
   const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // Changed: Default to false
   const [pendingRedirect, setPendingRedirect] = useState(false);

   // --- Initial Auth Check (Removed forced login) ---
   // useEffect(() => {
   //   if (!isLoggedIn) {
   //     setIsAuthModalOpen(true);
   //     setIsFullScreen(false);
   //   }
   // }, [isLoggedIn]);

   // --- Exit Handling ---
   const handleExitRequest = () => {
      setShowExitConfirm(true);
   };

   const proceedWithExit = () => {
      setShowExitConfirm(false);

      // First time exiting in this session: Show the fancy auto-save notice
      const hasSeenNotice = sessionStorage.getItem('homa_has_seen_save_notice');

      if (!hasSeenNotice) {
         setIsSaved(true);
         setShowAutoSaveNotice(true);
         sessionStorage.setItem('homa_has_seen_save_notice', 'true');

         // Auto-navigate after the notice animation finishes
         setTimeout(() => {
            executeStoreNavigation();

            // Show the non-blocking toast after navigation (or just before)
            toast("نتیجه‌ات ذخیره شد. هر وقت خواستی از گالری می‌تونی دوباره ببینیش.", {
               action: {
                  label: "مشاهده",
                  onClick: () => navigate("/account/gallery")
               },
               duration: 5000,
            });
         }, 3000);
      } else {
         // If already seen in this session, still show a quick save effect or just go
         executeStoreNavigation();
      }
   };

   const handleAuthSuccess = (userData: User) => {
      login(userData);
      setIsAuthModalOpen(false);

      if (pendingRedirect) {
         setPendingRedirect(false);
         proceedWithExit();
      }
   };

   const confirmExit = () => {
      setShowExitConfirm(false);
      handleStoreNavigation();
   };

   // --- Store Navigation Logic ---
   const handleStoreNavigation = () => {
      // ALWAYS trigger the exit request modal when trying to leave via these specific buttons
      setShowExitConfirm(true);
   };

   const executeStoreNavigation = () => {
      const sellerName = product?.seller?.name || product?.brand;
      const store = MOCK_STORES.find(s => s.name === sellerName);
      if (store) {
         navigate(`/store/${store.slug}`);
      } else {
         navigate('/explore');
      }
   };

   // --- Download Logic ---
   const handleDownload = (type: 'before' | 'after' | 'both') => {
      toast.info('در حال آماده‌سازی فایل...');
      setShowDownloadMenu(false);
   };

   // --- Add to Cart Logic ---
   const handleAddToCart = () => {
      toast.success('به سبد خرید اضافه شد');
   };

   useEffect(() => {
      if (selectedFile) {
         const reader = new FileReader();
         reader.onload = (e) => setOriginalImage(e.target?.result as string);
         reader.readAsDataURL(selectedFile);
      }
   }, [selectedFile]);

   // Extract content to avoid duplication
   interface ProductContentProps {
      product: Product | null;
      toPersianDigits: (value: number | string) => string;
      setShowExitConfirm: React.Dispatch<React.SetStateAction<boolean>>;
      navigate: ReturnType<typeof useNavigate>;
      isDesktop: boolean;
   }

   const ProductContent = ({
      product,
      toPersianDigits,
      setShowExitConfirm,
      navigate,
      isDesktop
   }: ProductContentProps) => {
      return (
         <div className={`flex flex-col gap-12 ${isDesktop ? 'px-12' : 'px-8'} pb-[96px] bg-[#FDFDFB]`}>
            {/* Product Header Section - Editorial Style */}
            <div className="flex flex-col gap-6 pb-8 border-b border-black/[0.08]">
               <span className="text-[15px] font-bold uppercase tracking-[0.3em] text-black/40 text-[rgba(7,7,7,0.73)]">محصول تست شده</span>
               <div className="flex gap-6 items-start">
                  <div className="relative w-[100px] h-[100px] overflow-hidden flex-shrink-0 border border-black/[0.05] bg-black/[0.02]">
                     <ImageWithFallback
                        src={product?.image || MOCK_RESULT_IMAGE}
                        alt={product?.name}
                        className="w-full h-full object-cover grayscale-[0.2]"
                     />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                     <h1 className="text-[20px] font-light text-black leading-tight tracking-tight">{product?.name || 'مبل مدرن کالکشن پاییز'}</h1>
                     <div className="flex items-baseline gap-1.5">
                        <span className="text-[17px] font-regular text-black">
                           {toPersianDigits((product?.price || 3450000).toLocaleString())}
                        </span>
                        <span className="text-[11px] font-light text-black/60">تومان</span>
                     </div>
                     <span className="text-[9px] font-bold text-black/40 uppercase tracking-[0.2em] mt-1">
                        {product?.seller?.name || product?.brand || 'HOMA COLLECTION'}
                     </span>
                  </div>
               </div>
            </div>

            {/* Navigation Links - Clean & Minimal */}
            <div className="flex flex-col border-b border-black/[0.08]">
               <button
                  onClick={() => setShowExitConfirm(true)}
                  className="w-full py-5 flex items-center justify-between group transition-all"
               >
                  <div className="flex items-center gap-4">
                     <ShoppingBag size={16} strokeWidth={1} className="text-black/60 group-hover:text-black transition-colors" />
                     <span className="text-[14px] font-light text-black/80 group-hover:text-black transition-colors tracking-tight">مشاهده محصولات فروشگاه</span>
                  </div>
                  <ArrowRight size={18} className="rotate-180 opacity-20 group-hover:opacity-100 group-hover:-translate-x-1 transition-all text-black" />
               </button>
            </div>

            {/* Technical Details - Structured & Precise */}
            <div className="flex flex-col gap-6">
               <h3 className="text-[13px] font-bold text-black uppercase tracking-[0.3em]">
                  مشخصات فنی
               </h3>

               <div className="flex flex-col">
                  {[
                     { label: 'ابعاد کلی', value: product?.dimensions || '210 x 95 x 85 cm' },
                     { label: 'جنس و متریال', value: product?.material || 'چوب بلوط و کتان' },
                     { label: 'دستورالعمل نگهداری', value: product?.maintenance || 'نظافت تخصصی' },
                     { label: 'مبدا طراحی', value: product?.origin || 'کالکشن هُما ۲۰۲۴' }
                  ].map((detail, idx) => (
                     <div key={idx} className="flex justify-between items-center py-4 border-b border-black/[0.05]">
                        <span className="text-[13px] text-black/40 font-light">{detail.label}</span>
                        <span className="text-[13px] font-regular text-black" dir={detail.label === 'ابعاد کلی' ? 'ltr' : 'rtl'}>{detail.value}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Recommendations - Zara Look Grid */}
            <div id="recommendations-section" className="flex flex-col gap-6 scroll-mt-24">
               <div className="flex justify-between items-end border-b border-black/[0.05] pb-2">
                  <h4 className="text-[14px] font-bold text-black uppercase tracking-[0.2em]">تکمیل چیدمان</h4>
                  <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.1em]">{toPersianDigits(PRODUCT_CENTRIC_RECOMMENDATIONS.length)} مورد</span>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {PRODUCT_CENTRIC_RECOMMENDATIONS.slice(0, 2).map((item) => (
                     <div
                        key={item.id}
                        className="flex flex-col gap-4 group cursor-pointer"
                     >
                        <div className="relative aspect-[3/4] bg-black/[0.02] overflow-hidden">
                           <ImageWithFallback
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover grayscale-[0.1] transition-transform duration-1000 group-hover:scale-105"
                           />
                        </div>
                        <div className="flex flex-col gap-1">
                           <h5 className="text-[11px] font-bold text-black uppercase tracking-[0.05em] leading-tight truncate">
                              {item.name}
                           </h5>
                           <p className="text-[12px] font-regular text-black">
                              {toPersianDigits(item.price.toLocaleString())} <span className="text-[10px] font-light opacity-60">تومان</span>
                           </p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* HOMA STUDIO Banner - Refined Editorial Style */}
            <div
               className="relative h-[420px] bg-[#CCFF00] text-[#FF4500] overflow-hidden cursor-pointer group select-none"
               onClick={() => navigate('/studio/upload')}
            >
               {/* Background Large Text (Minimalist Branding) */}
               <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                  <span className="text-[340px] font-black leading-none" style={{ fontFamily: 'var(--font-family-sf-pro)' }}>STUDIO</span>
               </div>

               {/* Content Layer */}
               <div className="relative h-full z-10 flex flex-col justify-between p-10 font-vazirmatn">

                  {/* Header: Identity */}
                  <div className="flex justify-between items-start">
                     <div className="flex flex-col gap-1">
                        <span className="text-[34px] font-black leading-none tracking-tighter" style={{ fontFamily: 'var(--font-family-sf-pro)' }}>HOMA</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">جریانِ طراحیِ هوشمند</span>
                     </div>
                     <div className="flex flex-col items-end leading-none">
                        <span className="text-[18px] font-black" style={{ fontFamily: 'var(--font-family-sf-pro)' }}>V.4.0</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">AI ENGINE</span>
                     </div>
                  </div>

                  {/* Central Message: Purpose Focus */}
                  <div className="flex flex-col gap-2 max-w-[480px]">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-[2px] bg-[#FF4500]" />
                        <span className="text-[12px] font-bold uppercase tracking-[0.4em]">EXPERIENCE</span>
                     </div>
                     <h4 className="text-[54px] font-black leading-[1.1] tracking-tight">
                        استودیو <br /> طراحی هُما
                     </h4>
                     <p className="text-[16px] font-medium leading-relaxed max-w-[320px] opacity-90 mt-2">
                        فضایِ خود را با قدرتِ هوشِ مصنوعی و دقتِ استودیویی بازطراحی کنید.
                     </p>
                  </div>

                  {/* Footer: Action & Technical Meta */}
                  <div className="flex justify-between items-end border-t border-[#FF4500]/20 pt-8">
                     <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                           <span className="text-[22px] font-black tracking-tighter" style={{ fontFamily: 'var(--font-family-sf-pro)' }}>EST. 2024</span>
                           <div className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">TRANSFORM YOUR SPACE</span>
                     </div>

                     <div className="flex items-center gap-6 group/cta">
                        <div className="flex flex-col items-end">
                           <span className="text-[15px] font-black uppercase tracking-wider group-hover/cta:translate-x-1 transition-transform">شروعِ تجربه</span>
                           <span className="text-[10px] font-bold opacity-60 uppercase">Start Now</span>
                        </div>
                        <div className="w-16 h-16 bg-[#FF4500] text-[#CCFF00] flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:rotate-12">
                           <ArrowRight size={32} className="rotate-180" strokeWidth={2.5} />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="text-center opacity-20 pt-8 pb-4">
               <p className="text-[9px] font-bold uppercase tracking-[0.6em] text-black">انتخاب بدون محدودیت توسط هُما</p>
            </div>
         </div>
      );
   };

   return (
      <div className="h-screen w-full bg-background relative overflow-hidden flex flex-col font-vazirmatn select-none" dir="rtl">
         {/* 1. Mobile-only Global Header */}
         {!isFullScreen && (
            <div className="md:hidden">
               <Header />
            </div>
         )}

         {/* 10. GLOBAL SIDEBAR MENU */}
         <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

         <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            {/* 2. Right Panel (Sidebar) - Desktop Only */}
            <div className={`hidden md:flex flex-col w-[450px] h-full bg-card z-50 overflow-y-auto border-l border-border relative scrollbar-hide`}>
               {/* Desktop Sidebar Integrated Header */}
               <div className="p-8 pt-10 flex flex-col gap-10">
                  <div className="flex items-center justify-between">
                     <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-2 -mr-2 text-foreground/60 hover:text-foreground transition-colors"
                        aria-label="منو"
                     >
                        <Menu size={24} strokeWidth={1.5} />
                     </button>
                     <Link to="/" className="flex items-center">
                        <span
                           className="text-[26px] font-medium tracking-[0.12em] uppercase leading-none text-foreground"
                           style={{ fontFamily: 'var(--font-family-sf-pro)' }}
                        >
                           HOMA
                        </span>
                     </Link>
                     <div className="w-10" /> {/* Spacer for symmetry */}
                  </div>

                  {/* Removed redundant product header block */}
               </div>

               <ProductContent
                  product={product}
                  toPersianDigits={toPersianDigits}
                  setShowExitConfirm={setShowExitConfirm}
                  navigate={navigate}
                  isDesktop={true}
               />
            </div>

            {/* 3. Left Hero (Image Area) - Desktop Only */}
            <div className="hidden md:block flex-1 h-full bg-secondary relative overflow-hidden group">
               <ImageWithFallback
                  src={MOCK_RESULT_IMAGE}
                  alt="Try-On Result"
                  className={`w-full h-full object-cover transition-opacity duration-700 ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
               />
               {originalImage && (
                  <img
                     src={originalImage}
                     className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${showOriginal ? 'opacity-100' : 'opacity-0'}`}
                     alt="Original"
                  />
               )}

               {/* Desktop Gallery Controls Overlay */}
               <div className="absolute inset-0 pointer-events-none">
                  {/* Top Controls: Back, Like, Save (Download) */}
                  <div className="absolute top-8 left-0 right-0 px-8 flex justify-between items-start pointer-events-auto">
                     {/* Top Left: Back */}
                     <button
                        onClick={handleExitRequest}
                        className="w-12 h-12 rounded-full bg-black/10 backdrop-blur-xl border border-white/20 text-white hover:bg-black/20 flex items-center justify-center transition-all active:scale-90 shadow-lg"
                        aria-label="بازگشت"
                     >
                        <ArrowRight size={24} className="rotate-0" />
                     </button>

                     {/* Top Right: Actions */}
                     <div className="flex gap-3">
                        <button
                           onClick={() => setIsSaved(!isSaved)}
                           className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center border transition-all active:scale-90 ${isSaved ? 'bg-white border-white text-accent shadow-lg' : 'bg-black/10 border-white/20 text-white hover:bg-black/20'}`}
                        >
                           <Heart size={20} className={isSaved ? 'fill-current' : ''} />
                        </button>
                        <button
                           onClick={() => handleDownload('after')}
                           className="w-12 h-12 rounded-full bg-black/10 backdrop-blur-xl border border-white/20 text-white hover:bg-black/20 flex items-center justify-center transition-all active:scale-90"
                        >
                           <Download size={20} />
                        </button>
                     </div>
                  </div>

                  {/* Bottom Controls: Expand Toggle */}
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto">
                     <button
                        onClick={() => setIsFullScreen(true)}
                        className="flex items-center gap-3 px-8 h-[56px] bg-black/40 hover:bg-black/60 backdrop-blur-2xl rounded-full border border-white/20 text-white shadow-2xl transition-all active:scale-95 group/btn"
                     >
                        <Maximize2 size={18} className="transition-transform group-hover/btn:scale-110" />
                        <span className="text-[13px] font-bold tracking-wide">مشاهده تمام صفحه</span>
                     </button>
                  </div>
               </div>
            </div>

            {/* 4. MOBILE LAYOUT (Unified Scroll) */}
            <div className="md:hidden absolute inset-0 bg-background flex flex-col z-0">
               {/* Scrollable Container */}
               <div className={`flex-1 overflow-y-auto overflow-x-hidden pb-24 scrollbar-hide`}>
                  {/* Image Section */}
                  <div
                     className={`relative w-full h-[65vh] z-0`}
                  >
                     <ImageWithFallback
                        src={MOCK_RESULT_IMAGE}
                        alt="Try-On Result"
                        className={`w-full h-full object-cover transition-opacity duration-500 ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
                     />

                     {/* Full Screen Trigger Overlay (Invisible button over image) */}
                     <button
                        className="absolute inset-0 z-[10]"
                        onClick={() => setIsFullScreen(true)}
                     />

                     {/* Top Gallery Controls */}
                     <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-center z-[20]">
                        {/* Top Left: Back */}
                        <button
                           onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleExitRequest();
                           }}
                           className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform pointer-events-auto"
                           aria-label="بازگشت"
                        >
                           <ArrowRight size={20} className="rotate-0" />
                        </button>

                        {/* Top Right: Like + Save (Download) */}
                        <div className="flex gap-2">
                           <button
                              onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }}
                              className={`w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center border border-white/10 transition-all active:scale-90 ${isSaved ? 'text-accent bg-white' : 'text-white'}`}
                           >
                              <Heart size={18} className={isSaved ? 'fill-current' : ''} />
                           </button>
                           <button
                              onClick={(e) => { e.stopPropagation(); handleDownload('after'); }}
                              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90"
                           >
                              <Download size={18} />
                           </button>
                        </div>
                     </div>

                     {/* Bottom: View Full Screen Toggle */}
                     <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[20]">
                        <button
                           onClick={(e) => {
                              e.stopPropagation();
                              setIsFullScreen(true);
                           }}
                           className="flex items-center gap-2 px-6 h-[40px] bg-black/40 backdrop-blur-2xl rounded-full border border-white/10 text-white shadow-lg active:scale-95 transition-all pointer-events-auto"
                        >
                           <Maximize2 size={14} />
                           <span className="text-[11px] font-bold">تمام صفحه</span>
                        </button>
                     </div>
                  </div>

                  {/* Connected Card Content */}
                  <div className="relative -mt-6 bg-card rounded-t-[32px] pt-8 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] z-30 min-h-[500px]">
                     <ProductContent
                        product={product}
                        toPersianDigits={toPersianDigits}
                        setShowExitConfirm={setShowExitConfirm}
                        navigate={navigate}
                        isDesktop={false}
                     />
                  </div>
               </div>

               {/* Sticky Bottom Bar - Zara Editorial Style */}
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#FDFDFB]/95 backdrop-blur-md border-t border-black/5 z-[100] flex gap-2">
                  <button
                     onClick={() => {
                        const section = document.getElementById('recommendations-section');
                        if (section) {
                           section.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start'
                           });
                        }
                     }}
                     className="flex-1 h-14 bg-black text-white text-[15px] font-bold uppercase tracking-[0.1em] transition-all active:scale-[0.98]"
                  >
                     تکمیل چیدمان
                  </button>
                  <div className="flex border border-black/10">
                     <button
                        onClick={() => setIsSaved(!isSaved)}
                        className="w-14 h-14 flex items-center justify-center border-l border-black/10 bg-white hover:bg-black/[0.02] transition-colors"
                     >
                        <Heart size={18} strokeWidth={1.2} className={isSaved ? 'fill-black' : ''} />
                     </button>
                     <button
                        onClick={() => copyToClipboard(window.location.href)}
                        className="w-14 h-14 flex items-center justify-center bg-white hover:bg-black/[0.02] transition-colors"
                     >
                        <Share2 size={18} strokeWidth={1.2} />
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* 5. FULL SCREEN OVERLAY - Shared Logic */}
         <AnimatePresence>
            {isFullScreen && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 md:p-12"
               >
                  {/* Close Button */}
                  <button
                     onClick={() => setIsFullScreen(false)}
                     className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-[1100]"
                  >
                     <X size={24} />
                  </button>

                  {/* Full Screen Image Container (Maintains Aspect Ratio) */}
                  <div className="relative max-w-full max-h-[80vh] aspect-[4/5] overflow-hidden rounded-[20px] shadow-2xl border border-white/10">
                     <ImageWithFallback
                        src={MOCK_RESULT_IMAGE}
                        alt="Try-On Result"
                        className={`w-full h-full object-contain transition-opacity duration-500 ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
                     />
                     {originalImage && (
                        <img
                           src={originalImage}
                           alt="Original"
                           className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${showOriginal ? 'opacity-100' : 'opacity-0'}`}
                        />
                     )}
                  </div>

                  {/* Before/After Toggle - Only in Full Screen */}
                  <div className="mt-12">
                     <div className="flex items-center p-[4px] bg-white/10 backdrop-blur-3xl rounded-full border border-white/20 shadow-2xl">
                        <button
                           onClick={() => setShowOriginal(false)}
                           className={`px-10 h-[48px] rounded-full text-[14px] font-bold transition-all ${!showOriginal ? 'bg-white text-black shadow-xl' : 'text-white/70 hover:text-white'}`}
                        >
                           بُعد
                        </button>
                        <button
                           onClick={() => setShowOriginal(true)}
                           className={`px-10 h-[48px] rounded-full text-[14px] font-bold transition-all ${showOriginal ? 'bg-white text-black shadow-xl' : 'text-white/70 hover:text-white'}`}
                        >
                           قبل
                        </button>
                     </div>
                  </div>

                  {/* Quick Info Overlay (Bottom Left) */}
                  <div className="absolute bottom-12 left-12 hidden md:flex flex-col gap-1 text-white/40">
                     <span className="text-[10px] font-bold uppercase tracking-widest">پیش‌نمایش لحظه‌ای هُما</span>
                     <span className="text-[10px]">موتور رندر نسخه ۴.۰</span>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* 7. AUTO-SAVE GLASS NOTICE */}
         <AnimatePresence>
            {showAutoSaveNotice && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/10 backdrop-blur-sm"
               >
                  <motion.div
                     initial={{ scale: 0.9, opacity: 0, y: 20 }}
                     animate={{ scale: 1, opacity: 1, y: 0 }}
                     exit={{ scale: 1.05, opacity: 0 }}
                     className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[32px] p-8 max-w-[340px] w-full shadow-[0_24px_80px_rgba(0,0,0,0.15)] flex flex-col items-center text-center gap-6"
                  >
                     <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-full flex items-center justify-center shadow-inner">
                        <motion.div
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           transition={{ type: "spring", delay: 0.2 }}
                        >
                           <CheckCircle2 size={32} className="text-foreground" />
                        </motion.div>
                     </div>

                     <div className="flex flex-col gap-2">
                        <h3 className="text-[18px] font-bold text-foreground">نتیجه ذخیره شد</h3>
                        <p className="text-[14px] text-foreground/70 leading-relaxed font-medium">
                           نتیجه‌ات ذخیره شد. هر وقت خواستی از گالری می‌تونی دوباره ببینیش.
                        </p>
                     </div>

                     <div className="flex items-center gap-2 text-[11px] font-bold text-foreground/40 uppercase tracking-widest mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/20 animate-pulse" />
                        در حال انتقال به فروشگاه
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* 9. EXIT CONFIRMATION (Glass Modal Style) */}
         <AnimatePresence>
            {showExitConfirm && (
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
                        <h3 className="text-[18px] font-bold text-foreground">ذخیره و خروج</h3>
                        <p className="text-[14px] text-foreground/70 leading-relaxed font-medium">
                           طرح شما به صورت خودکار ذخیره شده و به فروشگاه منتقل خواهید شد.
                        </p>
                     </div>

                     <div className="flex flex-col gap-3 w-full">
                        <button
                           onClick={proceedWithExit}
                           className="w-full h-[56px] bg-foreground text-background rounded-full font-bold text-[14px] hover:opacity-90 transition-all active:scale-95 shadow-lg"
                        >
                           تایید و انتقال
                        </button>
                        <button
                           onClick={() => setShowExitConfirm(false)}
                           className="w-full h-[56px] bg-white/20 text-foreground border border-white/20 rounded-full font-bold text-[14px] hover:bg-white/30 transition-all active:scale-95"
                        >
                           انصراف
                        </button>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* 8. AUTH MODAL (Matches Studio Flow exactly) */}
         <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => {
               setIsAuthModalOpen(false);
            }}
            onSuccess={handleAuthSuccess}
         />
      </div>
   );
}