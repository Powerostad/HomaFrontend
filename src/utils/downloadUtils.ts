/**
 * Download Utilities for HOMA
 *
 * Provides cross-platform image download with:
 * - Mobile native share sheet support (navigator.share)
 * - Format conversion to PNG via canvas
 * - iOS Safari compatibility
 * - Authenticated image fetching
 */

import { fetchAuthenticatedImage } from './apiClient';
import i18n from '../i18n/config';

// =============================================================================
// Platform Detection
// =============================================================================

interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  supportsShare: boolean;
  supportsShareFiles: boolean;
}

/**
 * Detect the current platform and available APIs
 */
export function detectPlatform(): PlatformInfo {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  // Check if Web Share API is available
  const supportsShare = typeof navigator.share === 'function';

  // Check if sharing files is supported (not just URLs)
  const supportsShareFiles = supportsShare && isMobile;

  return {
    isIOS,
    isAndroid,
    isMobile,
    supportsShare,
    supportsShareFiles,
  };
}

// =============================================================================
// Image Conversion
// =============================================================================

/**
 * Convert an image blob to PNG format using canvas
 * This ensures consistent output format regardless of source
 */
export async function convertImageToPNG(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Create canvas with image dimensions
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw image to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);

      // Convert to PNG blob
      canvas.toBlob(
        (pngBlob) => {
          if (pngBlob) {
            resolve(pngBlob);
          } else {
            reject(new Error('Failed to convert image to PNG'));
          }
        },
        'image/png',
        1.0 // Maximum quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for conversion'));
    };

    img.src = url;
  });
}

// =============================================================================
// Download/Share Implementation
// =============================================================================

export interface DownloadImageOptions {
  /** Image URL (can be authenticated endpoint) */
  imageUrl: string;
  /** Filename without extension (will add .png) */
  filename?: string;
  /** Use authentication headers when fetching */
  useAuth?: boolean;
}

export interface DownloadResult {
  success: boolean;
  method: 'share' | 'download' | 'fallback';
  error?: string;
}

export interface PreparedDownload {
  blobUrl: string;
  filename: string;
  cleanup: () => void;
}

// Track if a download is in progress to prevent double-triggering
let downloadInProgress = false;

/**
 * Phase 1: Prepare download - fetch and convert image (async, no user gesture needed)
 * Returns a blob URL that can be used for immediate download
 */
