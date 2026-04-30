/**
 * Hero Image Panel — Editorial / Zara Home Redesign
 *
 * Full-bleed image panel with minimal floating controls.
 * Clean, elegant hero with no budget overlays — budget info moved to header.
 * Before/After toggle is refined and unobtrusive.
 */
import {
  ArrowRight,
  Heart,
  Download,
  Share2,
  Maximize2,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { useSimpleTranslation, trackStudioResultAction } from './types';

const FONT = 'var(--font-family-vazirmatn)';

interface HeroImagePanelProps {
  resultImage: string;
  originalImage: string | null;
  showOriginal: boolean;
  isSaved: boolean;
  isDownloading: boolean;
  isNoImageResult?: boolean;
  sessionId?: string;
  totalPrice?: number;
  onToggleOriginal: (show: boolean) => void;
  onToggleSaved: () => void;
  onDownload: () => void;
  onFullscreen: () => void;
  onExit: () => void;
}

/* Glass Button Utility */
function GlassButton({
  onClick,
  disabled,
  active,
  children,
  ariaLabel,
  size = 44,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center transition-all duration-200 active:scale-90"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: active ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.15)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: active ? 'var(--accent)' : 'rgba(255,255,255,0.9)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

/* ─── Desktop Hero ─── */
export function DesktopHeroPanel({
  resultImage,
  originalImage,
  showOriginal,
  isSaved,
  isDownloading,
  isNoImageResult,
  sessionId,
  onToggleOriginal,
  onToggleSaved,
  onDownload,
  onExit,
}: HeroImagePanelProps) {
  const { t } = useSimpleTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Preload result image before rendering
  useEffect(() => {
    if (!resultImage) return;
    setImageLoaded(false);
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true);
    img.src = resultImage;
  }, [resultImage]);

  return (
    <div
      className="hidden md:block flex-1 h-full relative overflow-hidden"
      style={{ background: 'var(--editorial-hairline)' }}
    >
      {/* Loading overlay while preloading */}
      {resultImage && !imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--editorial-hairline)] z-10">
          <div className="w-8 h-8 border-2 border-[var(--editorial-taupe)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {/* Result Image */}
      {resultImage ? (
        <AuthenticatedImage
          src={resultImage}
          alt="نتیجه طراحی"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${showOriginal ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'}`}
        />
      ) : (
        <div className="absolute inset-0 image-loading" />
      )}
      {/* Original Image */}
      {originalImage && (
        <AuthenticatedImage
          src={originalImage}
          alt="تصویر اصلی"
          skipAuth={originalImage.startsWith('data:')}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${showOriginal ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'}`}
        />
      )}

      {/* Controls */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar */}
        <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-start pointer-events-auto">
          <GlassButton onClick={onExit} ariaLabel="بازگشت">
            <ArrowRight size={20} />
          </GlassButton>
          <div className="flex gap-2.5">
            <GlassButton
              onClick={() => {
                if (!isSaved) trackStudioResultAction({ action: 'save', session_id: sessionId || '' });
                onToggleSaved();
              }}
              active={isSaved}
              ariaLabel={isSaved ? 'ذخیره شده' : 'ذخیره'}
            >
              <Heart size={18} className={isSaved ? 'fill-current' : ''} />
            </GlassButton>
            {!isNoImageResult && (
              <GlassButton
                onClick={onDownload}
                disabled={isDownloading}
                ariaLabel="دانلود"
              >
                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              </GlassButton>
            )}
            <GlassButton onClick={() => {}} ariaLabel="اشتراک‌گذاری">
              <Share2 size={18} />
            </GlassButton>
          </div>
        </div>

        {/* Bottom Controls — Editorial Before/After */}
        {!isNoImageResult && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center">
          <div
            className="flex items-center"
            style={{
              padding: '3px',
              background: 'rgba(255,255,255,0.70)',
              backdropFilter: 'blur(var(--blur-lg))',
              WebkitBackdropFilter: 'blur(var(--blur-lg))',
              border: '1px solid rgba(255,255,255,0.40)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            <button
              onClick={() => {
                trackStudioResultAction({ action: 'before_after', session_id: sessionId || '' });
                onToggleOriginal(false);
              }}
              className="transition-all duration-300"
              style={{
                padding: '8px var(--spacing-md)',
                background: !showOriginal ? 'var(--editorial-charcoal)' : 'transparent',
                color: !showOriginal ? 'var(--editorial-stone)' : 'var(--editorial-charcoal)',
                fontSize: 'var(--text-caption-size)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: FONT,
              }}
            >
              {t('studio.result.after', 'طرح استودیو')}
            </button>
            <button
              onClick={() => {
                trackStudioResultAction({ action: 'before_after', session_id: sessionId || '' });
                onToggleOriginal(true);
              }}
              className="transition-all duration-300"
              style={{
                padding: '8px var(--spacing-md)',
                background: showOriginal ? 'var(--editorial-charcoal)' : 'transparent',
                color: showOriginal ? 'var(--editorial-stone)' : 'var(--editorial-charcoal)',
                fontSize: 'var(--text-caption-size)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: FONT,
              }}
            >
              {t('studio.result.before', 'وضعیت موجود')}
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

/* ─── Mobile Hero ─── */
export function MobileHeroSection({
  resultImage,
  originalImage,
  showOriginal,
  isSaved,
  isDownloading,
  isNoImageResult,
  sessionId,
  onToggleSaved,
  onDownload,
  onFullscreen,
  onExit,
}: HeroImagePanelProps) {
  const { t } = useSimpleTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Preload result image before rendering
  useEffect(() => {
    if (!resultImage) return;
    setImageLoaded(false);
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true);
    img.src = resultImage;
  }, [resultImage]);

  return (
    <div className="relative w-full" style={{ height: '60vh', minHeight: '360px' }}>
      {/* Loading overlay while preloading */}
      {resultImage && !imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--editorial-hairline)] z-10">
          <div className="w-8 h-8 border-2 border-[var(--editorial-taupe)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {/* Images */}
      {resultImage ? (
        <AuthenticatedImage
          src={resultImage}
          alt="نتیجه طراحی"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
        />
      ) : (
        <div className="absolute inset-0 image-loading" />
      )}
      {originalImage && (
        <AuthenticatedImage
          src={originalImage}
          alt="تصویر اصلی"
          skipAuth={originalImage.startsWith('data:')}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${showOriginal ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Tap to fullscreen */}
      {!isNoImageResult && (
        <button
          className="absolute inset-0 z-10"
          onClick={onFullscreen}
          aria-label="تمام‌صفحه"
        />
      )}

      {/* Top actions */}
      <div className="absolute top-5 left-0 right-0 px-5 flex justify-between items-center z-20">
        <GlassButton onClick={onExit} ariaLabel="بازگشت" size={38}>
          <ArrowRight size={18} />
        </GlassButton>
        <div className="flex gap-2">
          <GlassButton
            onClick={() => {
              if (!isSaved) trackStudioResultAction({ action: 'save', session_id: sessionId || '' });
              onToggleSaved();
            }}
            active={isSaved}
            ariaLabel={isSaved ? 'ذخیره شده' : 'ذخیره'}
            size={38}
          >
            <Heart size={16} className={isSaved ? 'fill-current' : ''} />
          </GlassButton>
          {!isNoImageResult && (
            <GlassButton
              onClick={onDownload}
              disabled={isDownloading}
              ariaLabel="دانلود"
              size={38}
            >
              {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            </GlassButton>
          )}
        </div>
      </div>

      {/* Bottom fullscreen hint */}
      {!isNoImageResult && (
      <button
        onClick={onFullscreen}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 active:scale-95 transition-all duration-200"
      >
        <div
          className="flex items-center gap-2 animate-fade-in"
          style={{
            padding: '8px 18px',
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Maximize2 size={12} style={{ color: 'rgba(255,255,255,0.7)' }} />
          <span
            style={{
              fontSize: '10px',
              fontFamily: FONT,
              fontWeight: 'var(--font-weight-semibold)',
              color: 'rgba(255,255,255,0.8)',
              letterSpacing: '0.06em',
            }}
          >
            {t('studio.result.fullscreenView', 'نمای تمام‌صفحه')}
          </span>
        </div>
      </button>
      )}
    </div>
  );
}
