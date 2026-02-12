import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Share2,
  Download,
  X,
  Menu,
  Maximize2,
  Trash2,
  RefreshCw,
  Loader2,
  Bookmark,
} from 'lucide-react';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { SidebarMenu } from '@/components/SidebarMenu';
import { ProductDetailSheet, type Product } from '@/pages/Studio/components/ProductDetailSheet';
import { toast } from 'sonner';
import { fetchGalleryItem, deleteGalleryItem } from '@/services/galleryService';
import { fetchAuthenticatedImage } from '@/utils/apiClient';
import { type GalleryItem, type GalleryStudioProduct } from '@/types/gallery';
import { formatRelativeTime, formatPriceFromRial, formatPriceStartingFrom, toLocalizedDigits } from '@/utils/formatters';
import { trackGalleryShared } from '@/analytics/events';

// =============================================================================
// Loading Skeleton
// =============================================================================

function DetailSkeleton() {
  return (
    <div className="h-screen w-full bg-background flex flex-col md:flex-row animate-pulse">
      {/* Left side skeleton */}
      <div className="hidden md:flex flex-col w-[450px] h-full bg-card border-l border-border p-8 pt-10 gap-8">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-secondary rounded-full" />
          <div className="h-5 w-32 bg-secondary rounded" />
          <div className="w-10" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-3 w-24 bg-secondary rounded" />
          <div className="h-8 w-3/4 bg-secondary rounded" />
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <div className="h-24 bg-secondary rounded-xl" />
          <div className="h-20 bg-secondary rounded-xl" />
        </div>
      </div>
      {/* Right side skeleton */}
      <div className="flex-1 h-full bg-secondary" />
    </div>
  );
}

// =============================================================================
// Error State
// =============================================================================

interface ErrorStateProps {
  onRetry: () => void;
  isRetrying: boolean;
  onBack: () => void;
  t: (key: string) => string;
}

