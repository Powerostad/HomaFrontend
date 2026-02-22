/**
 * HeroImagePanel -- Editorial before/after hero image
 *
 * Full-bleed image with smooth 700ms crossfade between redesigned and original.
 * Desktop: full-bleed filling available space, side fade overlay.
 * Mobile: 65vh height with bottom fade.
 * Floating glass buttons: save (Heart), download (Download), exit (X).
 * Before/after frosted glass pill at bottom with labels.
 */
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Download, X, Loader2 } from 'lucide-react';
import { ImageWithFallback } from '@components/figma/ImageWithFallback';
import type { DownloadState } from './useStudioResult';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HeroImagePanelProps {
  redesignedImageUrl: string;
  roomImageUrl: string | null;
  showOriginal: boolean;
  onToggleOriginal: (show: boolean) => void;
  onSave: () => void;
  onDownload: () => void;
  onExit: () => void;
  onFullscreen: () => void;
  isSaved: boolean;
  downloadState: DownloadState;
}

// ---------------------------------------------------------------------------
// Glass Button utility
// ---------------------------------------------------------------------------

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
        width: size,
        height: size,
        borderRadius: '50%',
        background: active ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.15)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: active ? 'var(--color-editorial-charcoal)' : 'rgba(255,255,255,0.9)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Before/After toggle pill
// ---------------------------------------------------------------------------

