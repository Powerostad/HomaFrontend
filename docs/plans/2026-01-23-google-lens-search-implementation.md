# Google Lens Search Feature - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to draw a selection box on AI-generated Studio images and search for similar products via Google Lens.

**Architecture:** Frontend adds a selection mode overlay with canvas-based cropping. Cropped image uploads to a new backend endpoint that returns a temporary public URL. Frontend redirects to Google Lens with that URL.

**Tech Stack:** React + TypeScript, Canvas API for cropping, Motion for animations, existing apiUpload for backend communication.

---

## Task 1: Create Image Crop Utility

**Files:**
- Create: `src/utils/imageCrop.ts`

**Step 1: Create the crop utility file**

```typescript
/**
 * Image cropping utility for Google Lens search feature
 * Uses Canvas API to crop a region from an image element
 */

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropResult {
  success: true;
  blob: Blob;
} | {
  success: false;
  error: string;
}

/**
 * Crop a region from an image element
 * Handles coordinate scaling between display size and natural image size
 *
 * @param imageElement - The HTMLImageElement to crop from
 * @param region - The crop region in DISPLAY coordinates (what user sees)
 * @param quality - JPEG quality (0-1), default 0.85
 */
export function cropImageRegion(
  imageElement: HTMLImageElement,
  region: CropRegion,
  quality: number = 0.85
): CropResult {
  try {
    // Get scale factors between display and natural size
    const displayWidth = imageElement.clientWidth;
    const displayHeight = imageElement.clientHeight;
    const naturalWidth = imageElement.naturalWidth;
    const naturalHeight = imageElement.naturalHeight;

    if (!naturalWidth || !naturalHeight) {
      return { success: false, error: 'تصویر هنوز بارگذاری نشده است' };
    }

    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;

    // Convert display coordinates to natural image coordinates
    const naturalRegion: CropRegion = {
      x: Math.round(region.x * scaleX),
      y: Math.round(region.y * scaleY),
      width: Math.round(region.width * scaleX),
      height: Math.round(region.height * scaleY),
    };

    // Clamp to image bounds
    naturalRegion.x = Math.max(0, Math.min(naturalRegion.x, naturalWidth - 1));
    naturalRegion.y = Math.max(0, Math.min(naturalRegion.y, naturalHeight - 1));
    naturalRegion.width = Math.min(naturalRegion.width, naturalWidth - naturalRegion.x);
    naturalRegion.height = Math.min(naturalRegion.height, naturalHeight - naturalRegion.y);

    // Validate minimum size (50x50 in natural coordinates)
    if (naturalRegion.width < 50 || naturalRegion.height < 50) {
      return { success: false, error: 'لطفاً ناحیه بزرگ‌تری انتخاب کنید' };
    }

    // Create canvas and crop
    const canvas = document.createElement('canvas');
    canvas.width = naturalRegion.width;
    canvas.height = naturalRegion.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { success: false, error: 'خطا در پردازش تصویر' };
    }

    // Draw cropped region
    ctx.drawImage(
      imageElement,
      naturalRegion.x,
      naturalRegion.y,
      naturalRegion.width,
      naturalRegion.height,
      0,
      0,
      naturalRegion.width,
      naturalRegion.height
    );

    // Convert to blob synchronously using toBlob with callback wrapper
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ success: true, blob });
          } else {
            resolve({ success: false, error: 'خطا در تبدیل تصویر' });
          }
        },
        'image/jpeg',
        quality
      );
    }) as unknown as CropResult;
  } catch (error) {
    console.error('[cropImageRegion] Error:', error);
    return { success: false, error: 'خطا در برش تصویر' };
  }
}

/**
 * Async version of cropImageRegion that properly returns a Promise
 */
export async function cropImageRegionAsync(
  imageElement: HTMLImageElement,
  region: CropRegion,
  quality: number = 0.85
): Promise<CropResult> {
  try {
    // Get scale factors between display and natural size
    const displayWidth = imageElement.clientWidth;
    const displayHeight = imageElement.clientHeight;
    const naturalWidth = imageElement.naturalWidth;
    const naturalHeight = imageElement.naturalHeight;

    if (!naturalWidth || !naturalHeight) {
      return { success: false, error: 'تصویر هنوز بارگذاری نشده است' };
    }

    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;

    // Convert display coordinates to natural image coordinates
    const naturalRegion: CropRegion = {
      x: Math.round(region.x * scaleX),
      y: Math.round(region.y * scaleY),
      width: Math.round(region.width * scaleX),
      height: Math.round(region.height * scaleY),
    };

    // Clamp to image bounds
    naturalRegion.x = Math.max(0, Math.min(naturalRegion.x, naturalWidth - 1));
    naturalRegion.y = Math.max(0, Math.min(naturalRegion.y, naturalHeight - 1));
    naturalRegion.width = Math.min(naturalRegion.width, naturalWidth - naturalRegion.x);
    naturalRegion.height = Math.min(naturalRegion.height, naturalHeight - naturalRegion.y);

    // Validate minimum size
    if (naturalRegion.width < 50 || naturalRegion.height < 50) {
      return { success: false, error: 'لطفاً ناحیه بزرگ‌تری انتخاب کنید' };
    }

    // Create canvas and crop
    const canvas = document.createElement('canvas');
    canvas.width = naturalRegion.width;
    canvas.height = naturalRegion.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { success: false, error: 'خطا در پردازش تصویر' };
    }

    ctx.drawImage(
      imageElement,
      naturalRegion.x,
      naturalRegion.y,
      naturalRegion.width,
      naturalRegion.height,
      0,
      0,
      naturalRegion.width,
      naturalRegion.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ success: true, blob });
          } else {
            resolve({ success: false, error: 'خطا در تبدیل تصویر' });
          }
        },
        'image/jpeg',
        quality
      );
    });
  } catch (error) {
    console.error('[cropImageRegionAsync] Error:', error);
    return { success: false, error: 'خطا در برش تصویر' };
  }
}
```

