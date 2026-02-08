import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { SidebarMenu } from '@/components/SidebarMenu';
import { toast } from 'sonner';
import { fetchGalleryItem, deleteGalleryItem } from '@/services/galleryService';
import { fetchAuthenticatedImage } from '@/utils/apiClient';
import { type GalleryItem } from '@/types/gallery';
import { formatRelativeTime } from '@/utils/formatters';
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

      {/* Used Product Section */}
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
                {item.productCategory}
              </span>
              <h1 className="text-[28px] font-bold text-foreground leading-tight">
                {item.productName}
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
            className={`w-full h-full object-cover transition-opacity duration-700 ${hasBeforeImage && showOriginal ? 'opacity-0' : 'opacity-100'}`}
          />
          {hasBeforeImage && (
            <AuthenticatedImage
              src={item.customerImageUrl}
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
                className={`w-full h-full object-contain transition-opacity ${hasBeforeImage && showOriginal ? 'opacity-0' : 'opacity-100'}`}
              />
              {hasBeforeImage && (
                <AuthenticatedImage
                  src={item.customerImageUrl}
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
    </div>
  );
}
