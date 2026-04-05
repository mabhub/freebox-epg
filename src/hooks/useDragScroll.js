/**
 * Hook for drag-to-scroll horizontal navigation
 * @module hooks/useDragScroll
 */

import { useRef, useCallback, useEffect } from 'react';

/**
 * Enable horizontal drag-to-scroll on a container element
 * @param {React.RefObject} containerRef - Ref to the scrollable container
 * @param {Function} onScrollChange - Callback with { scrollLeft } when scroll position changes
 * @returns {{ isDragging: boolean }} Drag state
 */
const useDragScroll = (containerRef, onScrollChange) => {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const handleMouseDown = useCallback((event) => {
    if (event.button !== 0) {
      return;
    }

    isDragging.current = true;
    startX.current = event.clientX;
    scrollStart.current = containerRef.current?.scrollLeft ?? 0;

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [containerRef]);

  const handleMouseMove = useCallback((event) => {
    if (!isDragging.current) {
      return;
    }

    event.preventDefault();
    const deltaX = event.clientX - startX.current;
    const newScrollLeft = scrollStart.current - deltaX;

    if (containerRef.current) {
      containerRef.current.scrollLeft = newScrollLeft;
      onScrollChange?.({ scrollLeft: newScrollLeft });
    }
  }, [containerRef, onScrollChange]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) {
      return;
    }

    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const handleTouchStart = useCallback((event) => {
    const touch = event.touches[0];
    isDragging.current = true;
    startX.current = touch.clientX;
    scrollStart.current = containerRef.current?.scrollLeft ?? 0;
  }, [containerRef]);

  const handleTouchMove = useCallback((event) => {
    if (!isDragging.current) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - startX.current;
    const newScrollLeft = scrollStart.current - deltaX;

    if (containerRef.current) {
      containerRef.current.scrollLeft = newScrollLeft;
      onScrollChange?.({ scrollLeft: newScrollLeft });
    }
  }, [containerRef, onScrollChange]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  return { isDragging: isDragging.current };
};

export default useDragScroll;
