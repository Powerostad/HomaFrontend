import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link, useSearchParams, useParams } from 'react-router-dom';
import {
   ArrowRight,
   Share2,
   Download,
   ShoppingBag,
   Maximize2,
   X,
   Menu,
   Heart,
   CheckCircle2,
   Users,
   Loader2,
   AlertCircle
} from "lucide-react";
import { useAuth, useUpload, useProduct } from '../../context/AppProviders';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { AuthenticatedImage } from '../../components/figma/AuthenticatedImage';
import { Header } from '../../components/Header';
import { prepareDownload, triggerDownload, triggerShare, getDownloadErrorMessage, type PreparedDownload } from '../../utils/downloadUtils';
import { AuthModal } from '../../components/AuthModal';
import { SidebarMenu } from '../../components/SidebarMenu';
import { toast } from "sonner";
import { submitToGallery } from '../../services/socialGalleryService';
import { getResultImageUrl } from '../../services/visualizationService';
import { loadFromStorage, STORAGE_KEYS, type StoredTryOnResult } from '../../utils/storageUtils';
import { getProductById } from '../../utils/productLoader';
import { formatPriceFromRial } from '../../utils/formatters';
import type { User } from '../../context/AuthContext';
import type { Product } from '../../types/product';

// --- Helper to build specifications from product data ---
function buildSpecifications(
   product: Product | null,
   selectedSize: string | null
): Array<{ label: string; value: string }> {
   const specs: Array<{ label: string; value: string }> = [];

   // For rugs: show selected dimension
   const isRug = product?.category === 'rug_and_carpet' ||
      product?.category === 'فرش و قالی' ||
      product?.category?.toLowerCase() === 'rug';

   if (isRug && selectedSize) {
      // Find matching display label for the selected size code
      const sizeIndex = product?.availableSizes?.indexOf(selectedSize) ?? -1;
      const displaySize = sizeIndex >= 0 && product?.availableSizesDisplay?.[sizeIndex]
         ? product.availableSizesDisplay[sizeIndex]
         : selectedSize;
      specs.push({ label: 'ابعاد', value: displaySize });
   }

   // For all products: show extra_details entries
   if (product?.extraDetails) {
      Object.entries(product.extraDetails).forEach(([key, value]) => {
         const displayValue = Array.isArray(value) ? value.join('، ') : value;
         specs.push({ label: key, value: displayValue });
      });
   }

   return specs;
}

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
   const [searchParams] = useSearchParams();
   const { productId } = useParams<{ productId: string }>();
   const { isLoggedIn, login } = useAuth();
   const {
      selectedFile,
      visualizedImageUrl,
      setVisualizedImageUrl,
      resultImageId,
      setResultImageId,
      setResultImagePath,
      selectedSize
   } = useUpload();
   const { product, setProduct } = useProduct();

   // URL params for recovery (productId now comes from URL path)
   const urlResultId = searchParams.get('resultId');
   const urlResultPath = searchParams.get('path');

   // Recovery state
   const [isRecovering, setIsRecovering] = useState(false);
   const [recoveryFailed, setRecoveryFailed] = useState(false);

   /**
    * Recovery effect - restore state from URL params or sessionStorage
    * This enables page reload and bookmarking/sharing of result URLs
    */
   useEffect(() => {
      const recoverState = async () => {
         // Skip if we already have the visualized image
         if (visualizedImageUrl) return;

         setIsRecovering(true);

         // Try to recover from URL params first, then sessionStorage
         let recoveredPath = urlResultPath ? decodeURIComponent(urlResultPath) : null;
         let recoveredId = urlResultId ? parseInt(urlResultId, 10) : null;

         // If no URL params, try sessionStorage
         if (!recoveredPath || !recoveredId) {
            const storedResult = loadFromStorage<StoredTryOnResult>(STORAGE_KEYS.TRYON_RESULT);
            if (storedResult) {
               recoveredPath = recoveredPath || storedResult.path;
               recoveredId = recoveredId || storedResult.id;
            }
         }

         // If we found recovery data, restore state
         if (recoveredPath) {
            const recoveredUrl = getResultImageUrl(recoveredPath);
            setVisualizedImageUrl(recoveredUrl);
            if (recoveredId) setResultImageId(recoveredId);
            if (recoveredPath) setResultImagePath(recoveredPath);
            console.log('[TryOnResult] Recovered from:', urlResultPath ? 'URL' : 'storage', { path: recoveredPath, id: recoveredId });
         } else {
            // No recovery possible
            setRecoveryFailed(true);
            console.warn('[TryOnResult] No recovery data found');
         }

         setIsRecovering(false);
      };

      recoverState();
   }, [visualizedImageUrl, urlResultPath, urlResultId, setVisualizedImageUrl, setResultImageId, setResultImagePath]);

   /**
    * Product recovery - restore product from URL path param
    * productId is now always in URL: /try-on/:productId/result
    */
   useEffect(() => {
      const recoverProduct = async () => {
         // Skip if we already have the product
         if (product) return;

         // productId comes from URL path (always available)
         if (productId) {
            console.log('[TryOnResult] Recovering product from URL path:', productId);
            try {
               const loadedProduct = await getProductById(productId);
               if (loadedProduct) {
                  setProduct(loadedProduct as Product);
               }
            } catch (error) {
               console.error('[TryOnResult] Failed to recover product:', error);
            }
         }
      };

      recoverProduct();
   }, [product, productId, setProduct]);

   // Use API result - no fallback, real data only
   const resultImageUrl = visualizedImageUrl;

   const [originalImage, setOriginalImage] = useState<string | null>(null);
   const [showOriginal, setShowOriginal] = useState(false);
   const [isSaved, setIsSaved] = useState(false);
   const [isFullScreen, setIsFullScreen] = useState(false);
   const [_showDownloadMenu, setShowDownloadMenu] = useState(false);
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [showExitConfirm, setShowExitConfirm] = useState(false);
   const [showAutoSaveNotice, setShowAutoSaveNotice] = useState(false);
   const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // Changed: Default to false
   const [pendingRedirect, setPendingRedirect] = useState(false);
   const [isSubmittingToGallery, setIsSubmittingToGallery] = useState(false);
   const [isSubmittedToGallery, setIsSubmittedToGallery] = useState(false);
   const [isDownloading, setIsDownloading] = useState(false);
   const [preparedDownloadData, setPreparedDownloadData] = useState<PreparedDownload | null>(null);
   const [showDownloadReady, setShowDownloadReady] = useState(false);

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

   const handleAuthSuccess = (
      userData: User,
      tokens: { access: string; refresh: string }
   ) => {
      login(userData, tokens);
      setIsAuthModalOpen(false);

      if (pendingRedirect) {
         setPendingRedirect(false);
         proceedWithExit();
      }
   };

   // Future use: const confirmExit = () => { setShowExitConfirm(false); handleStoreNavigation(); };
   // Future use: const handleStoreNavigation = () => { setShowExitConfirm(true); };

   const executeStoreNavigation = () => {
      // Try shopSlug from API product first, then seller.slug
      const shopSlug = product?.shopSlug || product?.seller?.slug;
      if (shopSlug) {
         navigate(`/store/${shopSlug}`);
      } else {
         // Fallback to explore if no shop slug available
         navigate('/explore');
      }
   };

   // --- Download Logic (two-phase for Chrome compatibility) ---
   // Phase 1: Prepare download (async, no user gesture needed)
   const handleDownload = async () => {
      if (!resultImageUrl) {
         toast.error('تصویری برای دانلود موجود نیست');
         return;
      }

      setIsDownloading(true);

      const result = await prepareDownload({
         imageUrl: resultImageUrl,
         filename: `homa-tryon-${Date.now()}`,
         useAuth: true,
      });

      setIsDownloading(false);

      if (result.success) {
         setPreparedDownloadData(result.data);
         setShowDownloadReady(true);
      } else {
         toast.error(getDownloadErrorMessage(result.error));
      }

      setShowDownloadMenu(false);
   };

   // Phase 2: Trigger download with fresh user gesture
   const handleConfirmDownload = async () => {
      if (!preparedDownloadData) return;

      // Try share first on mobile
      const shared = await triggerShare(preparedDownloadData);
      if (shared) {
         toast.success('تصویر آماده اشتراک‌گذاری شد');
      } else {
         // Fallback to download
         triggerDownload(preparedDownloadData);
         toast.success('تصویر دانلود شد');
      }

      setPreparedDownloadData(null);
      setShowDownloadReady(false);
   };

   // Cancel download
   const handleCancelDownload = () => {
      if (preparedDownloadData) {
         preparedDownloadData.cleanup();
      }
      setPreparedDownloadData(null);
      setShowDownloadReady(false);
   };

   // --- Gallery Submission ---
   const handleSubmitToGallery = async () => {
      // Require login to submit
      if (!isLoggedIn) {
         setIsAuthModalOpen(true);
         return;
      }

      // Need image_id to submit
      if (!resultImageId) {
         toast.error('تصویری برای ارسال به گالری موجود نیست');
         return;
      }

      setIsSubmittingToGallery(true);
      const result = await submitToGallery({ image_id: resultImageId });
      setIsSubmittingToGallery(false);

      if (result.success) {
         setIsSubmittedToGallery(true);
         toast.success('تصویر شما برای نمایش در گالری ارسال شد');
      } else {
         toast.error(result.error || 'خطا در ارسال به گالری');
      }
   };

   // --- Add to Cart Logic ---
   // Future use: const handleAddToCart = () => { toast.success('به سبد خرید اضافه شد'); };

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
      setShowExitConfirm: React.Dispatch<React.SetStateAction<boolean>>;
      navigate: ReturnType<typeof useNavigate>;
      isDesktop: boolean;
      selectedSize: string | null;
   }

   const ProductContent = ({
      product,
      setShowExitConfirm,
      navigate,
      isDesktop,
      selectedSize
   }: ProductContentProps) => {
      // Build specifications from real data
      const specifications = buildSpecifications(product, selectedSize);
      return (
         <div className={`flex flex-col gap-12 ${isDesktop ? 'px-12' : 'px-8'} pb-[96px] bg-[#FDFDFB]`}>
            {/* Product Header Section - Editorial Style */}
            {product && (
               <div className="flex flex-col gap-6 pb-8 border-b border-black/[0.08]">
                  <span className="text-[15px] font-bold uppercase tracking-[0.3em] text-black/40 text-[rgba(7,7,7,0.73)]">محصول تست شده</span>
                  <div className="flex gap-6 items-start">
                     <div className="relative w-[100px] h-[100px] overflow-hidden flex-shrink-0 border border-black/[0.05] bg-black/[0.02]">
                        <ImageWithFallback
                           src={product.images?.[0]}
                           alt={product.name}
                           className="w-full h-full object-cover grayscale-[0.2]"
                        />
                     </div>
                     <div className="flex-1 flex flex-col gap-2">
                        <h1 className="text-[20px] font-light text-black leading-tight tracking-tight">{product.name}</h1>
                        {product.price && (
                           <div className="flex items-baseline gap-1.5">
                              <span className="text-[17px] font-regular text-black">
                                 {formatPriceFromRial(product.price, false)}
                              </span>
                              <span className="text-[11px] font-light text-black/60">تومان</span>
                           </div>
                        )}
                        {(product.seller?.name || product.brand) && (
                           <span className="text-[9px] font-bold text-black/40 uppercase tracking-[0.2em] mt-1">
                              {product.seller?.name || product.brand}
                           </span>
                        )}
                     </div>
                  </div>
               </div>
            )}

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
                  {specifications.length > 0 ? (
                     specifications.map((detail, idx) => (
                        <div key={idx} className="flex justify-between items-center py-4 border-b border-black/[0.05]">
                           <span className="text-[13px] text-black/40 font-light">{detail.label}</span>
                           <span className="text-[13px] font-regular text-black" dir={detail.label === 'ابعاد' ? 'ltr' : 'rtl'}>{detail.value}</span>
                        </div>
                     ))
                  ) : (
                     <div className="py-4 text-center">
                        <span className="text-[13px] text-black/40 font-light">مشخصات موجود نیست</span>
                     </div>
                  )}
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

   // Recovery loading state
   if (isRecovering) {
      return (
         <div className="h-screen w-full bg-background flex flex-col items-center justify-center font-vazirmatn" dir="rtl">
            <Header />
            <div className="flex flex-col items-center gap-4">
               <Loader2 size={40} className="animate-spin text-black/30" />
               <p className="text-[14px] text-black/50">در حال بازیابی نتیجه...</p>
            </div>
         </div>
      );
   }

   // Recovery failed state - no result data found
   if (recoveryFailed && !resultImageUrl) {
      return (
         <div className="h-screen w-full bg-background flex flex-col font-vazirmatn" dir="rtl">
            <Header />
            <div className="flex-1 flex flex-col items-center justify-center px-6">
               <div className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center mb-6">
                  <AlertCircle size={40} className="text-black/30" />
               </div>
               <h1 className="text-[24px] font-bold text-black mb-3 text-center">
                  نتیجه یافت نشد
               </h1>
               <p className="text-[14px] text-black/50 mb-8 text-center max-w-[300px] leading-relaxed">
                  امکان بازیابی نتیجه وجود ندارد. ممکن است نتیجه در گالری شما ذخیره شده باشد.
               </p>
               <div className="flex flex-col gap-3 w-full max-w-[280px]">
                  {isLoggedIn && (
                     <button
                        onClick={() => navigate('/account/gallery')}
                        className="h-14 bg-black text-white text-[14px] font-bold uppercase tracking-[0.1em] hover:bg-black/90 transition-all flex items-center justify-center"
                     >
                        مشاهده گالری
                     </button>
                  )}
                  <button
                     onClick={() => navigate(`/try-on/${productId}/upload`)}
                     className="h-14 bg-white border border-black/10 text-black text-[14px] font-medium hover:bg-black/[0.02] transition-all"
                  >
                     امتحان دوباره
                  </button>
               </div>
            </div>
         </div>
      );
   }

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
                  setShowExitConfirm={setShowExitConfirm}
                  navigate={navigate}
                  isDesktop={true}
                  selectedSize={selectedSize}
               />
            </div>

            {/* 3. Left Hero (Image Area) - Desktop Only */}
            <div className="hidden md:block flex-1 h-full bg-secondary relative overflow-hidden group">
               {/* Show result image only when available */}
               {resultImageUrl ? (
                  <AuthenticatedImage
                     src={resultImageUrl}
                     alt="Try-On Result"
                     className={`w-full h-full object-cover transition-opacity duration-700 ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
                  />
               ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/5">
                     <span className="text-black/30 text-sm">تصویر نتیجه موجود نیست</span>
                  </div>
               )}
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
                           onClick={handleSubmitToGallery}
                           disabled={isSubmittingToGallery || isSubmittedToGallery}
                           className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center border transition-all active:scale-90 ${isSubmittedToGallery ? 'bg-white border-white text-green-600 shadow-lg' : 'bg-black/10 border-white/20 text-white hover:bg-black/20'} ${isSubmittingToGallery ? 'opacity-50 cursor-not-allowed' : ''}`}
                           title="اشتراک در گالری عمومی"
                        >
                           {isSubmittingToGallery ? <Loader2 size={20} className="animate-spin" /> : isSubmittedToGallery ? <CheckCircle2 size={20} /> : <Users size={20} />}
                        </button>
                        <button
                           onClick={() => setIsSaved(!isSaved)}
                           className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center border transition-all active:scale-90 ${isSaved ? 'bg-white border-white text-accent shadow-lg' : 'bg-black/10 border-white/20 text-white hover:bg-black/20'}`}
                        >
                           <Heart size={20} className={isSaved ? 'fill-current' : ''} />
                        </button>
                        <button
                           onClick={() => handleDownload()}
                           disabled={isDownloading}
                           className={`w-12 h-12 rounded-full bg-black/10 backdrop-blur-xl border border-white/20 text-white hover:bg-black/20 flex items-center justify-center transition-all active:scale-90 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                           {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
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
                     {/* Show result image only when available */}
                     {resultImageUrl ? (
                        <AuthenticatedImage
                           src={resultImageUrl}
                           alt="Try-On Result"
                           className={`w-full h-full object-cover transition-opacity duration-500 ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
                        />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black/5">
                           <span className="text-black/30 text-sm">تصویر نتیجه موجود نیست</span>
                        </div>
                     )}

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

                        {/* Top Right: Like + Save (Download) + Gallery */}
                        <div className="flex gap-2">
                           <button
                              onClick={(e) => { e.stopPropagation(); handleSubmitToGallery(); }}
                              disabled={isSubmittingToGallery || isSubmittedToGallery}
                              className={`w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center border border-white/10 transition-all active:scale-90 ${isSubmittedToGallery ? 'text-green-600 bg-white' : 'text-white bg-black/20'} ${isSubmittingToGallery ? 'opacity-50' : ''}`}
                           >
                              {isSubmittingToGallery ? <Loader2 size={16} className="animate-spin" /> : isSubmittedToGallery ? <CheckCircle2 size={16} /> : <Users size={16} />}
                           </button>
                           <button
                              onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }}
                              className={`w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center border border-white/10 transition-all active:scale-90 ${isSaved ? 'text-accent bg-white' : 'text-white'}`}
                           >
                              <Heart size={18} className={isSaved ? 'fill-current' : ''} />
                           </button>
                           <button
                              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                              disabled={isDownloading}
                              className={`w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90 ${isDownloading ? 'opacity-50' : ''}`}
                           >
                              {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
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
                        setShowExitConfirm={setShowExitConfirm}
                        navigate={navigate}
                        isDesktop={false}
                        selectedSize={selectedSize}
                     />
                  </div>
               </div>

               {/* Sticky Bottom Bar - Zara Editorial Style */}
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#FDFDFB]/95 backdrop-blur-md border-t border-black/5 z-[100] flex gap-2">
                  <div className="flex-1 flex border border-black/10">
                     <button
                        onClick={handleSubmitToGallery}
                        disabled={isSubmittingToGallery || isSubmittedToGallery}
                        className={`w-14 h-14 flex items-center justify-center border-l border-black/10 transition-colors ${isSubmittedToGallery ? 'bg-green-50 text-green-600' : 'bg-white hover:bg-black/[0.02]'} ${isSubmittingToGallery ? 'opacity-50' : ''}`}
                     >
                        {isSubmittingToGallery ? <Loader2 size={18} strokeWidth={1.2} className="animate-spin" /> : isSubmittedToGallery ? <CheckCircle2 size={18} strokeWidth={1.2} /> : <Users size={18} strokeWidth={1.2} />}
                     </button>
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
                     {/* Show result image only when available */}
                     {resultImageUrl ? (
                        <AuthenticatedImage
                           src={resultImageUrl}
                           alt="Try-On Result"
                           className={`w-full h-full object-contain transition-opacity duration-500 ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
                        />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                           <span className="text-white/30 text-sm">تصویر نتیجه موجود نیست</span>
                        </div>
                     )}
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

         {/* 8. DOWNLOAD READY MODAL */}
         <AnimatePresence>
            {showDownloadReady && (
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
                     className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[32px] p-8 max-w-[340px] w-full shadow-[0_24px_80px_rgba(0,0,0,0.15)] flex flex-col items-center text-center gap-6"
                  >
                     <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-full flex items-center justify-center shadow-inner">
                        <Download size={28} className="text-foreground" />
                     </div>

                     <div className="flex flex-col gap-2">
                        <h3 className="text-[18px] font-bold text-foreground">تصویر آماده است</h3>
                        <p className="text-[14px] text-foreground/70 leading-relaxed font-medium">
                           برای ذخیره تصویر روی دکمه زیر کلیک کنید
                        </p>
                     </div>

                     <div className="flex flex-col gap-3 w-full">
                        <button
                           onClick={handleConfirmDownload}
                           className="w-full h-[56px] bg-foreground text-background rounded-full font-bold text-[14px] hover:opacity-90 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                        >
                           <Download size={18} />
                           ذخیره تصویر
                        </button>
                        <button
                           onClick={handleCancelDownload}
                           className="w-full h-[56px] bg-white/20 text-foreground border border-white/20 rounded-full font-bold text-[14px] hover:bg-white/30 transition-all active:scale-95"
                        >
                           انصراف
                        </button>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* 9. AUTH MODAL (Matches Studio Flow exactly) */}
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