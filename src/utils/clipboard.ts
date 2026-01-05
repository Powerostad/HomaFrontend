/**
 * Clipboard - Utility for copying text to clipboard
 *
 * Provides a consistent API for clipboard operations with
 * fallback for browsers that don't support the Clipboard API.
 */

/**
 * Copy text to clipboard
 *
 * Uses the modern Clipboard API with a fallback for older browsers.
 * Returns true if successful, false otherwise.
 *
 * @example
 * const success = await copyToClipboard('Hello World');
 * if (success) {
 *   toast('Copied!');
 * }
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
      return fallbackCopy(text);
    }
  }

  // Fallback for older browsers
  return fallbackCopy(text);
}

/**
 * Fallback copy method using a temporary textarea
 */
function fallbackCopy(text: string): boolean {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 2em;
    height: 2em;
    padding: 0;
    border: none;
    outline: none;
    box-shadow: none;
    background: transparent;
    opacity: 0;
    z-index: -1;
  `;

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    document.body.removeChild(textArea);
    return false;
  }
}

/**
 * Check if clipboard API is available
 */
export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && typeof navigator.clipboard.writeText === 'function');
}
