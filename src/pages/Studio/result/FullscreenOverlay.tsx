/**
 * FullscreenOverlay - Fullscreen image viewer with dark backdrop
 *
 * Before/after toggle button, close button (X) top corner.
 * Uses Motion for enter/exit animation.
 * Swipe to dismiss on mobile.
 */
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

interface FullscreenOverlayProps {
  isOpen: boolean;
  resultImage: string;
  originalImage: string | null;
  showOriginal: boolean;
  onClose: () => void;
  onToggleOriginal: (show: boolean) => void;
}

export function FullscreenOverlay({
  isOpen,
  resultImage,
  originalImage,
  showOriginal,
  onClose,
  onToggleOriginal,
}: FullscreenOverlayProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-modal flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.95)' }}
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
              <ImageWithFallback
                src={resultImage}
                alt={t('studio.result.v2.fullscreen.result', 'نتیجه طراحی')}
                className={`max-w-full max-h-full object-contain transition-all duration-700 ${
                  showOriginal ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'
                }`}
              />
              {originalImage &&
                (originalImage.startsWith('data:') ? (
                  <img
                    src={originalImage}
                    alt={t('studio.result.v2.fullscreen.original', 'تصویر اصلی')}
                    className={`absolute inset-0 m-auto max-w-full max-h-full object-contain transition-all duration-700 ${
                      showOriginal ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
                    }`}
                  />
                ) : (
                  <ImageWithFallback
                    src={originalImage}
                    alt={t('studio.result.v2.fullscreen.original', 'تصویر اصلی')}
                    className={`absolute inset-0 m-auto max-w-full max-h-full object-contain transition-all duration-700 ${
                      showOriginal ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
                    }`}
                  />
                ))}
            </div>

            {/* Close button */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-start items-center z-50">
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
                aria-label={t('common.close', 'بستن')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Bottom: before/after toggle + swipe hint */}
            <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-3 z-50">
              {originalImage && (
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
                      color: showOriginal ? 'var(--content-primary)' : 'rgba(255,255,255,0.45)',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
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
                      color: !showOriginal ? 'var(--content-primary)' : 'rgba(255,255,255,0.45)',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {t('studio.result.after', 'بعد')}
                  </button>
                </div>
              )}

              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.2em',
                }}
              >
                {t('studio.result.v2.fullscreen.swipeHint', 'بکشید برای بستن')}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
