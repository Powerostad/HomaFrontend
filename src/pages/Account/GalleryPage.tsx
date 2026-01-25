import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { Header } from '../../components/Header';
import { SidebarMenu } from '../../components/SidebarMenu';
import { ResultCard } from '../../components/account/ResultCard';
import { EmptyGallery } from '../../components/account/EmptyGallery';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { fetchGallery, togglePinItem } from '@/services/galleryService';
import { toResultCardData, type GalleryItem, type ResultCardData } from '@/types/gallery';
import { formatRelativeTime } from '@/utils/formatters';

// =============================================================================
// Loading Skeleton Component
// =============================================================================

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex flex-col gap-3 animate-pulse">
          <div className="aspect-[4/5] bg-secondary rounded-[var(--radius-card)]" />
          <div className="flex flex-col gap-2 px-1">
            <div className="h-4 bg-secondary rounded w-3/4" />
            <div className="h-3 bg-secondary rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Error State Component
// =============================================================================

interface ErrorStateProps {
  onRetry: () => void;
  isRetrying: boolean;
  t: (key: string) => string;
}

function ErrorState({ onRetry, isRetrying, t }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-6">
      <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
        <RefreshCw size={48} strokeWidth={1} />
      </div>

      <div className="flex flex-col gap-2 max-w-[280px]">
        <h3 className="text-[18px] font-bold text-foreground">{t('gallery.errorTitle')}</h3>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          {t('gallery.errorDescription')}
        </p>
      </div>

      <Button
        onClick={onRetry}
        disabled={isRetrying}
        className="h-[56px] px-10 bg-foreground text-background rounded-full font-bold text-[14px] active:scale-95 transition-all shadow-lg"
      >
        {isRetrying ? t('common.wait') : t('common.retry')}
      </Button>
    </div>
  );
}

// =============================================================================
// Main Gallery Page
// =============================================================================

export default function GalleryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'pinned'>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // API state
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================================
  // Load gallery data
  // ==========================================================================
  const loadGallery = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchGallery();

      if (result.success && result.data) {
        setItems(result.data);
      } else {
        setError(result.error || t('gallery.errorTitle'));
      }
    } catch {
      setError(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Load on mount
  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  // ==========================================================================
  // Filter items based on active tab
  // ==========================================================================
  const filteredItems = activeTab === 'all'
    ? items
    : items.filter((item) => item.isPinned);

  // Convert to ResultCardData format for display
  const displayItems: ResultCardData[] = filteredItems.map((item) =>
    toResultCardData(item, formatRelativeTime)
  );

  // ==========================================================================
  // Handlers
  // ==========================================================================
  const handleDelete = (id: string) => {
    // Remove from local state (optimistic update)
    setItems(items.filter((item) => item.id !== id));
    toast.success(t('gallery.success.deleted'));
    // TODO: Call backend delete endpoint when available
  };

  const handleShare = (id: string) => {
    // Copy link to clipboard
    const shareUrl = `${window.location.origin}/account/gallery/${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success(t('tryOn.result.copyLinkSuccess'));
    }).catch(() => {
      toast.error(t('tryOn.result.copyLinkFailed'));
    });
  };

  const handleTogglePin = (id: string) => {
    const isNowPinned = togglePinItem(id);

    // Update local state
    setItems(items.map((item) =>
      item.id === id ? { ...item, isPinned: isNowPinned } : item
    ));

    toast.success(isNowPinned ? t('gallery.pinned') : t('gallery.unpinned'));
  };

  const handleCardClick = (id: string) => {
    navigate(`/account/gallery/${id}`);
  };

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div className="min-h-screen bg-background font-vazirmatn flex flex-col" dir="rtl">
      <Header />
      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 md:px-16 py-12 md:py-20 flex flex-col gap-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-[34px] font-bold text-foreground">{t('gallery.myGallery')}</h1>
            <p className="text-[15px] text-muted-foreground">{t('gallery.subtitle', 'تمامی نتایج Try-On شما در یک نگاه')}</p>
          </div>

          {/* Tabs - Only show if we have items */}
          {!isLoading && !error && items.length > 0 && (
            <div className="flex items-center p-1.5 bg-secondary/50 backdrop-blur-md rounded-full border border-border">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-8 h-10 rounded-full text-[13px] font-bold transition-all ${activeTab === 'all' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('common.all')}
              </button>
              <button
                onClick={() => setActiveTab('pinned')}
                className={`px-8 h-10 rounded-full text-[13px] font-bold transition-all ${activeTab === 'pinned' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('gallery.pinnedTab')}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          {isLoading ? (
            <GallerySkeleton />
          ) : error ? (
            <ErrorState onRetry={loadGallery} isRetrying={isLoading} t={t} />
          ) : displayItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {displayItems.map((result) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onTogglePin={handleTogglePin}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          ) : activeTab === 'pinned' && items.length > 0 ? (
            // Show message when no pinned items but items exist
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
              <p className="text-[16px] text-muted-foreground">
                {t('gallery.noPinnedItems')}
              </p>
              <Button
                onClick={() => setActiveTab('all')}
                variant="outline"
                className="rounded-full"
              >
                {t('gallery.viewAllDesigns')}
              </Button>
            </div>
          ) : (
            <EmptyGallery />
          )}
        </div>
      </main>
    </div>
  );
}
