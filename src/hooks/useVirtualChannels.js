/**
 * Hook for virtual scrolling of channel rows
 * Computes which rows are visible based on scroll position
 * @module hooks/useVirtualChannels
 */

import { useMemo } from 'react';
import { ROW_HEIGHT, OVERSCAN_ROWS } from '@/utils/constants';

/**
 * Compute the visible channel slice for virtual scrolling
 * @param {Object} options - Configuration
 * @param {Array} options.channels - Full sorted channel list
 * @param {number} options.scrollTop - Current vertical scroll position in pixels
 * @param {number} options.containerHeight - Viewport height in pixels
 * @returns {{ visibleChannels: Array, startIndex: number, totalHeight: number }} Visible channels slice and positioning info
 */
const useVirtualChannels = ({ channels, scrollTop, containerHeight }) => {
  const { visibleChannels, startIndex, totalHeight } = useMemo(() => {
    const total = channels.length;
    const height = total * ROW_HEIGHT;

    if (total === 0 || containerHeight === 0) {
      return { visibleChannels: [], startIndex: 0, totalHeight: height };
    }

    const rawStart = Math.floor(scrollTop / ROW_HEIGHT);
    const rawEnd = Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT);

    const start = Math.max(0, rawStart - OVERSCAN_ROWS);
    const end = Math.min(total, rawEnd + OVERSCAN_ROWS);

    return {
      visibleChannels: channels.slice(start, end),
      startIndex: start,
      totalHeight: height,
    };
  }, [channels, scrollTop, containerHeight]);

  return { visibleChannels, startIndex, totalHeight };
};

export default useVirtualChannels;
