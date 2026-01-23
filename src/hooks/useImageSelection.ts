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
