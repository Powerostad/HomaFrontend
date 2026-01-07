/**
 * Image utility functions for handling image URL to File conversions
 * Used for preset images that need to be uploaded as files
 */

/**
 * Fetch an image from a URL and convert it to a File object
 * Suitable for preset images that need to be uploaded as files
 *
 * @param imageUrl - The URL of the image to fetch
 * @param filename - Optional filename for the File (default: generated from timestamp)
 * @returns Promise with File object or error message (Persian)
 */
export async function fetchImageAsFile(
  imageUrl: string,
  filename?: string
): Promise<{ success: true; file: File } | { success: false; error: string }> {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return {
        success: false,
        error: `خطا در دریافت تصویر (${response.status})`,
      };
    }

    const blob = await response.blob();

    // Determine MIME type and extension
    const contentType = blob.type || 'image/jpeg';
    const extension = contentType.split('/')[1] || 'jpg';

    // Generate filename if not provided
    const finalFilename = filename || `preset-${Date.now()}.${extension}`;

    // Create File from Blob
    const file = new File([blob], finalFilename, { type: contentType });

    return { success: true, file };
  } catch (error) {
    console.error('[fetchImageAsFile] Error:', error);

    // Handle CORS or network errors with Persian messages
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'خطا در دسترسی به تصویر. لطفا دوباره امتحان کنید.',
      };
    }

    return {
      success: false,
      error: 'خطا در بارگذاری تصویر نمونه',
    };
  }
}
