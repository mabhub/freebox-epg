/**
 * Hook for drag-to-scroll horizontal navigation
 * @module hooks/useDragScroll
 */

import { useRef, useCallback, useEffect } from 'react';

const DRAG_THRESHOLD = 5;

/**
 * Enable horizontal drag-to-scroll on a container DOM node
 * Suppresses click events after a drag to prevent accidental program selection
 * @param {HTMLElement|null} container - The scrollable DOM node (or null when not yet mounted)
 * @param {Function} onScrollChange - Callback with { scrollLeft } when scroll position changes
 * @returns {void}
 */
const useDragScroll = (container, onScrollChange) => {
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const onScrollChangeRef = useRef(onScrollChange);
  onScrollChangeRef.current = onScrollChange;

  const handleMouseDown = useCallback((event) => {
    if (event.button !== 0) {
      return;
    }

    isDragging.current = true;
    hasMoved.current = false;
    startX.current = event.clientX;
    scrollStart.current = event.currentTarget.scrollLeft;

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((event) => {
    if (!isDragging.current) {
      return;
    }

    const deltaX = event.clientX - startX.current;

    if (Math.abs(deltaX) > DRAG_THRESHOLD) {
      hasMoved.current = true;
    }

    event.preventDefault();
    const newScrollLeft = scrollStart.current - deltaX;

    if (container) {
      container.scrollLeft = newScrollLeft;
      onScrollChangeRef.current?.({ scrollLeft: newScrollLeft });
    }
  }, [container]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) {
      return;
    }

    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const handleClick = useCallback((event) => {
    if (hasMoved.current) {
      event.stopPropagation();
      event.preventDefault();
      hasMoved.current = false;
    }
  }, []);

  useEffect(() => {
    if (!container) {
      return;
    }

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('click', handleClick, true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('click', handleClick, true);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [container, handleMouseDown, handleMouseMove, handleMouseUp, handleClick]);
};

export default useDragScroll;