function BeforeAfterPill({
  showOriginal,
  onToggle,
  variant = 'light',
}: {
  showOriginal: boolean;
  onToggle: (show: boolean) => void;
  variant?: 'light' | 'dark';
}) {
  const { t } = useTranslation();

  const isLight = variant === 'light';
  const pillBg = isLight
    ? 'rgba(255,255,255,0.70)'
    : 'rgba(0,0,0,0.25)';
  const pillBorder = isLight
    ? '1px solid rgba(255,255,255,0.40)'
    : '1px solid rgba(255,255,255,0.08)';
  const activeBg = isLight
    ? 'var(--color-editorial-charcoal)'
    : 'rgba(255,255,255,0.9)';
  const activeColor = isLight
    ? 'var(--color-editorial-stone)'
    : 'var(--color-editorial-charcoal)';
  const inactiveColor = isLight
    ? 'var(--color-editorial-charcoal)'
    : 'rgba(255,255,255,0.85)';

  return (
    <div
      className="flex items-center"
      style={{
        padding: 3,
        background: pillBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: pillBorder,
        boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.04)' : 'none',
      }}
    >
      <button
        onClick={() => onToggle(false)}
        className="transition-all duration-300"
        style={{
          padding: '8px 16px',
          background: !showOriginal ? activeBg : 'transparent',
          color: !showOriginal ? activeColor : inactiveColor,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {t('studio.result.v2.after', 'بعد')}
      </button>
      <button
        onClick={() => onToggle(true)}
        className="transition-all duration-300"
        style={{
          padding: '8px 16px',
          background: showOriginal ? activeBg : 'transparent',
          color: showOriginal ? activeColor : inactiveColor,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {t('studio.result.v2.before', 'قبل')}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image layer with Motion crossfade
// ---------------------------------------------------------------------------

function CrossfadeImage({
  src,
  alt,
  visible,
}: {
  src: string;
  alt: string;
  visible: boolean;
}) {
  const isDataUrl = src.startsWith('data:');

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {isDataUrl ? (
            <img
              src={src}
              alt={alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <ImageWithFallback
              src={src}
              alt={alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function HeroImagePanel({
  redesignedImageUrl,
  roomImageUrl,
  showOriginal,
  onToggleOriginal,
  onSave,
  onDownload,
  onExit,
  onFullscreen,
  isSaved,
  downloadState,
}: HeroImagePanelProps) {
  const { t } = useTranslation();
  const isDownloading = downloadState === 'preparing';

  return (
    <>
      {/* ---- Desktop: full-bleed filling available space ---- */}
      <div
        className="hidden md:flex relative w-full flex-1 overflow-hidden"
        style={{ minHeight: 480, background: 'var(--color-editorial-hairline)' }}
      >
        {/* Redesigned image (always mounted) */}
        <CrossfadeImage
          src={redesignedImageUrl}
          alt={t('studio.result.v2.resultAlt', 'نتیجه طراحی')}
          visible={!showOriginal}
        />

        {/* Original image */}
        {roomImageUrl && (
          <CrossfadeImage
            src={roomImageUrl}
            alt={t('studio.result.v2.originalAlt', 'تصویر اصلی')}
            visible={showOriginal}
          />
        )}

        {/* Side fade overlay (RTL: fades on the start side) */}
        <div
          className="absolute inset-y-0 start-0 w-48 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, transparent, rgba(247,247,245,0.6))',
          }}
        />

        {/* Click to fullscreen */}
        <button
          className="absolute inset-0 z-10 cursor-zoom-in"
          onClick={onFullscreen}
          aria-label={t('studio.result.v2.fullscreen', 'تمام‌صفحه')}
        />

        {/* Controls overlay */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Top bar: exit (start) + save/download (end) */}
          <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-start pointer-events-auto">
            <GlassButton
              onClick={onExit}
              ariaLabel={t('studio.result.v2.exit', 'خروج')}
            >
              <X size={20} />
            </GlassButton>

            <div className="flex gap-2.5">
              <GlassButton
                onClick={onSave}
                active={isSaved}
                ariaLabel={isSaved
                  ? t('studio.result.v2.saved', 'ذخیره شده')
                  : t('studio.result.v2.save', 'ذخیره')
                }
              >
                <Heart size={18} className={isSaved ? 'fill-current' : ''} />
              </GlassButton>
              <GlassButton
                onClick={onDownload}
                disabled={isDownloading}
                ariaLabel={t('studio.result.v2.download', 'دانلود')}
              >
                {isDownloading
                  ? <Loader2 size={18} className="animate-spin" />
                  : <Download size={18} />
                }
              </GlassButton>
            </div>
          </div>

          {/* Bottom: before/after pill */}
          {roomImageUrl && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto">
              <BeforeAfterPill
                showOriginal={showOriginal}
                onToggle={onToggleOriginal}
                variant="light"
              />
            </div>
          )}
        </div>
      </div>

      {/* ---- Mobile: 65vh height with bottom fade ---- */}
      <div
        className="md:hidden relative w-full overflow-hidden"
        style={{
          height: '65vh',
          minHeight: 340,
          background: 'var(--color-editorial-hairline)',
        }}
      >
        {/* Redesigned image */}
        <CrossfadeImage
          src={redesignedImageUrl}
          alt={t('studio.result.v2.resultAlt', 'نتیجه طراحی')}
          visible={!showOriginal}
        />

        {/* Original image */}
        {roomImageUrl && (
          <CrossfadeImage
            src={roomImageUrl}
            alt={t('studio.result.v2.originalAlt', 'تصویر اصلی')}
            visible={showOriginal}
          />
        )}

        {/* Bottom fade gradient */}
        <div
          className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, var(--color-surface-page), transparent)',
          }}
        />

        {/* Click to fullscreen */}
        <button
          className="absolute inset-0 z-10"
          onClick={onFullscreen}
          aria-label={t('studio.result.v2.fullscreen', 'تمام‌صفحه')}
        />

        {/* Top action buttons */}
        <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-20">
          <GlassButton
            onClick={onExit}
            ariaLabel={t('studio.result.v2.exit', 'خروج')}
            size={38}
          >
            <X size={18} />
          </GlassButton>

          <div className="flex gap-2">
            <GlassButton
              onClick={onSave}
              active={isSaved}
              ariaLabel={isSaved
                ? t('studio.result.v2.saved', 'ذخیره شده')
                : t('studio.result.v2.save', 'ذخیره')
              }
              size={38}
            >
              <Heart size={16} className={isSaved ? 'fill-current' : ''} />
            </GlassButton>
            <GlassButton
              onClick={onDownload}
              disabled={isDownloading}
              ariaLabel={t('studio.result.v2.download', 'دانلود')}
              size={38}
            >
              {isDownloading
                ? <Loader2 size={16} className="animate-spin" />
                : <Download size={16} />
              }
            </GlassButton>
          </div>
        </div>

        {/* Bottom: before/after pill */}
        {roomImageUrl && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
            <BeforeAfterPill
              showOriginal={showOriginal}
              onToggle={onToggleOriginal}
              variant="dark"
            />
          </div>
        )}
      </div>
    </>
  );
}
