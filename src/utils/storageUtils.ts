/**
 * Storage Utilities for HOMA
 *
 * Provides centralized helpers for sessionStorage with file serialization.
 * Used to persist state across page reloads in Try-On and Studio flows.
 *
 * Key features:
 * - File serialization to/from base64 (handles File objects)
 * - Type-safe storage with generics
 * - Graceful error handling
 */

// Storage keys used across the application
export const STORAGE_KEYS = {
  // Try-On flow
  TRYON_FILE: 'homa_tryon_file',
  TRYON_PRODUCT_ID: 'homa_tryon_product_id',
  TRYON_SIZE: 'homa_tryon_size',
  TRYON_RESULT: 'homa_tryon_result',
  TRYON_TASK_ID: 'homa_tryon_task_id',  // For async processing recovery

  // Studio flow
  STUDIO_SESSION_ID: 'homa_studio_session_id',
} as const;

// Type for stored file metadata
interface StoredFileData {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  dataUrl: string;
}

// Type for stored try-on result
export interface StoredTryOnResult {
  id: number;
  path: string;
}

/**
 * Save a File object to sessionStorage as base64
 * This is async because FileReader is async
 *
 * @param file - The File object to save
 * @param key - Storage key to use
 */
export async function saveFileToStorage(file: File, key: string): Promise<void> {
  try {
    const reader = new FileReader();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    const fileData: StoredFileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      dataUrl,
    };

    sessionStorage.setItem(key, JSON.stringify(fileData));
    console.log(`[Storage] File saved: ${file.name} (${Math.round(file.size / 1024)}KB)`);
  } catch (error) {
    console.error('[Storage] Failed to save file:', error);
    // Don't throw - file persistence is non-critical
  }
}

/**
 * Load a File object from sessionStorage
 * Returns null if not found or on error
 *
 * @param key - Storage key to load from
 */
export async function loadFileFromStorage(key: string): Promise<File | null> {
  try {
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;

    const fileData: StoredFileData = JSON.parse(stored);

    // Convert base64 data URL back to blob
    const response = await fetch(fileData.dataUrl);
    const blob = await response.blob();

    // Reconstruct File object
    const file = new File([blob], fileData.name, {
      type: fileData.type,
      lastModified: fileData.lastModified,
    });

    console.log(`[Storage] File restored: ${file.name}`);
    return file;
  } catch (error) {
    console.error('[Storage] Failed to load file:', error);
    return null;
  }
}

/**
 * Clear a file from sessionStorage
 *
 * @param key - Storage key to clear
 */
export function clearFileFromStorage(key: string): void {
  try {
    sessionStorage.removeItem(key);
    console.log(`[Storage] Cleared: ${key}`);
  } catch (error) {
    console.error('[Storage] Failed to clear:', error);
  }
}

/**
 * Save any JSON-serializable data to sessionStorage
 *
 * @param key - Storage key
 * @param data - Data to save
 */
export function saveToStorage<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('[Storage] Failed to save:', error);
  }
}

/**
 * Load JSON data from sessionStorage
 *
 * @param key - Storage key
 * @returns Parsed data or null if not found
 */
export function loadFromStorage<T>(key: string): T | null {
  try {
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error('[Storage] Failed to load:', error);
    return null;
  }
}

/**
 * Clear multiple storage keys at once
 *
 * @param keys - Array of storage keys to clear
 */
export function clearStorage(keys: string[]): void {
  keys.forEach(key => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`[Storage] Failed to clear ${key}:`, error);
    }
  });
}

/**
 * Clear all Try-On related storage
 */
export function clearTryOnStorage(): void {
  clearStorage([
    STORAGE_KEYS.TRYON_FILE,
    STORAGE_KEYS.TRYON_PRODUCT_ID,
    STORAGE_KEYS.TRYON_SIZE,
    STORAGE_KEYS.TRYON_RESULT,
  ]);
}

/**
 * Clear all Studio related storage
 */
export function clearStudioStorage(): void {
  clearStorage([
    STORAGE_KEYS.STUDIO_SESSION_ID,
  ]);
}
