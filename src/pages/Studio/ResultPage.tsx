import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  ArrowRight,
  Share2,
  Download,
  Heart,
  Bookmark,
  Maximize2,
  Loader2,
  // Search, - Google Lens feature disabled
  // Users, CheckCircle2 - TODO: Uncomment when gallery submission is enabled
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useStudio } from '../../context/StudioContext';
import { AuthenticatedImage } from '../../components/figma/AuthenticatedImage';
import { Header } from '../../components/Header';
import { ContextBar } from '../../components/ContextBar';
import { ProductDetailSheet, Product } from './components/ProductDetailSheet';
import { AuthModal } from '../../components/AuthModal';
import { HomaLoader } from '../../components/HomaLoader';
// Google Lens search disabled - import removed
// import { ImageSearchMode } from '@/components/studio/ImageSearchMode';
import { toast } from 'sonner';
// import { submitToGallery } from '@/services/socialGalleryService'; // TODO: Uncomment when gallery submission is enabled
import { prepareDownload, triggerDownload, triggerShare, getDownloadErrorMessage, type PreparedDownload } from '@/utils/downloadUtils';
import { formatPriceFromRial, formatPriceStartingFrom, toLocalizedDigits } from '@/utils/formatters';
import { apiPost, apiConfig } from '@/utils/apiClient';
import type { MatchedProduct } from '@/services/studioService';
import { InlineFeedbackWidget } from '@/components/InlineFeedbackWidget';
import {
  trackStudioResultViewed,
  trackStudioResultAction,
  trackStudioProductClicked,
} from '@/analytics/events';

// --- Category Group type for grouped product display ---
interface CategoryGroup {
  category: string;
  categoryDisplay: string;
  itemId: number;
  fitReasoningFa: string;
  recommendedSize: string;
  quantity: number;
  placement: string;
  products: (Product & { store?: string; matchScore?: number })[];
}

// --- Fallback Mock Data (only used when API data not available) ---
const FALLBACK_RESULT_IMAGE = "https://images.unsplash.com/photo-1597665863042-47e00964d899?q=80&w=1200&auto=format&fit=crop";

/**
 * Convert API matched product to UI Product format
 */
function matchedProductToUIProduct(product: MatchedProduct, index: number): Product & { store?: string; style?: string; isPromoted?: boolean; matchScore?: number } {
  return {
    id: String(product.id),
    name: product.name,
    price: product.price,
    category: product.categoryDisplay || product.category || 'محصول',
    store: product.shopName || 'فروشگاه هوما',
    image: product.imageUrl,
    hotspot: { x: 50, y: 50 + index * 10 }, // Default hotspots
    isPromoted: product.isPromoted,
    // Smart Redesign: Pass through new fields for ProductDetailSheet
    persianReason: product.persianReason,
    matchHighlights: product.matchHighlights,
    description: product.description,
    extraDetails: product.extraDetails,
    link: product.link,
    uniqueLink: product.uniqueLink,
    availableSizes: product.availableSizes,
    availableSizesDisplay: product.availableSizesDisplay,
    sizePrices: product.sizePrices,
    sizePricesDisplay: product.sizePricesDisplay,
    priceRange: product.priceRange,
    matchScore: product.matchScore,
  };
}

