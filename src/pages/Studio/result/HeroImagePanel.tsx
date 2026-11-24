import { trackStudioResultAction } from '@/analytics/events';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { useSiteTranslation } from '@/i18n/siteCopy';
import {
  ArrowRight,
  Download,
  Heart,
  Loader2,
  Maximize2,
  Share2,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import type { ImagePlacementMarker } from './types';
import { useSimpleTranslation } from './types';

export interface HeroMarker {
  itemId: number;
  label: string;
  marker: ImagePlacementMarker | null;
  number: number;
}

interface HeroImagePanelProps {
  resultImage: string;
  conceptImage?: string;
  originalImage: string | null;
  imageAlt?: { result: string; original: string };
  showOriginal: boolean;
  isSaved?: boolean;
  isDownloading?: boolean;
  analysisOnly?: boolean;
  sessionId?: string;
  markers?: HeroMarker[];
  activeMarkerId?: number;
  onToggleOriginal: (show: boolean) => void;
  onToggleSaved?: () => void;
  onDownload?: () => void;
  onFullscreen?: () => void;
  onExit?: () => void;
  onMarkerClick?: (itemId: number) => void;
  showSave?: boolean;
  showActions?: boolean;
  onImageError?: () => void;
}

function GlassButton({
  children,
  onClick,
  ariaLabel,
  disabled = false,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
  active?: boolean;
}) {
  const { siteValue } = useSiteTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={siteValue(ariaLabel)}
      aria-pressed={active || undefined}
      className="studio-hero-glass-button"
      style={{
        background: active ? 'var(--glass-light-strong)' : 'var(--glass-dark)',
        color: active ? 'var(--color-brand-primary)' : 'var(--color-content-inverse)',
      }}
    >
      {siteValue(children)}
    </button>
  );
}