**Step 2: Verify the file was created correctly**

Run: `cat src/utils/imageCrop.ts | head -20`
Expected: Shows the file header and CropRegion interface

**Step 3: Commit**

```bash
git add src/utils/imageCrop.ts
git commit -m "feat(studio): add image crop utility for Google Lens search"
```

---

## Task 2: Create Selection Hook

**Files:**
- Create: `src/hooks/useImageSelection.ts`

**Step 1: Create the selection hook**

```typescript
/**
 * Hook for managing image selection/drawing state
 * Handles mouse/touch interactions for drawing a selection rectangle
 */

import { useState, useCallback, useRef, type RefObject } from 'react';

export interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseImageSelectionOptions {
  /** Minimum selection size in pixels (display coordinates) */
  minSize?: number;
  /** Container ref to get relative coordinates */
  containerRef: RefObject<HTMLElement>;
}

interface UseImageSelectionReturn {
  /** Whether selection mode is active */
  isSelecting: boolean;
  /** Whether user is currently drawing (mouse/touch down) */
  isDrawing: boolean;
  /** Current selection rectangle (raw coordinates) */
  selection: SelectionRect | null;
  /** Normalized selection (x, y, width, height - always positive) */
  normalizedSelection: NormalizedRect | null;
  /** Start selection mode */
  startSelectionMode: () => void;
  /** Cancel selection mode */
  cancelSelectionMode: () => void;
  /** Clear current selection without exiting mode */
  clearSelection: () => void;
  /** Mouse/touch event handlers */
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

export function useImageSelection(
  options: UseImageSelectionOptions
): UseImageSelectionReturn {
  const { minSize = 50, containerRef } = options;

  const [isSelecting, setIsSelecting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selection, setSelection] = useState<SelectionRect | null>(null);

  const drawingRef = useRef(false);

  // Get coordinates relative to container
  const getRelativeCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const container = containerRef.current;
      if (!container) return null;

      const rect = container.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [containerRef]
  );

  // Normalize selection to always have positive width/height
  const normalizedSelection: NormalizedRect | null = selection
    ? {
        x: Math.min(selection.startX, selection.endX),
        y: Math.min(selection.startY, selection.endY),
        width: Math.abs(selection.endX - selection.startX),
        height: Math.abs(selection.endY - selection.startY),
      }
    : null;

  const startSelectionMode = useCallback(() => {
    setIsSelecting(true);
    setSelection(null);
  }, []);

  const cancelSelectionMode = useCallback(() => {
    setIsSelecting(false);
    setIsDrawing(false);
    setSelection(null);
    drawingRef.current = false;
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsDrawing(false);
    drawingRef.current = false;
  }, []);

  // Mouse handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting) return;
      e.preventDefault();

      const coords = getRelativeCoords(e.clientX, e.clientY);
      if (!coords) return;

      drawingRef.current = true;
      setIsDrawing(true);
      setSelection({
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
      });
    },
    [isSelecting, getRelativeCoords]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawingRef.current || !selection) return;
      e.preventDefault();

      const coords = getRelativeCoords(e.clientX, e.clientY);
      if (!coords) return;

      setSelection((prev) =>
        prev ? { ...prev, endX: coords.x, endY: coords.y } : null
      );
    },
    [selection, getRelativeCoords]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault();

      drawingRef.current = false;
      setIsDrawing(false);

      // Check minimum size
      if (normalizedSelection) {
        if (
          normalizedSelection.width < minSize ||
          normalizedSelection.height < minSize
        ) {
          // Selection too small - clear it
          setSelection(null);
        }
      }
    },
    [normalizedSelection, minSize]
  );

  // Touch handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isSelecting || e.touches.length !== 1) return;
      e.preventDefault();

      const touch = e.touches[0];
      const coords = getRelativeCoords(touch.clientX, touch.clientY);
      if (!coords) return;

      drawingRef.current = true;
      setIsDrawing(true);
      setSelection({
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
      });
    },
    [isSelecting, getRelativeCoords]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!drawingRef.current || !selection || e.touches.length !== 1) return;
      e.preventDefault();

      const touch = e.touches[0];
      const coords = getRelativeCoords(touch.clientX, touch.clientY);
      if (!coords) return;

      setSelection((prev) =>
        prev ? { ...prev, endX: coords.x, endY: coords.y } : null
      );
    },
    [selection, getRelativeCoords]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault();

      drawingRef.current = false;
      setIsDrawing(false);

      // Check minimum size
      if (normalizedSelection) {
        if (
          normalizedSelection.width < minSize ||
          normalizedSelection.height < minSize
        ) {
          setSelection(null);
        }
      }
    },
    [normalizedSelection, minSize]
  );

  return {
    isSelecting,
    isDrawing,
    selection,
    normalizedSelection,
    startSelectionMode,
    cancelSelectionMode,
    clearSelection,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
```

