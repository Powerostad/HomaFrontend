import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";
import type { ProcessingStatus } from "@/services/visualizationService";
import {
  saveFileToStorage,
  loadFileFromStorage,
  saveToStorage,
  loadFromStorage,
  clearTryOnStorage,
  STORAGE_KEYS,
  type StoredTryOnResult,
} from "@/utils/storageUtils";

/**
 * UploadContext - manages file upload and visualization state
 *
 * Handles the Try-On flow state:
 * - Selected file from user
 * - Processing status and progress
 * - Resulting visualization image
 *
 * IMPORTANT: Uses a ref alongside state for the selected file to handle
 * the race condition between setSelectedFile and navigation. The ref
 * is updated synchronously so it's available immediately after setting.
 *
 * FILE PERSISTENCE: Files are persisted to sessionStorage as base64 to survive
 * page reloads. This is handled async and non-blocking.
 */
interface UploadContextType {
  // File selection
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  /**
   * Get the file synchronously - useful when navigating immediately after setting
   * This avoids the React state batching delay
   */
  getSelectedFile: () => File | null;

  // Size selection (for rug products)
  selectedSize: string | null;
  setSelectedSize: (size: string | null) => void;
  /**
   * Get the size synchronously - useful when navigating immediately after setting
   */
  getSelectedSize: () => string | null;

  // Processing state
  processingStatus: ProcessingStatus;
  setProcessingStatus: (status: ProcessingStatus) => void;
  processingProgress: number;
  setProcessingProgress: (progress: number) => void;
  processingError: string | null;
  setProcessingError: (error: string | null) => void;

  // Result
  visualizedImageUrl: string;
  setVisualizedImageUrl: (url: string) => void;
  resultImageId: number | null;
  setResultImageId: (id: number | null) => void;
  resultImagePath: string | null;
  setResultImagePath: (path: string | null) => void;

  // Task tracking for async processing
  currentTaskId: string | null;
  setCurrentTaskId: (taskId: string | null) => void;

  // Timing
  uploadStartTime: number;
  setUploadStartTime: (time: number) => void;

  // Actions
  clearUpload: () => void;
  resetProcessing: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  // File selection - use both state (for reactivity) and ref (for sync access)
  const [selectedFile, setSelectedFileState] = useState<File | null>(null);
  const selectedFileRef = useRef<File | null>(null);

  // Sync setter that updates both ref and state + persist to storage
  const setSelectedFile = useCallback((file: File | null) => {
    selectedFileRef.current = file;  // Sync - available immediately
    setSelectedFileState(file);       // Async - triggers re-render

    // Persist to sessionStorage (async, non-blocking)
    if (file) {
      saveFileToStorage(file, STORAGE_KEYS.TRYON_FILE);
    }
  }, []);

  // Sync getter for immediate access (useful after setting before navigation)
  const getSelectedFile = useCallback(() => selectedFileRef.current, []);

  // Size selection (for rug products) - use both state and ref for sync access
  const [selectedSize, setSelectedSizeState] = useState<string | null>(null);
  const selectedSizeRef = useRef<string | null>(null);

  // Sync setter that updates both ref and state + persist to storage
  const setSelectedSize = useCallback((size: string | null) => {
    selectedSizeRef.current = size;  // Sync - available immediately
    setSelectedSizeState(size);       // Async - triggers re-render

    // Persist to sessionStorage
    if (size) {
      saveToStorage(STORAGE_KEYS.TRYON_SIZE, size);
    }
  }, []);

  // Sync getter for immediate access (useful after setting before navigation)
  const getSelectedSize = useCallback(() => selectedSizeRef.current, []);

  // Processing state
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Result
  const [visualizedImageUrl, setVisualizedImageUrl] = useState<string>("");
  const [resultImageIdState, setResultImageIdState] = useState<number | null>(null);
  const [resultImagePathState, setResultImagePathState] = useState<string | null>(null);

  // Wrapped setters that also persist to storage
  const setResultImageId = useCallback((id: number | null) => {
    setResultImageIdState(id);
    // Save to storage when both id and path are set
    if (id !== null) {
      const currentPath = resultImagePathState;
      if (currentPath) {
        saveToStorage(STORAGE_KEYS.TRYON_RESULT, { id, path: currentPath });
      }
    }
  }, [resultImagePathState]);

  const setResultImagePath = useCallback((path: string | null) => {
    setResultImagePathState(path);
    // Save to storage when both id and path are set
    if (path !== null) {
      const currentId = resultImageIdState;
      if (currentId !== null) {
        saveToStorage(STORAGE_KEYS.TRYON_RESULT, { id: currentId, path });
      }
    }
  }, [resultImageIdState]);

