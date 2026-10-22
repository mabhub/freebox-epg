/**
 * Viewport geometry of the EPG grid: which time range is on screen, and how
 * urgent each (channel, bucket) request is.
 * @module utils/viewport
 */

import { PRIORITY } from '@/api/requestQueue';
import { JUMP_TARGET_FRACTION } from '@/utils/constants';

const BUCKET_SECONDS = 7200;

/**
 * Time range currently on screen, without the fetch overscan.
 * @param {Object} params - Viewport state
 * @param {number} params.timeOrigin - Unix timestamp of the grid's left edge
 * @param {number} params.scrollLeft - Horizontal scroll position in pixels
 * @param {number} params.viewportWidth - Viewport width in pixels
 * @param {number} params.pixelsPerMinute - Current responsive scale factor
 * @returns {{ startTs: number, endTs: number }} On-screen range, Unix seconds
 */
export const viewportTimeRange = ({ timeOrigin, scrollLeft, viewportWidth, pixelsPerMinute }) => {
  const pixelsPerSecond = pixelsPerMinute / 60;
  return {
    startTs: timeOrigin + scrollLeft / pixelsPerSecond,
    endTs: timeOrigin + (scrollLeft + viewportWidth) / pixelsPerSecond,
  };
};

/**
 * Time span on screen right after a jump to a target time (`Maintenant`,
 * `20h30`), which `centerOnTimeOrigin` places a third of the way in.
 * @param {number} targetTs - Jump target, Unix seconds
 * @param {number} spanSeconds - Time span the viewport shows, in seconds
 * @returns {{ startTs: number, endTs: number }} Range on screen after the jump, Unix seconds
 */
export const jumpTargetRange = (targetTs, spanSeconds) => ({
  startTs: targetTs - spanSeconds * JUMP_TARGET_FRACTION,
  endTs: targetTs + spanSeconds * (1 - JUMP_TARGET_FRACTION),
});

/**
 * Queue priority of one `by_channel` request. A pair whose row and bucket
 * are both on screen is visible, any other is overscan; inside a class, the
 * rank grows with the normalised distance to the centre of the screen.
 * @param {{ rowIndex: number, ts: number }} pair - Absolute row index and bucket start
 * @param {Object} onScreen - On-screen area
 * @param {number} onScreen.onScreenStart - First on-screen row index
 * @param {number} onScreen.onScreenEnd - Row index after the last on-screen row
 * @param {number} onScreen.startTs - On-screen range start, Unix seconds
 * @param {number} onScreen.endTs - On-screen range end, Unix seconds
 * @returns {{ priority: number, rank: number }} Queue options for apiFetch
 */
export const pairPriority = ({ rowIndex, ts }, { onScreenStart, onScreenEnd, startTs, endTs }) => {
  const rowOnScreen = rowIndex >= onScreenStart && rowIndex < onScreenEnd;
  const bucketOnScreen = ts < endTs && ts + BUCKET_SECONDS > startTs;
  const dRow = Math.abs(rowIndex + 0.5 - (onScreenStart + onScreenEnd) / 2) / Math.max(1, onScreenEnd - onScreenStart);
  const dTime = Math.abs(ts + BUCKET_SECONDS / 2 - (startTs + endTs) / 2) / Math.max(1, endTs - startTs);
  return {
    priority: rowOnScreen && bucketOnScreen ? PRIORITY.EPG_VISIBLE : PRIORITY.EPG_OVERSCAN,
    rank: Math.hypot(dRow, dTime),
  };
};
