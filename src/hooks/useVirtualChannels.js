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
 * @returns {{ visibleChannels: Array, startIndex: number, onScreenStart: number, onScreenEnd: number, totalHeight: number }}
 *   Rendered slice (overscan included), its first index, the on-screen rows
 *   without overscan (`onScreenEnd` exclusive) and the total height
 */
const useVirtualChannels = ({ channels, scrollTop, containerHeight }) => {
  const { visibleChannels, startIndex, onScreenStart, onScreenEnd, totalHeight } = useMemo(() => {
    const total = channels.length;
    const height = total * ROW_HEIGHT;

    if (total === 0 || containerHeight === 0) {
      return { visibleChannels: [], startIndex: 0, onScreenStart: 0, onScreenEnd: 0, totalHeight: height };
    }

    const rawStart = Math.floor(scrollTop / ROW_HEIGHT);
    const rawEnd = Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT);

    const start = Math.max(0, rawStart - OVERSCAN_ROWS);
    const end = Math.min(total, rawEnd + OVERSCAN_ROWS);

    return {
      visibleChannels: channels.slice(start, end),
      startIndex: start,
      onScreenStart: Math.min(total, Math.max(0, rawStart)),
      onScreenEnd: Math.min(total, rawEnd),
      totalHeight: height,
    };
  }, [channels, scrollTop, containerHeight]);

  return { visibleChannels, startIndex, onScreenStart, onScreenEnd, totalHeight };
};

export default useVirtualChannels;