**Step 2: Verify the hook was created**

Run: `cat src/hooks/useImageSelection.ts | head -20`
Expected: Shows the hook file header and imports

**Step 3: Commit**

```bash
git add src/hooks/useImageSelection.ts
git commit -m "feat(studio): add useImageSelection hook for drawing rectangles"
```

---

## Task 3: Create ImageSearchMode Component

**Files:**
- Create: `src/components/studio/ImageSearchMode.tsx`

**Step 1: Create the search mode overlay component**

```typescript
/**
 * ImageSearchMode - Overlay for selecting a region to search in Google Lens
 *
 * Usage:
 * <ImageSearchMode
 *   isActive={isSearchMode}
 *   onCancel={() => setIsSearchMode(false)}
 *   onSearch={handleLensSearch}
 *   imageRef={imageRef}
 * />
 */

import { useRef, useState, useCallback } from 'react';
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
    clearSelection,
    handlers,
  } = useImageSelection({
    containerRef,
    minSize: 50,
  });

  // Handle search button click
  const handleSearch = useCallback(async () => {
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
  }, [normalizedSelection, imageRef, onSearchComplete]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    clearSelection();
    onCancel();
  }, [clearSelection, onCancel]);

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
```

**Step 2: Verify the component was created**

Run: `cat src/components/studio/ImageSearchMode.tsx | head -30`
Expected: Shows the component file header and imports

**Step 3: Commit**

```bash
git add src/components/studio/ImageSearchMode.tsx
git commit -m "feat(studio): add ImageSearchMode component for Google Lens search"
```

---

## Task 4: Add Search Button to StudioResultPage (Desktop)

**Files:**
- Modify: `src/pages/Studio/ResultPage.tsx`

**Step 1: Add imports at the top of the file**

Find (around line 1-29):
```typescript
import { useState, useEffect, useMemo } from 'react';
```

Add after the lucide imports (around line 14):
```typescript
  Search,
```

Add after the existing component imports (around line 28):
```typescript
import { ImageSearchMode } from './components/ImageSearchMode';
```

**Step 2: Add state and refs for search mode**

Find (around line 110-111):
```typescript
  const [isDownloading, setIsDownloading] = useState(false);
  const [preparedDownloadData, setPreparedDownloadData] = useState<PreparedDownload | null>(null);
```

