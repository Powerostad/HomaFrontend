/**
 * Image Conversion Utilities
 *
 * Handles conversion of unsupported image formats (HEIC/HEIF from iPhone)
 * to standard formats (JPEG) that can be processed by the backend.
 */
import heic2any from 'heic2any';

/**
 * Convert HEIC/HEIF images to JPEG
 *
 * iPhones capture photos in HEIC format by default, which is not supported
 * by Pillow (Python image library) on the backend. This function converts
 * HEIC images to JPEG before upload.
 *
 * @param file - The file to potentially convert
 * @returns The original file if not HEIC, or a converted JPEG File
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  // Check if file is HEIC/HEIF by MIME type or extension
  // Some browsers report incorrect MIME types, so we check both
  const isHeic = file.type === 'image/heic' ||
                 file.type === 'image/heif' ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');

  if (!isHeic) {
    return file;
  }

  console.log('[ImageConversion] Converting HEIC to JPEG:', file.name);

  try {
    const blob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 1,
    });

    // heic2any returns Blob or Blob[], handle both cases
    const resultBlob = Array.isArray(blob) ? blob[0] : blob;

    // Create new File with .jpg extension
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    const convertedFile = new File([resultBlob], newFileName, { type: 'image/jpeg' });

    console.log('[ImageConversion] Conversion successful:', {
      original: file.name,
      converted: newFileName,
      originalSize: file.size,
      convertedSize: convertedFile.size,
    });

    return convertedFile;
  } catch (error) {
    console.warn('[ImageConversion] HEIC conversion failed:', error);
    // Return original file - let backend handle the error with proper message
    return file;
  }
}

/**
 * Supported image MIME types (including those that will be converted)
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',  // Will be converted to JPEG
  'image/heif',  // Will be converted to JPEG
];

/**
 * Accept string for file inputs (includes HEIC for mobile compatibility)
 */
export const IMAGE_ACCEPT_STRING = 'image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif';