function ErrorState({ onRetry, isRetrying, onBack, t }: ErrorStateProps) {
  return (
    <div className="h-screen w-full bg-background flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
        <RefreshCw size={48} strokeWidth={1} />
      </div>
      <div className="flex flex-col gap-2 text-center max-w-[280px]">
        <h3 className="text-[18px] font-bold text-foreground">{t('gallery.detail.loadError')}</h3>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          {t('gallery.detail.loadErrorDescription')}
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="rounded-full">
          {t('gallery.detail.backToGallery')}
        </Button>
        <Button onClick={onRetry} disabled={isRetrying} className="rounded-full">
          {isRetrying ? t('common.wait') : t('common.retry')}
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function GalleryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // UI State
  const [showOriginal, setShowOriginal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasBeforeImage, setHasBeforeImage] = useState(true);

  // API State
  const [item, setItem] = useState<GalleryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Studio product state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ==========================================================================
  // Load item data
  // ==========================================================================
  const loadItem = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchGalleryItem(id);

      if (result.success && result.data) {
        setItem(result.data);
      } else {
        setError(result.error || t('gallery.detail.loadError'));
      }
    } catch {
      setError(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  // Check if before/customer image exists
  useEffect(() => {
    if (!item?.customerImageUrl) {
      setHasBeforeImage(false);
      return;
    }
    fetchAuthenticatedImage(item.customerImageUrl)
      .then(() => setHasBeforeImage(true))
      .catch(() => setHasBeforeImage(false));
  }, [item?.customerImageUrl]);

  // ==========================================================================
  // Studio product helpers
  // ==========================================================================

  /** Convert a GalleryStudioProduct to the UI Product type used by ProductDetailSheet */
  const galleryProductToUIProduct = useCallback(
    (p: GalleryStudioProduct, index: number): Product & { store?: string; matchScore?: number } => ({
      id: String(p.id),
      name: p.name,
      price: p.price,
      category: p.categoryDisplay || p.category || '',
      store: p.shopName || '',
      image: p.imageUrl,
      hotspot: { x: 50, y: 50 + index * 10 },
      isPromoted: p.isPromoted,
      persianReason: p.persianReason,
      matchHighlights: p.matchHighlights,
      description: p.description,
      extraDetails: p.extraDetails,
      link: p.link,
      uniqueLink: p.uniqueLink,
      availableSizes: p.availableSizes,
      availableSizesDisplay: p.availableSizesDisplay,
      sizePrices: p.sizePrices,
      sizePricesDisplay: p.sizePricesDisplay?.map(sp => ({
        code: sp.code,
        display: sp.display,
        price: sp.price,
        hasSpecificPrice: sp.hasSpecificPrice,
      })),
      priceRange: p.priceRange,
      matchScore: p.matchScore,
    }),
    []
  );

  /** Group studio items into category groups with UI products */
  const categoryGroups = useMemo(() => {
    if (!item?.studioItems?.length) return [];
    return item.studioItems
      .filter(si => si.products.length > 0)
      .map(si => ({
        category: si.category,
        categoryDisplay: si.categoryDisplay,
        itemType: si.itemType,
        fitReasoningFa: si.fitReasoningFa,
        recommendedSize: si.recommendedSize || '',
        quantity: si.quantity ?? 1,
        placement: si.placement || '',
        products: si.products.map((p, i) => galleryProductToUIProduct(p, i)),
      }));
  }, [item?.studioItems, galleryProductToUIProduct]);

  /** Alternatives scoped to same category as selected product */
  const productAlternatives = useMemo(() => {
    if (!selectedProduct || !categoryGroups.length) return [];
    for (const group of categoryGroups) {
      if (group.products.find(p => p.id === selectedProduct.id)) {
        return group.products.filter(p => p.id !== selectedProduct.id);
      }
    }
    return [];
  }, [selectedProduct, categoryGroups]);

  const handleProductClick = useCallback(
    (product: Product) => {
      const group = categoryGroups.find(g => g.products.some(p => p.id === product.id));
      setSelectedProduct({
        ...product,
        persianReason: product.persianReason || group?.fitReasoningFa || '',
      });
    },
    [categoryGroups]
  );

  // ==========================================================================
  // Handlers
  // ==========================================================================
  const handleShare = async () => {
    if (!item?.shareToken) {
      toast.error(t('errors.unknownError'));
      return;
    }

    const shareUrl = `${window.location.origin}/s/${item.shareToken}`;

    // Mobile: use native share sheet with image file
    if (navigator.share && navigator.canShare) {
      try {
        // Try sharing with image file for Stories support
        const response = await fetchAuthenticatedImage(item.resultImageUrl);
        const blob = await fetch(response).then((r) => r.blob());
        const file = new File([blob], `homa-${item.id}.jpg`, { type: 'image/jpeg' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            url: shareUrl,
          });
          trackGalleryShared({ type: item.type, item_id: item.id, method: 'native_share' });
          return;
        }
      } catch {
        // Fall through to URL-only share or clipboard
      }

      // Fallback: native share with URL only
      try {
        await navigator.share({ url: shareUrl });
        trackGalleryShared({ type: item.type, item_id: item.id, method: 'native_share' });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Desktop / fallback: copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success(t('gallery.detail.shareLinkCopied', 'لینک اشتراک‌گذاری کپی شد'));
      trackGalleryShared({ type: item.type, item_id: item.id, method: 'clipboard' });
    }).catch(() => {
      toast.error(t('tryOn.result.copyLinkFailed'));
    });
  };

  const handleDownload = async () => {
    if (!item) return;

    setIsDownloading(true);
    toast.success(t('gallery.detail.preparingDownload'));

    try {
      // Use fetchAuthenticatedImage to get blob URL with JWT auth
      const blobUrl = await fetchAuthenticatedImage(item.resultImageUrl);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `homa-tryon-${item.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success(t('gallery.detail.downloadStarted'));
    } catch {
      toast.error(t('errors.downloadError'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    if (!item || isDeleting) return;

    toast.error(t('gallery.detail.deleteConfirm'), {
      action: {
        label: t('common.delete'),
        onClick: async () => {
          setIsDeleting(true);
          try {
            const result = await deleteGalleryItem(item.id, item.type);
            if (result.success) {
              toast.success(t('gallery.detail.deleteSuccess'));
              navigate('/account/gallery');
            } else {
              toast.error(t('gallery.detail.deleteError'));
            }
          } catch {
            toast.error(t('gallery.detail.deleteError'));
          } finally {
            setIsDeleting(false);
          }
        },
      },
    });
  };

  const handleBack = () => navigate('/account/gallery');

  // ==========================================================================
  // Loading & Error States
  // ==========================================================================
  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !item) {
    return (
      <ErrorState
        onRetry={loadItem}
        isRetrying={isLoading}
        onBack={handleBack}
        t={t}
      />
    );
  }

  // ==========================================================================
  // Product Content Component
  // ==========================================================================
  const isStudio = item.type === 'studio';

  const ProductContent = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <div className={`flex flex-col ${isDesktop ? 'gap-8 px-10 pb-24' : 'gap-5 px-6 pb-8'}`}>
      {/* Gallery Context Label */}
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 bg-secondary rounded-full">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t('gallery.detail.fromMyGallery')}</span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          {formatRelativeTime(item.createdAt)}
        </span>
      </div>

      {/* --- Try-on: Used Product Section --- */}
      {!isStudio && (
        <div className="flex flex-col gap-4 pb-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h4 className="text-[16px] font-bold text-foreground">{t('gallery.detail.usedProduct')}</h4>
            <span className="px-2 py-0.5 bg-[#dfff00]/20 text-foreground text-[10px] font-bold rounded-sm">
              {t('gallery.detail.usedInTryOn')}
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <div className="relative w-[84px] h-[84px] rounded-[14px] overflow-hidden flex-shrink-0 border border-border bg-secondary/30">
              <AuthenticatedImage
                src={item.productImageUrl || item.customerImageUrl}
                alt={item.productName ?? undefined}
                imageWidth={200}
                imageQuality={80}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <h1 className="text-[18px] font-bold text-foreground leading-tight">
                {item.productName}
              </h1>
              <span className="text-[12px] font-medium text-muted-foreground">
                {item.productCategory}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- Studio: Recommended Products by Category --- */}
      {isStudio && categoryGroups.length > 0 && (
        <div className="space-y-2 pt-0">
          <div className="flex items-baseline justify-between border-b border-black/[0.05] pb-2">
            <h2 className="text-[20px] font-medium text-foreground tracking-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              {t('studio.result.suggestedProducts', 'محصولات پیشنهادی')}
            </h2>
            <span className="text-[10px] text-foreground/30 font-medium tracking-wide uppercase" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              {t('studio.result.curated', 'Curated')}
            </span>
          </div>

          <div className="flex flex-col gap-8">
            {categoryGroups.map((group) => {
              const topPick = group.products[0];
              const alternatives = group.products.slice(1);

              return (
                <div key={`${group.category}-${group.itemType}`} className="flex flex-col gap-4">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 pt-4">
                    <span className="text-[16px] font-bold text-foreground" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                      {group.categoryDisplay}
                    </span>
                    <div className="flex-1 h-px bg-foreground/[0.06]" />
                  </div>

                  {/* Item Metadata (quantity, size, placement) */}
                  {(group.quantity > 1 || group.recommendedSize || group.placement) && (
                    <div className="flex items-center gap-2 flex-wrap px-1">
                      {group.quantity > 1 && (
                        <span className="text-[10px] font-bold text-foreground/40 tracking-wide" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                          {t('studio.result.quantity', '{{amount}} عدد', { amount: toLocalizedDigits(group.quantity) })}
                        </span>
                      )}
                      {group.quantity > 1 && (group.recommendedSize || group.placement) && (
                        <span className="w-0.5 h-0.5 rounded-full bg-foreground/20" />
                      )}
                      {group.recommendedSize && (
                        <span className="text-[10px] font-bold text-foreground/40 tracking-wide" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                          {t('studio.result.recommendedSize', 'سایز: {{size}}', { size: group.recommendedSize })}
                        </span>
                      )}
                      {group.recommendedSize && group.placement && (
                        <span className="w-0.5 h-0.5 rounded-full bg-foreground/20" />
                      )}
                      {group.placement && (
                        <span className="text-[10px] font-bold text-foreground/40 tracking-wide" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                          {t('studio.result.placement', 'جایگاه: {{placement}}', { placement: group.placement })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Top Pick - Large Editorial Card */}
                  {topPick && (
                    <div className="group flex flex-row gap-5 py-4">
                      <div
                        className="relative w-[170px] aspect-[3/4] bg-foreground/[0.02] overflow-hidden cursor-pointer shrink-0 transition-all duration-500"
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

                      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1 min-w-0">
                              <h3 className="text-[13px] font-bold text-foreground uppercase tracking-[0.05em] leading-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                                {topPick.name}
                              </h3>
                              <div className="flex items-center gap-2 opacity-30">
                                <span className="text-[8px] text-foreground font-bold uppercase tracking-[0.1em]">{topPick.category}</span>
                                <span className="w-0.5 h-0.5 rounded-full bg-foreground" />
                                <span className="text-[8px] text-foreground font-bold uppercase tracking-[0.1em]">{topPick.store}</span>
                              </div>
                            </div>
                            <Bookmark size={16} strokeWidth={1.5} className="text-foreground/10 shrink-0" />
                          </div>

                          <div className="flex items-baseline gap-1.5 mt-2">
                            {topPick.priceRange ? (
                              <span className="text-[15px] font-bold text-foreground tabular-nums tracking-tighter" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                                {formatPriceStartingFrom(topPick.priceRange.min)}
                              </span>
                            ) : (
                              <>
                                <span className="text-[18px] font-bold text-foreground tabular-nums tracking-tighter">
                                  {formatPriceFromRial(topPick.price, false)}
                                </span>
                                <span className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                                  {t('common.toman', 'تومان')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleProductClick(topPick)}
                          className="w-full h-10 border border-foreground/10 text-foreground text-[9px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-foreground hover:text-background active:scale-[0.98]"
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
                          <div className="relative aspect-[3/4] bg-foreground/[0.02] overflow-hidden mb-1.5">
                            <AuthenticatedImage
                              src={alt.image}
                              alt={alt.name}
                              imageWidth={200}
                              imageQuality={75}
                              className="w-full h-full object-cover grayscale-[0.2] group-hover/alt:grayscale-0 transition-all duration-700 group-hover/alt:scale-105"
                            />
                          </div>
                          <h4 className="text-[10px] font-bold text-foreground truncate leading-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                            {alt.name}
                          </h4>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            {alt.priceRange ? (
                              <span className="text-[10px] font-bold text-foreground tabular-nums tracking-tighter" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
                                {formatPriceStartingFrom(alt.priceRange.min)}
                              </span>
                            ) : (
                              <>
                                <span className="text-[11px] font-bold text-foreground tabular-nums tracking-tighter">
                                  {formatPriceFromRial(alt.price, false)}
                                </span>
                                <span className="text-[7px] text-foreground/40 font-bold" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
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
      )}

      {/* Studio: empty state when no products */}
      {isStudio && categoryGroups.length === 0 && (
        <div className="flex flex-col gap-2 pb-6 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-secondary text-foreground text-[10px] font-bold rounded-sm">
              {t('gallery.detail.studioDesign', 'طراحی استودیو')}
            </span>
          </div>
          <span className="text-[12px] font-medium text-muted-foreground">
            {item.productCategory}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3 border-b border-border pb-6">
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-secondary transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            <Share2 size={18} />
          </div>
          <span className="text-[11px] font-bold">{t('common.share')}</span>
        </button>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-secondary transition-colors group disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          </div>
          <span className="text-[11px] font-bold">{t('common.download')}</span>
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-destructive/5 transition-colors group disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-destructive/5 flex items-center justify-center text-destructive group-hover:bg-destructive group-hover:text-white transition-colors">
            <Trash2 size={18} />
          </div>
          <span className="text-[11px] font-bold text-destructive">{t('common.delete')}</span>
        </button>
      </div>

      {/* Score/Rating Section */}
      {item.score && (
        <div className="flex flex-col gap-3 pb-6 border-b border-border">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[1.5px]">
            {t('gallery.detail.yourScore')}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-foreground">
              {item.score === 1 ? `👍 ${t('feedback.ratings.good')}` : item.score === 2 ? `😐 ${t('feedback.ratings.average')}` : `👎 ${t('feedback.ratings.poor')}`}
            </span>
          </div>
        </div>
      )}

      <div className="text-center opacity-10 pb-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-foreground">
          SAVED IN YOUR HOMA GALLERY
        </p>
      </div>
    </div>
  );

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div
      className="min-h-screen md:h-screen w-full bg-background relative flex flex-col font-vazirmatn select-none md:overflow-hidden"
      dir="rtl"
    >
      {!isFullScreen && (
        <div className="md:hidden">
          <Header />
        </div>
      )}

      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden relative">
        {/* Left Side: Info (Desktop) */}
        <div className="hidden md:flex flex-col w-[450px] h-full bg-card z-50 overflow-y-auto border-l border-border relative scrollbar-hide">
          <div className="p-8 pt-10 flex flex-col gap-10">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -mr-2 text-foreground/60 hover:text-foreground"
              >
                <Menu size={24} strokeWidth={1.5} />
              </button>
              <Link
                to="/account/gallery"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowRight
                  size={18}
                  className="rotate-0 group-hover:translate-x-1 transition-transform"
                />
                <span className="text-[14px] font-bold">{t('gallery.detail.backToGallery')}</span>
              </Link>
              <div className="w-10" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                {isStudio ? item.productCategory : item.productCategory}
              </span>
              <h1 className="text-[28px] font-bold text-foreground leading-tight">
                {isStudio
                  ? t('gallery.detail.studioDesign', 'طراحی استودیو')
                  : item.productName}
              </h1>
            </div>
          </div>

          <ProductContent isDesktop />
        </div>

        {/* Right Side: Hero Image */}
        <div className="h-[45vh] flex-shrink-0 md:flex-1 md:h-full bg-secondary relative overflow-hidden group">
          <AuthenticatedImage
            src={item.resultImageUrl}
            alt="Result"
            imageWidth={1200}
            imageQuality={85}
            className={`w-full h-full object-cover transition-opacity duration-700 ${hasBeforeImage && showOriginal ? 'opacity-0' : 'opacity-100'}`}
          />
          {hasBeforeImage && (
            <AuthenticatedImage
              src={item.customerImageUrl}
              imageWidth={1200}
              imageQuality={85}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${showOriginal ? 'opacity-100' : 'opacity-0'}`}
              alt="Before"
            />
          )}

          {/* Desktop Controls */}
          <div className="hidden md:block absolute inset-0 pointer-events-none">
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto">
              <button
                onClick={() => setIsFullScreen(true)}
                className="flex items-center gap-3 px-8 h-[56px] bg-black/40 backdrop-blur-2xl rounded-full border border-white/20 text-white shadow-2xl active:scale-95 group/btn"
              >
                <Maximize2 size={18} />
                <span className="text-[13px] font-bold tracking-wide">{t('gallery.detail.fullView')}</span>
              </button>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="md:hidden absolute top-6 left-0 right-0 px-6 flex justify-between items-center z-[210]">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10"
            >
              <ArrowRight size={20} />
            </button>
            <button
              onClick={() => setIsFullScreen(true)}
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Info Overlay */}
        <div className="md:hidden bg-card rounded-t-[32px] -mt-6 pt-8 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] relative z-30">
          <ProductContent />
        </div>
      </div>

      {/* Full Screen Overlay */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 md:p-12"
          >
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center"
            >
              <X size={24} />
            </button>
            <div className="relative max-w-full max-h-[80vh] aspect-[4/5] rounded-[24px] overflow-hidden border border-white/10 shadow-2xl">
              <AuthenticatedImage
                src={item.resultImageUrl}
                imageWidth={1200}
                imageQuality={85}
                className={`w-full h-full object-contain transition-opacity ${hasBeforeImage && showOriginal ? 'opacity-0' : 'opacity-100'}`}
              />
              {hasBeforeImage && (
                <AuthenticatedImage
                  src={item.customerImageUrl}
                  imageWidth={1200}
                  imageQuality={85}
                  className={`absolute inset-0 w-full h-full object-contain transition-opacity ${showOriginal ? 'opacity-100' : 'opacity-0'}`}
                  alt="Before"
                />
              )}
            </div>
            {hasBeforeImage && (
              <div className="mt-10 flex items-center p-1 bg-white/10 backdrop-blur-xl rounded-full border border-white/10">
                <button
                  onClick={() => setShowOriginal(false)}
                  className={`px-10 h-12 rounded-full text-[14px] font-bold ${!showOriginal ? 'bg-white text-black' : 'text-white/60'}`}
                >
                  {t('tryOn.result.after')}
                </button>
                <button
                  onClick={() => setShowOriginal(true)}
                  className={`px-10 h-12 rounded-full text-[14px] font-bold ${showOriginal ? 'bg-white text-black' : 'text-white/60'}`}
                >
                  {t('tryOn.result.before')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Sheet (Studio items) */}
      {selectedProduct && (
        <ProductDetailSheet
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onReplace={() => {}}
          alternatives={productAlternatives}
        />
      )}
    </div>
  );
}