Add after:
```typescript
  const [isSearchMode, setIsSearchMode] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
```

Also add `useRef` to the React imports at line 1:
```typescript
import { useState, useEffect, useMemo, useRef } from 'react';
```

**Step 3: Add search mode handlers**

Find (around line 206):
```typescript
  const handleCancelDownload = () => {
```

Add before this function:
```typescript
  // --- Google Lens Search ---
  const handleStartSearch = () => {
    setIsSearchMode(true);
  };

  const handleSearchComplete = (_url: string) => {
    setIsSearchMode(false);
  };

  const handleCancelSearch = () => {
    setIsSearchMode(false);
  };

```

**Step 4: Add Search button to desktop top actions**

Find (around line 507-517):
```typescript
              <div className="flex gap-3">
{/* TODO: Enable after try-on flow is fixed
                <button
```

Replace with:
```typescript
              <div className="flex gap-3">
                <button
                  onClick={handleStartSearch}
                  className="w-12 h-12 rounded-full bg-black/10 backdrop-blur-xl border border-white/20 text-white hover:bg-black/20 flex items-center justify-center transition-all active:scale-90"
                  title="جستجو در گوگل لنز"
                >
                  <Search size={20} />
                </button>
{/* TODO: Enable after try-on flow is fixed
                <button
```

**Step 5: Add ref to the desktop image container**

Find (around line 461-462):
```typescript
        {/* LEFT PANEL (Main Hero Area) */}
        <div className="hidden md:block flex-1 h-full bg-zinc-900 relative overflow-hidden group">
```

Replace with:
```typescript
        {/* LEFT PANEL (Main Hero Area) */}
        <div
          ref={imageContainerRef}
          className="hidden md:block flex-1 h-full bg-zinc-900 relative overflow-hidden group"
        >
```

**Step 6: Add ref to the desktop AuthenticatedImage**

Find (around line 463-468):
```typescript
          <AuthenticatedImage
            src={resultImage}
            alt="Studio Result"
            imageWidth={1200}
            imageQuality={85}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${showOriginal ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100'}`}
          />
