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

export type CropResult = {
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