  // Expose state values
  const resultImageId = resultImageIdState;
  const resultImagePath = resultImagePathState;

  // Task ID tracking for async processing recovery
  const [currentTaskId, setCurrentTaskIdState] = useState<string | null>(null);

  // Wrapped setter that persists to storage
  const setCurrentTaskId = useCallback((taskId: string | null) => {
    setCurrentTaskIdState(taskId);
    if (taskId) {
      saveToStorage(STORAGE_KEYS.TRYON_TASK_ID, taskId);
    } else {
      // Clear from storage when null
      sessionStorage.removeItem(STORAGE_KEYS.TRYON_TASK_ID);
    }
  }, []);

  // Timing
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);

  // Track if we've attempted to restore from storage
  const hasRestoredRef = useRef(false);

  /**
   * Restore state from sessionStorage on mount
   * This enables page reload recovery
   */
  useEffect(() => {
    // Only restore once
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const restoreFromStorage = async () => {
      // Restore file if not already set
      if (!selectedFileRef.current) {
        const storedFile = await loadFileFromStorage(STORAGE_KEYS.TRYON_FILE);
        if (storedFile) {
          selectedFileRef.current = storedFile;
          setSelectedFileState(storedFile);
          console.log('[UploadContext] Restored file from storage:', storedFile.name);
        }
      }

      // Restore size if not already set
      if (!selectedSizeRef.current) {
        const storedSize = loadFromStorage<string>(STORAGE_KEYS.TRYON_SIZE);
        if (storedSize) {
          selectedSizeRef.current = storedSize;
          setSelectedSizeState(storedSize);
          console.log('[UploadContext] Restored size from storage:', storedSize);
        }
      }

      // Restore result info if not already set
      if (!resultImageId && !resultImagePath) {
        const storedResult = loadFromStorage<StoredTryOnResult>(STORAGE_KEYS.TRYON_RESULT);
        if (storedResult) {
          setResultImageId(storedResult.id);
          setResultImagePath(storedResult.path);
          console.log('[UploadContext] Restored result from storage:', storedResult);
        }
      }

      // Restore task ID if not already set (for processing recovery)
      if (!currentTaskId) {
        const storedTaskId = loadFromStorage<string>(STORAGE_KEYS.TRYON_TASK_ID);
        if (storedTaskId) {
          setCurrentTaskIdState(storedTaskId);
          console.log('[UploadContext] Restored task ID from storage:', storedTaskId);
        }
      }
    };

    restoreFromStorage();
  }, []);

  /**
   * Clear all upload state - reset to initial
   * Also clears sessionStorage to prevent stale data
   */
  const clearUpload = useCallback(() => {
    selectedFileRef.current = null;  // Clear ref synchronously
    setSelectedFileState(null);
    selectedSizeRef.current = null;  // Clear size ref synchronously
    setSelectedSizeState(null);
    setProcessingStatus('idle');
    setProcessingProgress(0);
    setProcessingError(null);
    setVisualizedImageUrl("");
    setResultImageIdState(null);  // Use direct state setter to avoid storage save
    setResultImagePathState(null);
    setCurrentTaskIdState(null);  // Clear task ID
    setUploadStartTime(0);

    // Clear sessionStorage
    clearTryOnStorage();
  }, []);

  /**
   * Reset only processing state - keep selected file
   * Useful for retry scenarios
   */
  const resetProcessing = useCallback(() => {
    setProcessingStatus('idle');
    setProcessingProgress(0);
    setProcessingError(null);
    setVisualizedImageUrl("");
    setResultImageIdState(null);  // Use direct state setter
    setResultImagePathState(null);
  }, []);

  return (
    <UploadContext.Provider
      value={{
        // File selection
        selectedFile,
        setSelectedFile,
        getSelectedFile,

        // Size selection
        selectedSize,
        setSelectedSize,
        getSelectedSize,

        // Processing state
        processingStatus,
        setProcessingStatus,
        processingProgress,
        setProcessingProgress,
        processingError,
        setProcessingError,

        // Result
        visualizedImageUrl,
        setVisualizedImageUrl,
        resultImageId,
        setResultImageId,
        resultImagePath,
        setResultImagePath,

        // Task tracking
        currentTaskId,
        setCurrentTaskId,

        // Timing
        uploadStartTime,
        setUploadStartTime,

        // Actions
        clearUpload,
        resetProcessing,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