```

Replace with:
```typescript
          <AuthenticatedImage
            ref={imageRef}
            src={resultImage}
            alt="Studio Result"
            imageWidth={1200}
            imageQuality={85}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${showOriginal ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100'}`}
          />
```

**Step 7: Add ImageSearchMode component after the floating actions div**

Find (around line 546):
```typescript
          </div>
        </div>
```

Add before the closing `</div>` of the LEFT PANEL:
```typescript

          {/* Google Lens Search Mode Overlay */}
          <ImageSearchMode
            isActive={isSearchMode}
            onCancel={handleCancelSearch}
            onSearchComplete={handleSearchComplete}
            imageRef={imageRef}
            containerRef={imageContainerRef}
          />
```

**Step 8: Verify the changes compile**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 9: Commit**

```bash
git add src/pages/Studio/ResultPage.tsx
git commit -m "feat(studio): add Google Lens search button to desktop result page"
```

---

## Task 5: Add Search Button to Mobile Layout

**Files:**
- Modify: `src/pages/Studio/ResultPage.tsx`

**Step 1: Add search button to mobile actions**

Find (around line 602-615):
```typescript
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center border border-white/10 transition-all active:scale-90 ${isSaved ? 'text-accent bg-white' : 'text-white'}`}
                  >
                    <Heart size={18} className={isSaved ? 'fill-current' : ''} />
                  </button>
                  <button
                    onClick={handleDownload}
```

Add after the Heart button and before the Download button:
```typescript
                  <button
                    onClick={handleStartSearch}
                    className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 active:scale-90"
                    title="جستجو در گوگل لنز"
                  >
                    <Search size={18} />
                  </button>
```

**Step 2: Add refs to mobile image container and image**

Find the mobile hero section (around line 552-554):
```typescript
            {/* Hero Image */}
            <div className="relative w-full h-[65vh]">
              <AuthenticatedImage
```

We need a different approach for mobile since it shares refs. Add a separate ref for mobile:

Add to the state section (around line 112):
```typescript
  const mobileImageRef = useRef<HTMLImageElement>(null);
  const mobileImageContainerRef = useRef<HTMLDivElement>(null);
```

Then update the mobile hero section:
```typescript
            {/* Hero Image */}
            <div ref={mobileImageContainerRef} className="relative w-full h-[65vh]">
              <AuthenticatedImage
                ref={mobileImageRef}
                src={resultImage}
```

**Step 3: Add ImageSearchMode for mobile**

Find (around line 633-634 after the fullscreen button):
```typescript
              </button>
            </div>
```

Add before the closing `</div>` of the Hero Image section:
```typescript

              {/* Mobile Google Lens Search Mode */}
              <ImageSearchMode
                isActive={isSearchMode}
                onCancel={handleCancelSearch}
                onSearchComplete={handleSearchComplete}
                imageRef={mobileImageRef}
                containerRef={mobileImageContainerRef}
              />
```

**Step 4: Verify type check passes**

Run: `npm run type-check`
Expected: No errors

**Step 5: Commit**

```bash
git add src/pages/Studio/ResultPage.tsx
git commit -m "feat(studio): add Google Lens search button to mobile result page"
```

---

## Task 6: Update AuthenticatedImage to Support Refs

**Files:**
- Modify: `src/components/figma/AuthenticatedImage.tsx`

**Step 1: Check current AuthenticatedImage implementation**

Read the file first to understand its structure.

**Step 2: Add forwardRef support**

The AuthenticatedImage component needs to forward the ref to its internal img element. Update it to use `forwardRef`:

```typescript
import { forwardRef } from 'react';

// Change the component signature to use forwardRef
export const AuthenticatedImage = forwardRef<HTMLImageElement, AuthenticatedImageProps>(
  function AuthenticatedImage({ src, alt, className, ...props }, ref) {
    // ... existing implementation

    // In the return, add ref to the img element
    return (
      <img
        ref={ref}
        src={blobUrl}
        alt={alt}
        className={className}
        {...props}
      />
    );
  }
);
```

**Step 3: Verify the changes**

Run: `npm run type-check`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/figma/AuthenticatedImage.tsx
git commit -m "feat: add forwardRef support to AuthenticatedImage component"
```

---

## Task 7: Create Backend Endpoint (Documentation Only)

**Note:** This is backend work. Document what needs to be implemented.

**Files:**
- Document in: `docs/plans/2026-01-23-google-lens-search-design.md` (already created)

The backend endpoint should be:

```
POST /api/v1/utils/temp-image/
Content-Type: multipart/form-data

Request:
  - image: File (JPEG/PNG, max 2MB)

Response:
  - success: true
  - data: { url: "https://minio.example.com/temp/uuid.jpg" }

Features:
  - Requires authentication (IsAuthenticated)
  - Rate limited: 10 requests/hour per user
  - Uploads to MinIO temp bucket
  - Returns presigned public URL (10-minute expiry)
  - Auto-cleanup via MinIO lifecycle rules (15 min)
```

**No commit needed** - this is documentation for backend team.

---

## Task 8: Manual Testing Checklist

**Desktop Testing:**
1. [ ] Navigate to Studio Result page with a completed session
2. [ ] Click the Search (magnifying glass) button in top-right
3. [ ] Verify dark overlay appears with instructions
4. [ ] Draw a rectangle around a furniture item
5. [ ] Verify selection rectangle appears with corner handles
6. [ ] Click "تأیید و جستجو" button
7. [ ] Verify loading state shows
8. [ ] Verify Google Lens opens in new tab (or popup blocked message appears)
9. [ ] Click "لغو" to verify cancel works

**Mobile Testing:**
1. [ ] Same flow on mobile browser
2. [ ] Verify touch drawing works correctly
3. [ ] Verify buttons are accessible

**Edge Cases:**
1. [ ] Try drawing a very small selection (< 50px) - should be rejected
2. [ ] Try when image hasn't loaded yet - button should be disabled or show error
3. [ ] Test popup blocker scenario - should show clickable link

---

## Summary

**Files Created:**
1. `src/utils/imageCrop.ts` - Canvas cropping utility
2. `src/hooks/useImageSelection.ts` - Selection rectangle drawing hook
3. `src/components/studio/ImageSearchMode.tsx` - Search mode overlay component

**Files Modified:**
1. `src/pages/Studio/ResultPage.tsx` - Added search button and integration
2. `src/components/figma/AuthenticatedImage.tsx` - Added forwardRef support

**Backend Required:**
- `POST /api/v1/utils/temp-image/` endpoint for temporary public URL generation

**Total Estimated Lines:**
- Frontend: ~450 lines across 3 new files + ~50 lines of modifications
- Backend: ~40 lines (not included in this plan)
