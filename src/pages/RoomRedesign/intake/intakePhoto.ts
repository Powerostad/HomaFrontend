/**
 * Client-side photo preparation + lightweight validation for the intake flow.
 *
 * `prepareIntakeImage` converts HEIC→JPEG (reusing the app helper), reads the
 * image as a base64 data URL, and decodes it to measure dimensions. The dataUrl
 * is what the redesign chat sends inline as the first turn's image.
 *
 * We only HARD-block files that aren't decodable images. Small images (below the
 * recommended minimum) are flagged `tooSmall` so the UI can warn but still let
 * the user continue (per the V1 product decision: don't over-block).
 */
import { convertHeicToJpeg } from '@/utils/imageConversion';
import type { IntakeImage } from './intakeTypes';

/** Recommended minimum dimension for a useful analysis photo. */
export const MIN_PHOTO_DIM = 768;

export interface PreparedPhoto {
  image: Omit<IntakeImage, 'source'>;
  /** Below the recommended minimum on either axis — warn, but allow. */
  tooSmall: boolean;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

function readDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('decode failed'));
    img.src = dataUrl;
  });
}

/**
 * Prepare a picked/captured file for intake. Throws if the file is empty or not
 * a decodable image (caller shows a Persian error + lets the user re-pick).
 */
export async function prepareIntakeImage(file: File): Promise<PreparedPhoto> {
  if (!file || file.size === 0) throw new Error('empty file');
  // Reject non-images only when a type is reported. Empty-type files (some HEIC
  // exports) fall through to convertHeicToJpeg, which handles them; iOS HEIC
  // reports `image/heic`, which already passes this check.
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('not an image');
  }

  const jpeg = await convertHeicToJpeg(file);
  const dataUrl = await fileToDataUrl(jpeg);
  const { width, height } = await readDimensions(dataUrl); // throws on undecodable

  return {
    image: { dataUrl, width, height },
    tooSmall: width < MIN_PHOTO_DIM || height < MIN_PHOTO_DIM,
  };
}