export function StudioResultPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Note: Route param is named "jobId" in App.tsx, but we use "sessionId" internally
  const { jobId: sessionId } = useParams<{ jobId: string }>();
  const { selectedFile } = useApp() as any;
  const { isLoggedIn, isInitialized, login } = useAuth();
  const {
    activeSession,
    activeSessionId,
    loadSession,
    clearActiveSession
  } = useStudio();

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  // Initialize as false - will be set by useEffect after auth initialization
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showExitDecision, setShowExitDecision] = useState(false);
  const [_isMenuOpen, _setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // TODO: Uncomment when gallery submission is enabled
  // const [isSubmittingToGallery, setIsSubmittingToGallery] = useState(false);
  // const [isSubmittedToGallery, setIsSubmittedToGallery] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [topPickUrls, setTopPickUrls] = useState<Record<string, string>>({});
  const [preparedDownloadData, setPreparedDownloadData] = useState<PreparedDownload | null>(null);
  const [showDownloadReady, setShowDownloadReady] = useState(false);
  // Google Lens search disabled
  // const [isSearchMode, setIsSearchMode] = useState(false);
  // const imageRef = useRef<HTMLImageElement>(null);
  // const imageContainerRef = useRef<HTMLDivElement>(null);
  // const mobileImageRef = useRef<HTMLImageElement>(null);
  // const mobileImageContainerRef = useRef<HTMLDivElement>(null);

  // TODO: Enable gallery submission when try-on flow is fixed
  // Check if any item has a completed try-on (required for gallery submission)
  // const hasCompletedTryOn = activeSession?.items?.some(item => item.tryonStatus === 'completed') ?? false;

  // --- Gallery Submission Handler ---
  // const handleSubmitToGallery = async () => {
  //   // Require login
  //   if (!isLoggedIn) {
  //     setIsAuthModalOpen(true);
  //     return;
  //   }
  //
  //   // Need session ID to submit
  //   const currentSessionId = sessionId || activeSessionId;
  //   if (!currentSessionId) {
  //     toast.error('جلسه طراحی برای ارسال به گالری موجود نیست');
  //     return;
  //   }
  //
  //   // Find item with completed try-on
  //   const itemWithTryOn = activeSession?.items?.find(item => item.tryonStatus === 'completed');
  //   if (!itemWithTryOn?.id) {
  //     toast.error('ابتدا باید یک محصول را امتحان کنید');
  //     return;
  //   }
  //
  //   setIsSubmittingToGallery(true);
  //   const result = await submitToGallery({
  //     session_id: currentSessionId,
  //     item_id: itemWithTryOn.id
  //   });
  //   setIsSubmittingToGallery(false);
  //
  //   if (result.success) {
  //     setIsSubmittedToGallery(true);
  //     toast.success('طراحی شما برای نمایش در گالری ارسال شد');
  //   } else {
  //     toast.error(result.error || 'خطا در ارسال به گالری');
  //   }
  // };

  // --- Download Logic (two-phase for Chrome compatibility) ---
  // Phase 1: Prepare download (async, no user gesture needed)
  const handleDownload = async () => {
    const imageUrl = activeSession?.redesignedImageUrl;
    if (!imageUrl) {
      toast.error(t('studio.result.noImageDownload', 'تصویری برای دانلود موجود نیست'));
      return;
    }

    const currentSessionId = sessionId || activeSessionId || '';
    trackStudioResultAction({ action: 'download', session_id: currentSessionId });
    setIsDownloading(true);

    const result = await prepareDownload({
      imageUrl,
      filename: `هما-استودیو-${Date.now()}`,
      useAuth: true,
    });

    setIsDownloading(false);

    if (result.success) {
      setPreparedDownloadData(result.data);
      setShowDownloadReady(true);
    } else {
      toast.error(getDownloadErrorMessage(result.error));
    }
  };

  // Phase 2: Trigger download with fresh user gesture
  const handleConfirmDownload = async () => {
    if (!preparedDownloadData) return;

    // Try share first on mobile
    const shared = await triggerShare(preparedDownloadData);
    if (shared) {
      toast.success(t('studio.result.shareReady', 'تصویر آماده اشتراک‌گذاری شد'));
    } else {
      // Fallback to download
      triggerDownload(preparedDownloadData);
      toast.success(t('studio.result.downloaded', 'تصویر دانلود شد'));
    }

    setPreparedDownloadData(null);
    setShowDownloadReady(false);
  };

  // --- Google Lens Search (disabled) ---
  // const handleStartSearch = () => {
  //   setIsSearchMode(true);
  // };

  // const handleSearchComplete = (_url: string) => {
  //   setIsSearchMode(false);
  // };

  // const handleCancelSearch = () => {
  //   setIsSearchMode(false);
  // };

  // Cancel download
  const handleCancelDownload = () => {
    if (preparedDownloadData) {
      preparedDownloadData.cleanup();
    }
    setPreparedDownloadData(null);
    setShowDownloadReady(false);
  };

  // Determine result image - use API data or fallback
  const resultImage = useMemo(() => {
    if (activeSession?.redesignedImageUrl) {
      return activeSession.redesignedImageUrl;
    }
    return FALLBACK_RESULT_IMAGE;
  }, [activeSession]);

  // Group products by category for display
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    if (!activeSession?.items?.length) return [];
    return activeSession.items
      .filter(item => item.matchedProducts.length > 0)
      .map(item => ({
        category: item.category || item.type,
        categoryDisplay: item.categoryDisplay || item.type,
        itemId: item.id,
        fitReasoningFa: item.fitReasoningFa || '',
        recommendedSize: item.recommendedSize || '',
        quantity: item.quantity ?? 1,
        placement: item.placement || '',
        products: item.matchedProducts.map((p, i) => matchedProductToUIProduct(p, i)),
      }));
  }, [activeSession]);

  // Flat product list for backward compat (fallback data, context bar, etc.)
  const displayProducts = useMemo(() => {
    return categoryGroups.flatMap(g => g.products);
  }, [categoryGroups]);

  // Total price = sum of top picks (first product per category)
  const totalPrice = categoryGroups.reduce(
    (acc, group) => acc + (group.products[0]?.price || 0), 0
  );

  // Alternatives scoped to same category group
  const productAlternatives = useMemo(() => {
    if (!selectedProduct || !categoryGroups.length) return [];
    for (const group of categoryGroups) {
      if (group.products.find(p => p.id === selectedProduct.id)) {
        return group.products.filter(p => p.id !== selectedProduct.id);
      }
    }
    return [];
  }, [selectedProduct, categoryGroups]);

  // Load session data if not already in context
  // IMPORTANT: Wait for auth initialization AND login before making API calls
  useEffect(() => {
    const loadSessionData = async () => {
      // Must wait for auth to initialize first
      if (!isInitialized) {
        return;
      }

      // Must be logged in to fetch session data (API requires auth)
      if (!isLoggedIn) {
        return;
      }

      // If we have a sessionId from URL but no active session (or different session)
      if (sessionId && (!activeSession || activeSessionId !== sessionId)) {
        setIsLoading(true);
        const result = await loadSession(sessionId);
        setIsLoading(false);

        if (!result.success) {
          toast.error(result.error || t('errors.resultFailed', 'خطا در دریافت نتیجه طراحی'));
        }
      }
    };

    loadSessionData();
  }, [sessionId, activeSession, activeSessionId, loadSession, isInitialized, isLoggedIn]);

  // Track result page view once session data is available
  useEffect(() => {
    if (!activeSession || !sessionId) return;
    const currentSessionId = sessionId || activeSessionId;
    if (!currentSessionId) return;

    trackStudioResultViewed({
      session_id: currentSessionId,
      product_count: displayProducts.length,
      category_count: categoryGroups.length,
    });
  }, [activeSession?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only check login state after auth is initialized (prevents flash on refresh)
  useEffect(() => {
    if (!isInitialized) {
      // Still loading auth state from localStorage - wait
      return;
    }

    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      setIsFullScreen(false);
    } else {
      // User is logged in - ensure modal is closed
      setIsAuthModalOpen(false);
    }
  }, [isLoggedIn, isInitialized]);

  useEffect(() => {
    if (selectedFile) {
      // User uploaded file in current session - use data URL
      const reader = new FileReader();
      reader.onload = (e) => setOriginalImage(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else if (activeSession?.roomImageUrl) {
      // Navigated to existing session - use API-provided room image URL
      setOriginalImage(activeSession.roomImageUrl);
    }
  }, [selectedFile, activeSession?.roomImageUrl]);

  // Pre-fetch tracking URLs for top pick products (same pattern as BuyButton)
  useEffect(() => {
    if (categoryGroups.length === 0) return;

    const fetchUrls = async () => {
      const urls: Record<string, string> = {};
      const currentSessionId = activeSessionId || sessionId || '';

      await Promise.all(categoryGroups.map(async (group) => {
        const topPick = group.products[0];
        if (!topPick?.uniqueLink) return;

        try {
          const response = await apiPost<{ click_id: string | null; tracking_url: string | null }>('/tracking/clicks/', {
            product_id: topPick.uniqueLink,
            source_context: 'studio',
            redesign_session_id: currentSessionId || null,
          });

          if (response.success && response.data?.click_id) {
            // Build tracking URL using frontend's API base URL (BACKEND_BASE_URL may be misconfigured)
            urls[topPick.id] = `${apiConfig.baseURL}/tracking/go/${response.data.click_id}/`;
          }
        } catch {
          // Will fall back to product.link in handleFinalize
        }
      }));

      setTopPickUrls(urls);
    };

    fetchUrls();
  }, [categoryGroups, sessionId, activeSessionId]);

  // Open all top pick product pages in new tabs
  const handleFinalize = () => {
    categoryGroups.forEach(group => {
      const topPick = group.products[0];
      if (!topPick) return;
      const url = topPickUrls[topPick.id] || topPick.link;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    });
  };

  // Handle product click — enrich with category-level AI reasoning
  const handleProductClick = (product: Product) => {
    const group = categoryGroups.find(g => g.products.some(p => p.id === product.id));
    const isTopPick = group ? group.products[0]?.id === product.id : false;
    const currentSessionId = sessionId || activeSessionId || '';

    trackStudioProductClicked({
      session_id: currentSessionId,
      product_id: product.id,
      product_name: product.name,
      category: product.category || '',
      is_top_pick: isTopPick,
    });

    setSelectedProduct({
      ...product,
      persianReason: product.persianReason || group?.fitReasoningFa || '',
    });
  };

  // Content shared between mobile/desktop (Zara Home Editorial Style)
  const InsightContent = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <div className={`flex flex-col gap-6 ${isDesktop ? 'px-10' : 'px-8'} pb-10`}>

      {/* 1. Suggested Products - Grouped by Category */}
      <div className="space-y-2 pt-0">
        <div className="flex items-baseline justify-between border-b border-black/[0.05] pb-2">
          <h2 className="text-[20px] font-medium text-black tracking-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
            {t('studio.result.suggestedProducts', 'محصولات پیشنهادی')}
          </h2>
          <span className="text-[10px] text-black/30 font-medium tracking-wide uppercase" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
            {t('studio.result.curated', 'Curated')}
          </span>
        </div>

        <div className="flex flex-col gap-8">
          {categoryGroups.map((group) => {
            const topPick = group.products[0];
            const alternatives = group.products.slice(1);

            return (
              <div key={group.itemId} className="flex flex-col gap-4">
                {/* Category Header */}
                <div className="flex items-center gap-3 pt-4">
                  <span className="text-[16px] font-bold text-black" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                    {group.categoryDisplay}
                  </span>
                  <div className="flex-1 h-px bg-black/[0.06]" />
                </div>

                {/* Item Metadata (quantity, size, placement) */}
                {(group.quantity > 1 || group.recommendedSize || group.placement) && (
                  <div className="flex items-center gap-2 flex-wrap px-1">
                    {group.quantity > 1 && (
                      <span className="text-[10px] font-bold text-black/40 tracking-wide" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                        {t('studio.result.quantity', '{{amount}} عدد', { amount: toLocalizedDigits(group.quantity) })}
                      </span>
                    )}
                    {group.quantity > 1 && (group.recommendedSize || group.placement) && (
                      <span className="w-0.5 h-0.5 rounded-full bg-black/20" />
                    )}
                    {group.recommendedSize && (
                      <span className="text-[10px] font-bold text-black/40 tracking-wide" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                        {t('studio.result.recommendedSize', 'سایز: {{size}}', { size: group.recommendedSize })}
                      </span>
                    )}
                    {group.recommendedSize && group.placement && (
                      <span className="w-0.5 h-0.5 rounded-full bg-black/20" />
                    )}
                    {group.placement && (
                      <span className="text-[10px] font-bold text-black/40 tracking-wide" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                        {t('studio.result.placement', 'جایگاه: {{placement}}', { placement: group.placement })}
                      </span>
                    )}
                  </div>
                )}

                {/* Top Pick - Large Editorial Card */}
                {topPick && (
                  <div className="group flex flex-row gap-5 py-4">
                    {/* Product Frame - Prominent */}
                    <div
                      className="relative w-[170px] aspect-[3/4] bg-black/[0.02] overflow-hidden cursor-pointer shrink-0 transition-all duration-500"
                      onClick={() => handleProductClick(topPick)}
                    >
                      <AuthenticatedImage
                        src={topPick.image}
                        alt={topPick.name}
                        imageWidth={400}
                        imageQuality={80}
                        className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-1.5 py-0.5 flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-accent" />
                        <span className="text-[7px] font-bold text-black uppercase tracking-[0.2em]" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                          {t('studio.result.homaPick', 'انتخاب هُما')}
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1 min-w-0">
                            <h3 className="text-[13px] font-bold text-black uppercase tracking-[0.05em] leading-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                              {topPick.name}
                            </h3>
                            <div className="flex items-center gap-2 opacity-30">
                              <span className="text-[8px] text-black font-bold uppercase tracking-[0.1em]">{topPick.category}</span>
                              <span className="w-0.5 h-0.5 rounded-full bg-black" />
                              <span className="text-[8px] text-black font-bold uppercase tracking-[0.1em]">{topPick.store}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }}
                            className={`transition-all active:scale-90 shrink-0 ${isSaved ? 'text-accent' : 'text-black/10 hover:text-black'}`}
                          >
                            <Bookmark size={16} strokeWidth={1.5} className={isSaved ? 'fill-current' : ''} />
                          </button>
                        </div>

                        <div className="flex items-baseline gap-1.5 mt-2">
                          {topPick.priceRange ? (
                            <span className="text-[15px] font-bold text-black tabular-nums tracking-tighter" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                              {formatPriceStartingFrom(topPick.priceRange.min)}
                            </span>
                          ) : (
                            <>
                              <span className="text-[18px] font-bold text-black tabular-nums tracking-tighter">
                                {formatPriceFromRial(topPick.price, false)}
                              </span>
                              <span className="text-[9px] text-black/40 font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                                {t('common.toman', 'تومان')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleProductClick(topPick)}
                        className="w-full h-10 border border-black/10 text-black text-[9px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-black hover:text-white active:scale-[0.98]"
                        style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                      >
                        {t('studio.result.productDetails', 'جزییات محصول')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Alternative Products - Compact Thumbnails */}
                {alternatives.length > 0 && (
                  <div className="flex gap-3">
                    {alternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className="w-[100px] shrink-0 cursor-pointer group/alt"
                        onClick={() => handleProductClick(alt)}
                      >
                        <div className="relative aspect-[3/4] bg-black/[0.02] overflow-hidden mb-1.5">
                          <AuthenticatedImage
                            src={alt.image}
                            alt={alt.name}
                            imageWidth={200}
                            imageQuality={75}
                            className="w-full h-full object-cover grayscale-[0.2] group-hover/alt:grayscale-0 transition-all duration-700 group-hover/alt:scale-105"
                          />
                        </div>
                        <h4 className="text-[10px] font-bold text-black truncate leading-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                          {alt.name}
                        </h4>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          {alt.priceRange ? (
                            <span className="text-[10px] font-bold text-black tabular-nums tracking-tighter" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                              {formatPriceStartingFrom(alt.priceRange.min)}
                            </span>
                          ) : (
                            <>
                              <span className="text-[11px] font-bold text-black tabular-nums tracking-tighter">
                                {formatPriceFromRial(alt.price, false)}
                              </span>
                              <span className="text-[7px] text-black/40 font-bold" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                                {t('common.toman', 'تومان')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Feedback Widget */}
      <InlineFeedbackWidget flow="studio" sessionId={activeSessionId || sessionId} />

      <div className="flex flex-col gap-8 pt-10 border-t border-black/[0.06]">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <span className="block text-[9px] text-black/30 font-bold uppercase tracking-[0.3em]">{t('studio.result.collectionSummary', 'Collection Summary')}</span>
            <span className="block text-[11px] text-black/60 font-medium" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              {t('studio.result.productsInList', '{{count}} محصول در لیست نهایی', { count: categoryGroups.length })}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[26px] font-bold text-black tabular-nums tracking-tighter">
              {formatPriceFromRial(totalPrice, false)}
            </span>
            <span className="text-[10px] text-black/40 font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              {t('common.toman', 'تومان')}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleFinalize}
            className="w-full h-12 bg-black text-white text-[11px] font-bold rounded-none uppercase tracking-[0.3em] hover:bg-black/90 transition-all active:scale-[0.99]"
            style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
          >
            {t('studio.result.finalizeList', 'نهایی‌سازی لیست')}
          </button>

          <div className="text-center pt-2">
            <p className="text-[9px] font-medium text-black/20 uppercase tracking-[0.5em]">{t('studio.result.editorialSelection', 'Studio Homa • Editorial Selection')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Show loader while auth is initializing to prevent flash of login modal
  if (!isInitialized) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center" dir="rtl">
        <HomaLoader />
      </div>
    );
  }

  // Show loader while session data is loading (after auth is ready)
  // The loading overlay will show during API fetch
  const needsSessionLoad = sessionId && (!activeSession || activeSessionId !== sessionId);
  const showSessionLoader = isLoggedIn && needsSessionLoad;

  return (
    <div className="h-screen w-full bg-background relative overflow-hidden flex flex-col font-vazirmatn select-none" dir="rtl">

      {/* 1. Mobile-only Global Header */}
      {!isFullScreen && (
        <div className="md:hidden">
          <Header />
          <ContextBar
            items={[
              { label: t('nav.studio', 'استودیو'), href: '/studio' },
              { label: t('studio.result.title', 'نتیجه طراحی') }
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
              <span className="text-muted-foreground uppercase tracking-widest leading-none mb-1" style={{ fontSize: '10px', fontWeight: 'var(--font-weight-bold)' }}>{t('studio.result.studioResult', 'Studio Result')}</span>
              <h1 className="text-foreground leading-[1.1] m-0" style={{ fontSize: 'var(--text-h3-size)', fontWeight: 'var(--font-weight-bold)', fontFamily: 'var(--font-family-vazirmatn)' }}>{t('studio.result.smartAnalysis', 'تحلیل هوشمند فضا')}</h1>
            </div>
          </div>
          
          <InsightContent isDesktop />
        </div>

        {/* LEFT PANEL (Main Hero Area) */}
        <div
          className="hidden md:block flex-1 h-full bg-zinc-900 relative overflow-hidden group"
        >
          <AuthenticatedImage
            src={resultImage}
            alt="Studio Result"
            imageWidth={1200}
            imageQuality={85}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${showOriginal ? 'opacity-0 scale-105 blur-sm pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'}`}
          />
          {originalImage && (
            originalImage.startsWith('data:') ? (
              <img
                src={originalImage}
                alt="Original"
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${showOriginal ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
              />
            ) : (
              <AuthenticatedImage
                src={originalImage}
                alt="Original"
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${showOriginal ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
              />
            )
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
                {/* Google Lens search button disabled
                <button
                  onClick={handleStartSearch}
                  className="w-12 h-12 rounded-full bg-black/10 backdrop-blur-xl border border-white/20 text-white hover:bg-black/20 flex items-center justify-center transition-all active:scale-90"
                  title={t('studio.result.googleLensSearch', 'جستجو در گوگل لنز')}
                >
                  <Search size={20} />
                </button>
                */}
{/* TODO: Enable after try-on flow is fixed
                <button
                  onClick={handleSubmitToGallery}
                  disabled={isSubmittingToGallery || isSubmittedToGallery || !hasCompletedTryOn}
                  className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center border transition-all active:scale-90 ${isSubmittedToGallery ? 'bg-white border-white text-green-600' : 'bg-black/10 border-white/20 text-white hover:bg-black/20'} ${(isSubmittingToGallery || !hasCompletedTryOn) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={hasCompletedTryOn ? "اشتراک در گالری عمومی" : "ابتدا یک محصول را امتحان کنید"}
                >
                  {isSubmittingToGallery ? <Loader2 size={20} className="animate-spin" /> : isSubmittedToGallery ? <CheckCircle2 size={20} /> : <Users size={20} />}
                </button>
*/}
                <button
                  onClick={() => {
                    if (!isSaved) trackStudioResultAction({ action: 'save', session_id: sessionId || activeSessionId || '' });
                    setIsSaved(!isSaved);
                  }}
                  data-ph-capture-attribute-action="studio_save"
                  className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center border transition-all active:scale-90 ${isSaved ? 'bg-white border-white text-accent' : 'bg-black/10 border-white/20 text-white hover:bg-black/20'}`}
                >
                  <Heart size={20} className={isSaved ? 'fill-current' : ''} />
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  data-ph-capture-attribute-action="studio_download"
                  className={`w-12 h-12 rounded-full bg-black/10 backdrop-blur-xl border border-white/20 text-white hover:bg-black/20 flex items-center justify-center transition-all active:scale-90 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
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
                  onClick={() => {
                    trackStudioResultAction({ action: 'before_after', session_id: sessionId || activeSessionId || '' });
                    setShowOriginal(true);
                  }}
                  className={`px-5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-500 ${showOriginal ? 'bg-white/95 text-black' : 'text-white/40 hover:text-white'}`}
                >
                  {t('studio.result.before', 'قبل')}
                </button>
                <button
                  onClick={() => {
                    trackStudioResultAction({ action: 'before_after', session_id: sessionId || activeSessionId || '' });
                    setShowOriginal(false);
                  }}
                  className={`px-5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-500 ${!showOriginal ? 'bg-white/95 text-black' : 'text-white/40 hover:text-white'}`}
                >
                  {t('studio.result.after', 'بعد')}
                </button>
              </div>

              <button
                onClick={() => {
                  trackStudioResultAction({ action: 'fullscreen', session_id: sessionId || activeSessionId || '' });
                  setIsFullScreen(true);
                }}
                data-ph-capture-attribute-action="studio_fullscreen"
                className="flex items-center gap-3 px-8 h-[56px] bg-black/40 hover:bg-black/60 backdrop-blur-2xl rounded-full border border-white/20 text-white shadow-2xl transition-all active:scale-95 group/btn"
              >
                <Maximize2 size={18} />
                <span className="text-[13px] font-bold tracking-wide">{t('studio.result.viewFullscreen', 'مشاهده تمام صفحه')}</span>
              </button>
            </div>
          </div>

          {/* Google Lens Search Mode Overlay (disabled)
          <ImageSearchMode
            isActive={isSearchMode}
            onCancel={handleCancelSearch}
            onSearchComplete={handleSearchComplete}
            imageRef={imageRef}
            containerRef={imageContainerRef}
          />
          */}
        </div>

        {/* MOBILE LAYOUT (Unified Scroll) */}
        <div className="md:hidden absolute inset-0 bg-background flex flex-col z-0">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {/* Hero Image */}
            <div className="relative w-full h-[65vh]">
              <AuthenticatedImage
                src={resultImage}
                alt="Studio Result"
                imageWidth={800}
                imageQuality={80}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${showOriginal ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
              />
              {/* Original room image for before/after toggle */}
              {originalImage && (
                originalImage.startsWith('data:') ? (
                  <img
                    src={originalImage}
                    alt="Original"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${showOriginal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                  />
                ) : (
                  <AuthenticatedImage
                    src={originalImage}
                    alt="Original"
                    imageWidth={800}
                    imageQuality={80}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${showOriginal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                  />
                )
              )}
              <button
                className="absolute inset-0 z-10"
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
{/* TODO: Enable after try-on flow is fixed
                  <button
                    onClick={handleSubmitToGallery}
                    disabled={isSubmittingToGallery || isSubmittedToGallery || !hasCompletedTryOn}
                    className={`w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center border border-white/10 transition-all active:scale-90 ${isSubmittedToGallery ? 'text-green-600 bg-white' : 'text-white bg-black/20'} ${(isSubmittingToGallery || !hasCompletedTryOn) ? 'opacity-50' : ''}`}
                  >
                    {isSubmittingToGallery ? <Loader2 size={16} className="animate-spin" /> : isSubmittedToGallery ? <CheckCircle2 size={16} /> : <Users size={16} />}
                  </button>
*/}
                  <button
                    onClick={() => {
                      if (!isSaved) trackStudioResultAction({ action: 'save', session_id: sessionId || activeSessionId || '' });
                      setIsSaved(!isSaved);
                    }}
                    className={`w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center border border-white/10 transition-all active:scale-90 ${isSaved ? 'text-accent bg-white' : 'text-white'}`}
                  >
                    <Heart size={18} className={isSaved ? 'fill-current' : ''} />
                  </button>
                  {/* Google Lens search button disabled
                  <button
                    onClick={handleStartSearch}
                    className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90"
                    title={t('studio.result.googleLensSearch', 'جستجو در گوگل لنز')}
                  >
                    <Search size={18} />
                  </button>
                  */}
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className={`w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90 ${isDownloading ? 'opacity-50' : ''}`}
                  >
                    {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
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
                    {t('studio.result.fullscreenView', 'نمای تمام‌صفحه')}
                  </span>
                </motion.div>
              </button>

              {/* Mobile Google Lens Search Mode (disabled)
              <ImageSearchMode
                isActive={isSearchMode}
                onCancel={handleCancelSearch}
                onSearchComplete={handleSearchComplete}
                imageRef={mobileImageRef}
                containerRef={mobileImageContainerRef}
              />
              */}
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
              {/* Note: Using same size params as desktop view (1200x85) to reuse cached blob URL for instant display */}
              <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4 md:p-8">
                <AuthenticatedImage
                  src={resultImage}
                  alt="Studio Result"
                  imageWidth={1200}
                  imageQuality={85}
                  className={`max-w-full max-h-full object-contain transition-opacity duration-700 ease-in-out shadow-2xl ${showOriginal ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'}`}
                />
                {originalImage && (
                  originalImage.startsWith('data:') ? (
                    <img
                      src={originalImage}
                      alt="Original"
                      className={`absolute inset-0 m-auto max-w-full max-h-full object-contain transition-opacity duration-700 ease-in-out shadow-2xl ${showOriginal ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none'}`}
                    />
                  ) : (
                    <AuthenticatedImage
                      src={originalImage}
                      alt="Original"
                      className={`absolute inset-0 m-auto max-w-full max-h-full object-contain transition-opacity duration-700 ease-in-out shadow-2xl ${showOriginal ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none'}`}
                    />
                  )
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
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className={`w-12 h-12 rounded-full bg-white/10 backdrop-blur-2xl flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-all active:scale-90 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
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
                    {t('studio.result.before', 'قبل')}
                  </button>
                  <button
                    onClick={() => setShowOriginal(false)}
                    className={`px-8 h-10 rounded-full text-[12px] font-bold transition-all duration-500 ${!showOriginal ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                    style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                  >
                    {t('studio.result.after', 'بعد')}
                  </button>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-[0.3em]" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                    {t('studio.result.holdToCompare', 'نگه‌دار برای مقایسه')}
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
            alternatives={productAlternatives}
            redesignSessionId={activeSessionId || sessionId}
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
                <h3 className="text-[18px] font-bold text-black" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>{t('studio.result.saveAndExit', 'ذخیره و خروج')}</h3>
                <p className="text-[14px] text-black/70 leading-relaxed font-medium" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                  {t('studio.result.exitDescription', 'طراحی شما ذخیره شده و به استودیو باز می‌گردید.')}
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => {
                    setIsSaved(true);
                    setShowExitDecision(false);
                    clearActiveSession();
                    navigate('/studio');
                  }}
                  className="w-full h-[56px] bg-black text-white rounded-full font-bold text-[14px] hover:opacity-90 transition-all active:scale-95 shadow-lg"
                  style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                >
                  {t('studio.result.confirmAndReturn', 'تایید و بازگشت')}
                </button>
                <button
                  onClick={() => setShowExitDecision(false)}
                  className="w-full h-[56px] bg-white/20 text-black border border-white/20 rounded-full font-bold text-[14px] hover:bg-white/30 transition-all active:scale-95"
                  style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                >
                  {t('common.cancel', 'انصراف')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay - shows during session load or when session needs loading */}
      <AnimatePresence>
        {(isLoading || showSessionLoader) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-black/40" />
              <span className="text-[14px] font-medium text-black/60">{t('common.loading', 'در حال بارگذاری...')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Ready Modal */}
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
                <h3 className="text-[18px] font-bold text-foreground" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>{t('studio.result.imageReady', 'تصویر آماده است')}</h3>
                <p className="text-[14px] text-foreground/70 leading-relaxed font-medium" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                  {t('studio.result.clickToSave', 'برای ذخیره تصویر روی دکمه زیر کلیک کنید')}
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleConfirmDownload}
                  className="w-full h-[56px] bg-foreground text-background rounded-full font-bold text-[14px] hover:opacity-90 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                  style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                >
                  <Download size={18} />
                  {t('studio.result.saveImage', 'ذخیره تصویر')}
                </button>
                <button
                  onClick={handleCancelDownload}
                  className="w-full h-[56px] bg-white/20 text-foreground border border-white/20 rounded-full font-bold text-[14px] hover:bg-white/30 transition-all active:scale-95"
                  style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                >
                  {t('common.cancel', 'انصراف')}
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
        onSuccess={(user, tokens) => {
          login(user, tokens);
          setIsAuthModalOpen(false);
        }}
      />

    </div>
  );
}
