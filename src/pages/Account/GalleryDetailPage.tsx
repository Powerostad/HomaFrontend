import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { SidebarMenu } from '@/components/SidebarMenu';
import { toast } from 'sonner';
import { fetchGalleryItem, getFullImageUrl } from '@/services/galleryService';
import { type GalleryItem } from '@/types/gallery';
import { formatRelativeTime } from '@/utils/formatters';

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
}

function ErrorState({ onRetry, isRetrying, onBack }: ErrorStateProps) {
  return (
    <div className="h-screen w-full bg-background flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
        <RefreshCw size={48} strokeWidth={1} />
      </div>
      <div className="flex flex-col gap-2 text-center max-w-[280px]">
        <h3 className="text-[18px] font-bold text-foreground">خطا در بارگذاری</h3>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          متأسفانه در بارگذاری این طرح مشکلی پیش آمده است.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="rounded-full">
          بازگشت به گالری
        </Button>
        <Button onClick={onRetry} disabled={isRetrying} className="rounded-full">
          {isRetrying ? 'در حال تلاش...' : 'تلاش مجدد'}
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

  // UI State
  const [showOriginal, setShowOriginal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
        setError(result.error || 'خطا در دریافت اطلاعات');
      }
    } catch {
      setError('خطا در برقراری ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  // ==========================================================================
  // Handlers
  // ==========================================================================
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/account/gallery/${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('لینک طرح برای اشتراک‌گذاری کپی شد');
    }).catch(() => {
      toast.error('خطا در کپی کردن لینک');
    });
  };

  const handleDownload = async () => {
    if (!item) return;

    setIsDownloading(true);
    toast.success('در حال آماده‌سازی فایل دانلود...');

    try {
      const imageUrl = getFullImageUrl(item.resultImageUrl);
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `homa-tryon-${item.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success('دانلود شروع شد');
    } catch {
      toast.error('خطا در دانلود تصویر');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    toast.error('آیا از حذف این طرح اطمینان دارید؟', {
      action: {
        label: 'حذف',
        onClick: () => {
          // TODO: Call backend delete endpoint when available
          toast.success('طرح با موفقیت از گالری حذف شد');
          navigate('/account/gallery');
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
      />
    );
  }

  // ==========================================================================
  // Product Content Component
  // ==========================================================================
  const ProductContent = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <div className={`flex flex-col gap-8 ${isDesktop ? 'px-10' : 'px-8'} pb-[96px]`}>
      {/* Gallery Context Label */}
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 bg-secondary rounded-full">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">از گالری من</span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          {formatRelativeTime(item.createdAt)}
        </span>
      </div>

      {/* Used Product Section */}
      <div className="flex flex-col gap-4 pb-6 border-b border-border">
        <div className="flex justify-between items-center">
          <h4 className="text-[16px] font-bold text-foreground">محصول استفاده‌شده</h4>
          <span className="px-2 py-0.5 bg-[#dfff00]/20 text-foreground text-[10px] font-bold rounded-sm">
            استفاده‌شده در Try-On
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative w-[84px] h-[84px] rounded-[14px] overflow-hidden flex-shrink-0 border border-border bg-secondary/30">
            <ImageWithFallback
              src={item.resultImageUrl}
              alt={item.productName}
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
          <span className="text-[11px] font-bold">اشتراک</span>
        </button>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-secondary transition-colors group disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          </div>
          <span className="text-[11px] font-bold">دانلود</span>
        </button>
        <button
          onClick={handleDelete}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-destructive/5 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-destructive/5 flex items-center justify-center text-destructive group-hover:bg-destructive group-hover:text-white transition-colors">
            <Trash2 size={18} />
          </div>
          <span className="text-[11px] font-bold text-destructive">حذف</span>
        </button>
      </div>

      {/* Score/Rating Section */}
      {item.score && (
        <div className="flex flex-col gap-3 pb-6 border-b border-border">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[1.5px]">
            امتیاز شما
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-foreground">
              {item.score === 1 ? '👍 خوب بود' : item.score === 2 ? '😐 معمولی' : '👎 بد بود'}
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
      className="h-screen w-full bg-background relative overflow-hidden flex flex-col font-vazirmatn select-none"
      dir="rtl"
    >
      {!isFullScreen && (
        <div className="md:hidden">
          <Header />
        </div>
      )}

      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
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
                <span className="text-[14px] font-bold">بازگشت به گالری</span>
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
        <div className="flex-1 h-full bg-secondary relative overflow-hidden group">
          <ImageWithFallback
            src={item.resultImageUrl}
            alt="Result"
            className={`w-full h-full object-cover transition-opacity duration-700 ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
          />
          <img
            src={item.customerImageUrl}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${showOriginal ? 'opacity-100' : 'opacity-0'}`}
            alt="Before"
          />

          {/* Desktop Controls */}
          <div className="hidden md:block absolute inset-0 pointer-events-none">
            <div className="absolute top-8 left-8 pointer-events-auto">
              <button
                onClick={handleBack}
                className="w-12 h-12 rounded-full bg-black/10 backdrop-blur-xl border border-white/20 text-white hover:bg-black/20 flex items-center justify-center transition-all shadow-lg"
              >
                <ArrowRight size={24} />
              </button>
            </div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto">
              <button
                onClick={() => setIsFullScreen(true)}
                className="flex items-center gap-3 px-8 h-[56px] bg-black/40 backdrop-blur-2xl rounded-full border border-white/20 text-white shadow-2xl active:scale-95 group/btn"
              >
                <Maximize2 size={18} />
                <span className="text-[13px] font-bold tracking-wide">نمای بزرگ</span>
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
        <div className="md:hidden absolute inset-x-0 bottom-0 max-h-[40vh] bg-card rounded-t-[32px] pt-8 shadow-2xl z-30 overflow-y-auto scrollbar-hide">
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
              <ImageWithFallback
                src={item.resultImageUrl}
                className={`w-full h-full object-contain transition-opacity ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
              />
              <img
                src={item.customerImageUrl}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity ${showOriginal ? 'opacity-100' : 'opacity-0'}`}
                alt="Before"
              />
            </div>
            <div className="mt-10 flex items-center p-1 bg-white/10 backdrop-blur-xl rounded-full border border-white/10">
              <button
                onClick={() => setShowOriginal(false)}
                className={`px-10 h-12 rounded-full text-[14px] font-bold ${!showOriginal ? 'bg-white text-black' : 'text-white/60'}`}
              >
                بُعد
              </button>
              <button
                onClick={() => setShowOriginal(true)}
                className={`px-10 h-12 rounded-full text-[14px] font-bold ${showOriginal ? 'bg-white text-black' : 'text-white/60'}`}
              >
                قبل
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
