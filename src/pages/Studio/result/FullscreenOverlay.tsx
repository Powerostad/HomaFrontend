/**
 * Fullscreen Overlay — Quiet Luxury Redesign
 * Immersive image viewer with refined glass controls.
 */
import { X, Download, Bookmark, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { useSimpleTranslation } from './types';

const FONT = 'var(--font-family-vazirmatn)';

interface FullscreenOverlayProps {
  resultImage: string;
  originalImage: string | null;
  showOriginal: boolean;
  isSaved: boolean;
  isDownloading: boolean;
  onClose: () => void;
  onToggleOriginal: (show: boolean) => void;
  onToggleSaved: () => void;
  onDownload: () => void;
}

export function FullscreenOverlay({
  resultImage,
  originalImage,
  showOriginal,
  isSaved,
  isDownloading,
  onClose,
  onToggleOriginal,
  onToggleSaved,
  onDownload,
}: FullscreenOverlayProps) {
  const { t } = useSimpleTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--editorial-charcoal)' }}
      onClick={onClose}
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.y) > 100) onClose();
        }}
        className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Images */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4 md:p-8">
          <AuthenticatedImage
            src={resultImage}
            alt="نتیجه طراحی"
            className={`max-w-full max-h-full object-contain transition-all duration-700 ${showOriginal ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'}`}
          />
          {originalImage && (
            <AuthenticatedImage
              src={originalImage}
              alt="تصویر اصلی"
              skipAuth={originalImage.startsWith('data:')}
              className={`absolute inset-0 m-auto max-w-full max-h-full object-contain transition-all duration-700 ${showOriginal ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'}`}
            />
          )}
        </div>

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.45) 100%)',
          }}
        />

        {/* Drag handle */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{
            width: '40px',
            height: '4px',
            borderRadius: '100px',
            background: 'rgba(255,255,255,0.2)',
          }}
        />

        {/* Top Actions */}
        <div className="absolute top-0 left-0 right-0 p-6 md:p-8 flex justify-between items-center z-50">
          <button
            onClick={onClose}
            className="flex items-center justify-center transition-all duration-200 active:scale-90"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.15)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.9)',
            }}
            aria-label="بستن"
          >
            <X size={20} />
          </button>

          <div className="flex gap-2.5">
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="flex items-center justify-center transition-all duration-200 active:scale-90"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.15)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
                opacity: isDownloading ? 0.4 : 1,
                cursor: isDownloading ? 'not-allowed' : 'pointer',
              }}
              aria-label="دانلود"
            >
              {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
            <button
              onClick={onToggleSaved}
              className="flex items-center justify-center transition-all duration-200 active:scale-90"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: isSaved ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.15)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: isSaved ? 'var(--accent)' : 'rgba(255,255,255,0.9)',
              }}
              aria-label="ذخیره"
            >
              <Bookmark size={18} className={isSaved ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-3 z-50">
          {/* Toggle */}
          <div
            className="flex items-center"
            style={{
              padding: '3px',
              borderRadius: '100px',
              background: 'rgba(0,0,0,0.2)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <button
              onClick={() => onToggleOriginal(true)}
              className="transition-all duration-400"
              style={{
                padding: '8px 24px',
                borderRadius: '100px',
                background: showOriginal ? 'rgba(255,255,255,0.92)' : 'transparent',
                color: showOriginal ? 'var(--foreground)' : 'rgba(255,255,255,0.45)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: FONT,
              }}
            >
              {t('studio.result.before', 'قبل')}
            </button>
            <button
              onClick={() => onToggleOriginal(false)}
              className="transition-all duration-400"
              style={{
                padding: '8px 24px',
                borderRadius: '100px',
                background: !showOriginal ? 'rgba(255,255,255,0.92)' : 'transparent',
                color: !showOriginal ? 'var(--foreground)' : 'rgba(255,255,255,0.45)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: FONT,
              }}
            >
              {t('studio.result.after', 'بعد')}
            </button>
          </div>

          <span
            style={{
              fontSize: '9px',
              fontFamily: FONT,
              fontWeight: 'var(--font-weight-regular)',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.2em',
            }}
          >
            بکشید برای بستن
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