export function HeroImageStage({
  resultImage,
  conceptImage,
  originalImage,
  imageAlt,
  showOriginal,
  isSaved,
  isDownloading,
  analysisOnly = false,
  sessionId,
  markers = [],
  activeMarkerId,
  onToggleOriginal,
  onToggleSaved,
  onDownload,
  onFullscreen,
  onExit,
  onMarkerClick,
  showSave = true,
  showActions = true,
  onImageError,
  mobile = false,
  embedded = false,
}: HeroImagePanelProps & { mobile?: boolean; embedded?: boolean }) {
  const { siteText, siteValue, siteDirection } = useSiteTranslation();
  const { t } = useSimpleTranslation();
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [selectedConcept, setSelectedConcept] = useState<string>();
  const showingConcept = !!conceptImage && selectedConcept === conceptImage && !showOriginal;
  const hasGeneratedImage = !analysisOnly && !!resultImage;
  const visibleMarkers = markers.filter((entry) => entry.marker);

  const handleShare = useCallback(async () => {
    const shareUrl = typeof window === 'undefined' ? '' : window.location.href;
    trackStudioResultAction({ action: 'share', session_id: sessionId || '' });
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('studio.result.v2.title', 'نتیجه طراحی'),
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShareState('copied');
        window.setTimeout(() => setShareState('idle'), 1800);
      }
    } catch {
      // Sharing can be cancelled by the user; no error state is needed.
    }
  }, [sessionId, t]);

  return (
    <div className="studio-hero-stage" dir={siteDirection()} data-actions={showActions}>
      {siteValue(resultImage ? (
        <AuthenticatedImage
          src={resultImage}
          alt={imageAlt?.result ?? siteValue(analysisOnly
            ? t('studio.result.v2.analysisOnly.originalAlt', 'عکس اصلی فضای شما')
            : t('studio.result.v2.hero.generatedAlt', 'تصویر بازطراحی‌شده فضای شما'))}
          skipAuth={resultImage.startsWith('data:')}
          className={`studio-hero-image ${(showOriginal || showingConcept) && hasGeneratedImage ? 'studio-hero-image-hidden' : ''}`}
          onError={onImageError}
          loading={embedded ? 'lazy' : undefined}
          aria-hidden={(showOriginal || showingConcept) && hasGeneratedImage ? true : undefined}
        />
      ) : (
        <div className="studio-hero-placeholder" role="img" aria-label={t('common.loading', 'در حال بارگذاری...')} />
      ))}

      {siteValue(hasGeneratedImage && conceptImage && (
        <AuthenticatedImage
          key={conceptImage}
          src={conceptImage}
          alt={t('studio.result.v2.concept', 'کانسپت اولیه')}
          className={`studio-hero-image ${showingConcept ? '' : 'studio-hero-image-hidden'}`}
          loading={embedded ? 'lazy' : 'eager'}
          decoding="async"
          aria-hidden={!showingConcept}
        />
      ))}

      {siteValue(hasGeneratedImage && originalImage && (
        <AuthenticatedImage
          src={originalImage}
          alt={imageAlt?.original ?? t('studio.result.v2.hero.originalAlt', 'تصویر قبل از بازطراحی')}
          skipAuth={originalImage.startsWith('data:')}
          className={`studio-hero-image studio-hero-original ${showOriginal ? '' : 'studio-hero-image-hidden'}`}
          loading={embedded ? 'lazy' : undefined}
          aria-hidden={embedded && !showOriginal ? true : undefined}
        />
      ))}

      <div className="studio-hero-scrim" aria-hidden="true" />

      {mobile && hasGeneratedImage && onFullscreen && (
        <button
          type="button"
          className="studio-hero-image-open"
          aria-label={t('studio.result.v2.fullscreenView', 'نمای تمام‌صفحه')}
          onClick={onFullscreen}
        />
      )}

      {(onExit || showActions) && <div className="studio-hero-toolbar studio-hero-toolbar-top">
        {onExit && <GlassButton onClick={onExit} ariaLabel={t('common.back', 'بازگشت')}>
          <ArrowRight size={20} />
        </GlassButton>}
        {showActions && <div className="studio-hero-toolbar-actions">
          {showSave && onToggleSaved && <GlassButton onClick={onToggleSaved} active={isSaved} ariaLabel={isSaved ? t('studio.result.v2.saved', 'ذخیره شده') : t('common.save', 'ذخیره')}>
            <Heart size={19} fill={isSaved ? 'currentColor' : 'none'} />
          </GlassButton>}
          {siteValue(!analysisOnly && onDownload && (
            <GlassButton onClick={onDownload} disabled={isDownloading} ariaLabel={t('common.download', 'دانلود')}>
              {siteValue(isDownloading ? <Loader2 size={19} className="animate-spin" /> : <Download size={19} />)}
            </GlassButton>
          ))}
          <GlassButton onClick={handleShare} ariaLabel={shareState === 'copied' ? t('common.copied', 'کپی شد') : t('common.share', 'اشتراک‌گذاری')}>
            <Share2 size={19} />
          </GlassButton>
        </div>}
      </div>}

      {siteValue(analysisOnly && (
        <div className="studio-hero-analysis-badge">
          <span>{t('studio.result.v2.analysisOnly.label', 'تحلیل اولیه فضا')}</span>
          <small>{t('studio.result.v2.analysisOnly.heroHint', 'تصویر بازطراحی در این جلسه تولید نشده است')}</small>
        </div>
      ))}

      {siteValue(hasGeneratedImage && originalImage && (
        <div className="studio-hero-before-after" role="group" aria-label={t('studio.result.v2.hero.compare', 'مقایسه قبل و بعد')}>
          <button
            type="button"
            className={!showOriginal && !showingConcept ? 'is-active' : ''}
            aria-pressed={!showOriginal && !showingConcept}
            onClick={() => {
              if (!embedded) trackStudioResultAction({ action: 'before_after', session_id: sessionId || '', view: 'after' });
              setSelectedConcept(undefined);
              onToggleOriginal(false);
            }}
          >
            {t('studio.result.v2.after', 'طرح جدید')}
          </button>
          {conceptImage && <button type="button" className={showingConcept ? 'is-active' : ''} aria-pressed={showingConcept}
            onClick={() => { onToggleOriginal(false); setSelectedConcept(conceptImage); }}>
            {t('studio.result.v2.concept', 'کانسپت اولیه')}
          </button>}
          <button
            type="button"
            className={showOriginal ? 'is-active' : ''}
            aria-pressed={showOriginal}
            onClick={() => {
              if (!embedded) trackStudioResultAction({ action: 'before_after', session_id: sessionId || '', view: 'before' });
              setSelectedConcept(undefined);
              onToggleOriginal(true);
            }}
          >
            {t('studio.result.v2.before', 'وضعیت موجود')}
          </button>
        </div>
      ))}

      {siteValue(hasGeneratedImage && onFullscreen && (
        <button type="button" className="studio-hero-fullscreen" onClick={onFullscreen}>
          <Maximize2 size={16} />
          <span>{t('studio.result.v2.fullscreenView', 'نمای تمام‌صفحه')}</span>
        </button>
      ))}

      {siteValue(hasGeneratedImage && !showOriginal && !showingConcept && visibleMarkers.length > 0 && (
        <div className="studio-hero-markers" aria-label={t('studio.result.v2.hero.markerLabel', 'نشانه‌های پیشنهادها')}>
          {siteValue(visibleMarkers.map((entry) => (
            <button
              type="button"
              key={entry.itemId}
              className="studio-hero-marker"
              style={{ left: `${entry.marker!.x * 100}%`, top: `${entry.marker!.y * 100}%` }}
              onClick={() => onMarkerClick?.(entry.itemId)}
              aria-pressed={activeMarkerId === undefined ? undefined : activeMarkerId === entry.itemId}
              aria-label={siteText("{{v0}} {{v1}}: {{v2}}", { v0: t('studio.result.v2.hero.marker', 'پیشنهاد'), v1: entry.number, v2: entry.label })}
            >
              <span>{siteValue(entry.number)}</span>
            </button>
          )))}
        </div>
      ))}

      {siteValue(!embedded && hasGeneratedImage && !showOriginal && !showingConcept && visibleMarkers.length > 0 && (
        <div className="studio-hero-marker-legend" aria-label={t('studio.result.v2.hero.legend', 'راهنمای پیشنهادها')}>
          {siteValue(visibleMarkers.map((entry) => (
            <button type="button" key={entry.itemId} onClick={() => onMarkerClick?.(entry.itemId)}>
              <span>{siteValue(entry.number)}</span>
              {siteValue(entry.label)}
            </button>
          )))}
        </div>
      ))}
    </div>
  );
}

export function DesktopHeroPanel(props: HeroImagePanelProps) {
  return (
    <div className="studio-desktop-hero">
      <HeroImageStage {...props} />
    </div>
  );
}

export function MobileHeroSection(props: HeroImagePanelProps) {
  return (
    <div className="studio-mobile-hero">
      <HeroImageStage {...props} mobile />
    </div>
  );
}
