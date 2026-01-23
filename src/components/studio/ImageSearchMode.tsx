/**
 * ImageSearchMode - Overlay for selecting a region to search in Google Lens
 *
 * Usage:
 * <ImageSearchMode
 *   isActive={isSearchMode}
 *   onCancel={() => setIsSearchMode(false)}
 *   onSearchComplete={handleLensSearch}
 *   imageRef={imageRef}
 *   containerRef={containerRef}
 * />
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Loader2 } from 'lucide-react';
import { useImageSelection } from '@/hooks/useImageSelection';
import { cropImageRegionAsync } from '@/utils/imageCrop';
import { apiUpload } from '@/utils/apiClient';
import { toast } from 'sonner';

interface ImageSearchModeProps {
  /** Whether search mode is active */
  isActive: boolean;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Callback when search completes (with public URL) */
  onSearchComplete: (url: string) => void;
  /** Ref to the image element to crop from */
  imageRef: React.RefObject<HTMLImageElement>;
  /** Container element for the overlay */
  containerRef: React.RefObject<HTMLElement>;
}

export function ImageSearchMode({
  isActive,
  onCancel,
  onSearchComplete,
  imageRef,
  containerRef,
}: ImageSearchModeProps) {
  const [isUploading, setIsUploading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const {
    isDrawing,
    normalizedSelection,
    startSelectionMode,
    cancelSelectionMode,
    handlers,
  } = useImageSelection({
    containerRef,
    minSize: 50,
  });

  // Sync selection mode with component active state
  useEffect(() => {
    if (isActive) {
      startSelectionMode();
    } else {
      cancelSelectionMode();
    }
  }, [isActive, startSelectionMode, cancelSelectionMode]);

  // Handle search button click
  const handleSearch = useCallback(async () => {
    try {
      if (!normalizedSelection || !imageRef.current) {
        toast.error('لطفاً ناحیه‌ای را انتخاب کنید');
        return;
      }

      setIsUploading(true);

      // Step 1: Crop the image
      const cropResult = await cropImageRegionAsync(imageRef.current, normalizedSelection);

      if (!cropResult.success) {
        toast.error(cropResult.error);
        setIsUploading(false);
        return;
      }

      // Step 2: Create a File from the blob
      const file = new File([cropResult.blob], `lens-search-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      // Step 3: Upload to backend for temporary public URL
      const uploadResult = await apiUpload<{ url: string }>(
        '/v1/utils/temp-image/',
        file,
        'image'
      );

      setIsUploading(false);

      if (!uploadResult.success) {
        // Handle rate limit
        if (uploadResult.statusCode === 429) {
          toast.error('تعداد درخواست‌ها بیش از حد مجاز. کمی صبر کنید');
        } else {
          toast.error(uploadResult.error || 'خطا در آپلود تصویر');
        }
        return;
      }

      if (!uploadResult.data?.url) {
        toast.error('خطا در دریافت آدرس تصویر');
        return;
      }

      // Step 4: Open Google Lens
      const lensUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(uploadResult.data.url)}`;

      const newWindow = window.open(lensUrl, '_blank');

      if (!newWindow) {
        // Popup was blocked - show a clickable link
        toast.error(
          <div className="flex flex-col gap-2">
            <span>لطفاً پاپ‌آپ را مجاز کنید</span>
            <a
              href={lensUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              باز کردن گوگل لنز
            </a>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.success('گوگل لنز در تب جدید باز شد');
      }

      onSearchComplete(uploadResult.data.url);
    } catch (error) {
      console.error('[ImageSearchMode] Search failed:', error);
      toast.error('خطای ناشناخته در جستجو');
      setIsUploading(false);
    }
  }, [normalizedSelection, imageRef, onSearchComplete]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[100] cursor-crosshair"
        {...handlers}
      >
        {/* Dark overlay with cutout for selection */}
        <div className="absolute inset-0 bg-black/50 pointer-events-none">
          {normalizedSelection && (
            <div
              className="absolute bg-transparent"
              style={{
                left: normalizedSelection.x,
                top: normalizedSelection.y,
                width: normalizedSelection.width,
                height: normalizedSelection.height,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              }}
            />
          )}
        </div>

        {/* Selection rectangle */}
        {normalizedSelection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`absolute border-2 pointer-events-none ${
              isDrawing ? 'border-dashed border-white/70' : 'border-solid border-white'
            }`}
            style={{
              left: normalizedSelection.x,
              top: normalizedSelection.y,
              width: normalizedSelection.width,
              height: normalizedSelection.height,
            }}
          >
            {/* Corner handles (visual only) */}
            {!isDrawing && (
              <>
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-sm" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-sm" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-sm" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-sm" />
              </>
            )}
          </motion.div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center pointer-events-auto">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full text-white text-sm font-medium hover:bg-white/20 transition-all active:scale-95"
          >
            <X size={18} />
            <span>لغو</span>
          </button>

          <span className="text-white text-sm font-bold tracking-wide">
            جستجو در گوگل
          </span>

          <div className="w-[72px]" /> {/* Spacer for centering */}
        </div>

        {/* Bottom instruction / search button */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4 pointer-events-auto">
          {!normalizedSelection ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-3 bg-black/40 backdrop-blur-xl rounded-full border border-white/10"
            >
              <span className="text-white text-sm font-medium">
                📍 یک کادر دور محصول موردنظر بکشید
              </span>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleSearch}
              disabled={isUploading}
              className={`flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-sm hover:bg-white/90 transition-all active:scale-95 shadow-2xl ${
                isUploading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>در حال آماده‌سازی...</span>
                </>
              ) : (
                <>
                  <Search size={20} />
                  <span>تأیید و جستجو</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
