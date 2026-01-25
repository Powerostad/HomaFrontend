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
  // Track current selection in a ref to avoid stale closures in event handlers
  const selectionRef = useRef<SelectionRect | null>(null);

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

  // Helper to normalize any selection rect
  const normalizeRect = useCallback((sel: SelectionRect | null): NormalizedRect | null => {
    if (!sel) return null;
    return {
      x: Math.min(sel.startX, sel.endX),
      y: Math.min(sel.startY, sel.endY),
      width: Math.abs(sel.endX - sel.startX),
      height: Math.abs(sel.endY - sel.startY),
    };
  }, []);

  // Normalize selection to always have positive width/height
  const normalizedSelection: NormalizedRect | null = normalizeRect(selection);

  const startSelectionMode = useCallback(() => {
    setIsSelecting(true);
    setSelection(null);
  }, []);

  const cancelSelectionMode = useCallback(() => {
    setIsSelecting(false);
    setIsDrawing(false);
    setSelection(null);
    drawingRef.current = false;
    selectionRef.current = null;
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsDrawing(false);
    drawingRef.current = false;
    selectionRef.current = null;
  }, []);

  // Mouse handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting) return;
      e.preventDefault();

      const coords = getRelativeCoords(e.clientX, e.clientY);
      if (!coords) return;

      const newSelection = {
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
      };

      drawingRef.current = true;
      selectionRef.current = newSelection;
      setIsDrawing(true);
      setSelection(newSelection);
    },
    [isSelecting, getRelativeCoords]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawingRef.current || !selectionRef.current) return;
      e.preventDefault();

      const coords = getRelativeCoords(e.clientX, e.clientY);
      if (!coords) return;

      const updatedSelection = {
        ...selectionRef.current,
        endX: coords.x,
        endY: coords.y,
      };
      selectionRef.current = updatedSelection;
      setSelection(updatedSelection);
    },
    [getRelativeCoords]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault();

      drawingRef.current = false;
      setIsDrawing(false);

      // Check minimum size using the ref (avoids stale closure)
      const currentNormalized = normalizeRect(selectionRef.current);
      if (currentNormalized) {
        if (
          currentNormalized.width < minSize ||
          currentNormalized.height < minSize
        ) {
          // Selection too small - clear it
          selectionRef.current = null;
          setSelection(null);
        }
      }
    },
    [normalizeRect, minSize]
  );

  // Touch handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isSelecting || e.touches.length !== 1) return;
      e.preventDefault();

      const touch = e.touches[0];
      const coords = getRelativeCoords(touch.clientX, touch.clientY);
      if (!coords) return;

      const newSelection = {
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
      };

      drawingRef.current = true;
      selectionRef.current = newSelection;
      setIsDrawing(true);
      setSelection(newSelection);
    },
    [isSelecting, getRelativeCoords]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!drawingRef.current || !selectionRef.current || e.touches.length !== 1) return;
      e.preventDefault();

      const touch = e.touches[0];
      const coords = getRelativeCoords(touch.clientX, touch.clientY);
      if (!coords) return;

      const updatedSelection = {
        ...selectionRef.current,
        endX: coords.x,
        endY: coords.y,
      };
      selectionRef.current = updatedSelection;
      setSelection(updatedSelection);
    },
    [getRelativeCoords]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!drawingRef.current) return;
      e.preventDefault();

      drawingRef.current = false;
      setIsDrawing(false);

      // Check minimum size using the ref (avoids stale closure)
      const currentNormalized = normalizeRect(selectionRef.current);
      if (currentNormalized) {
        if (
          currentNormalized.width < minSize ||
          currentNormalized.height < minSize
        ) {
          selectionRef.current = null;
          setSelection(null);
        }
      }
    },
    [normalizeRect, minSize]
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