export async function prepareDownload(
  options: DownloadImageOptions
): Promise<{ success: true; data: PreparedDownload } | { success: false; error: string }> {
  const { imageUrl, filename = `homa-${Date.now()}`, useAuth = true } = options;

  try {
    // Step 1: Fetch the image (with or without auth)
    let blob: Blob;
    if (useAuth) {
      const blobUrl = await fetchAuthenticatedImage(imageUrl);
      const response = await fetch(blobUrl);
      blob = await response.blob();
      URL.revokeObjectURL(blobUrl);
    } else {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      blob = await response.blob();
    }

    // Step 2: Convert to PNG
    const pngBlob = await convertImageToPNG(blob);

    // Step 3: Create blob URL for download
    const blobUrl = URL.createObjectURL(pngBlob);
    const fullFilename = `${filename}.png`;

    return {
      success: true,
      data: {
        blobUrl,
        filename: fullFilename,
        cleanup: () => URL.revokeObjectURL(blobUrl),
      },
    };
  } catch (error) {
    console.error('[PrepareDownload] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Phase 2: Trigger download - MUST be called directly from user click handler
 * This preserves the user gesture for Chrome's download policy
 */
export function triggerDownload(prepared: PreparedDownload): void {
  const link = document.createElement('a');
  link.href = prepared.blobUrl;
  link.download = prepared.filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup after delay
  setTimeout(() => prepared.cleanup(), 5000);
}

/**
 * Try to share on mobile - MUST be called directly from user click handler
 */
export async function triggerShare(prepared: PreparedDownload): Promise<boolean> {
  const platform = detectPlatform();

  if (!platform.supportsShareFiles) {
    return false;
  }

  try {
    // Fetch the blob from the blob URL
    const response = await fetch(prepared.blobUrl);
    const blob = await response.blob();
    const file = new File([blob], prepared.filename, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: i18n.t('common.homaImage'),
      });
      prepared.cleanup();
      return true;
    }
  } catch (error) {
    console.log('[Share] Failed or cancelled:', error);
  }

  return false;
}

/**
 * Download or share an image with cross-platform support
 *
 * Strategy:
 * 1. Fetch image (with auth if needed)
 * 2. Convert ANY format to PNG via canvas
 * 3. On mobile with share support: Use navigator.share() with file
 * 4. Fall back to opening blob URL in new tab (more Chrome-compatible)
 */
export async function downloadImage(
  options: DownloadImageOptions
): Promise<DownloadResult> {
  // Prevent multiple simultaneous downloads
  if (downloadInProgress) {
    console.log('[Download] Download already in progress, ignoring');
    return { success: false, method: 'fallback', error: 'Download already in progress' };
  }

  const { imageUrl, filename = `homa-${Date.now()}`, useAuth = true } = options;
  const platform = detectPlatform();

  downloadInProgress = true;

  try {
    // Step 1: Fetch the image (with or without auth)
    let blob: Blob;
    if (useAuth) {
      const blobUrl = await fetchAuthenticatedImage(imageUrl);
      const response = await fetch(blobUrl);
      blob = await response.blob();
      URL.revokeObjectURL(blobUrl);
    } else {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      blob = await response.blob();
    }

    // Step 2: Convert to PNG
    const pngBlob = await convertImageToPNG(blob);

    // Step 3: Create File object for sharing
    const file = new File([pngBlob], `${filename}.png`, { type: 'image/png' });

    // Step 4: Try navigator.share on mobile
    if (platform.supportsShareFiles) {
      try {
        // Check if navigator.canShare exists and supports files
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: i18n.t('common.homaImage'),
          });
          downloadInProgress = false;
          return { success: true, method: 'share' };
        }
      } catch (shareError) {
        // User cancelled or share failed - fall through to download
        console.log('[Download] Share failed or cancelled, falling back to download:', shareError);
      }
    }

    // Step 5: Try File System Access API (works better with async operations in Chrome)
    // @ts-expect-error - showSaveFilePicker is not in TypeScript types yet
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        // @ts-expect-error - showSaveFilePicker is not in TypeScript types yet
        const handle = await window.showSaveFilePicker({
          suggestedName: `${filename}.png`,
          types: [
            {
              description: 'PNG Image',
              accept: { 'image/png': ['.png'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(pngBlob);
        await writable.close();
        downloadInProgress = false;
        return { success: true, method: 'download' };
      } catch (fsError) {
        // User cancelled or API failed - fall through to anchor method
        if ((fsError as Error).name !== 'AbortError') {
          console.log('[Download] File System API failed, trying anchor:', fsError);
        }
      }
    }

    // Step 6: Fallback to anchor download
    const blobUrl = URL.createObjectURL(pngBlob);

    // Create a link and use it to trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${filename}.png`;
    link.style.display = 'none';

    // Append to DOM temporarily (required for Firefox)
    document.body.appendChild(link);

    // Trigger click synchronously
    link.click();

    // Remove from DOM
    document.body.removeChild(link);

    // Clean up blob URL after delay (browser needs time to start download)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

    downloadInProgress = false;
    return { success: true, method: 'download' };

  } catch (error) {
    console.error('[Download] Error:', error);
    downloadInProgress = false;
    return {
      success: false,
      method: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// Localized Error Messages
// =============================================================================

/**
 * Get localized error message for download failures
 */
export function getDownloadErrorMessage(error: string | undefined): string {
  const t = (key: string) => i18n.t(key);
  if (!error) return t('errors.downloadError');

  const errorMap: Record<string, string> = {
    'Failed to load image for conversion': t('errors.imageLoadError'),
    'Failed to convert image to PNG': t('errors.imageConvertError'),
    'Failed to get canvas context': t('errors.canvasError'),
    'HTTP 401': t('errors.sessionExpired'),
    'HTTP 404': t('errors.imageNotFound'),
    'HTTP 403': t('errors.forbidden'),
    'HTTP 500': t('errors.serverError'),
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return message;
    }
  }

  return t('errors.downloadError');
}
