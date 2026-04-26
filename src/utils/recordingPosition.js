/**
 * Pure helpers for positioning recording overlay cells on the EPG grid.
 * @module utils/recordingPosition
 */

import {
  ROW_HEIGHT,
  OVERLAY_HEIGHT_RATIO,
  OVERLAY_MIN_WIDTH_PX,
} from './constants';

/**
 * Compute the absolute pixel position of a recording overlay cell.
 *
 * The cell sits at the bottom of its channel row (10 % of the row's height)
 * and spans the recording's `[start, end]` window.
 *
 * @param {Object} args - Positioning inputs
 * @param {Object} args.recording - Recording with `start` and `end` timestamps (seconds)
 * @param {number} args.rowIndex - Absolute index of the row in the virtual grid
 * @param {number} args.timeOrigin - Unix timestamp aligned with the grid's left edge
 * @param {number} args.pixelsPerMinute - Current responsive scale factor
 * @param {number} args.sidebarWidth - Sidebar width offset added to `left`
 * @returns {{ left: number, top: number, width: number, height: number }} Pixel rect
 */
export const computeRecordingRect = ({
  recording,
  rowIndex,
  timeOrigin,
  pixelsPerMinute,
  sidebarWidth,
}) => {
  const offsetMinutes = (recording.start - timeOrigin) / 60;
  const durationMinutes = (recording.end - recording.start) / 60;
  const left = sidebarWidth + offsetMinutes * pixelsPerMinute;
  const width = Math.max(OVERLAY_MIN_WIDTH_PX, durationMinutes * pixelsPerMinute);
  const height = ROW_HEIGHT * OVERLAY_HEIGHT_RATIO;
  const top = rowIndex * ROW_HEIGHT + (ROW_HEIGHT - height);
  return { left, top, width, height };
};

/**
 * Return true when the given recording's `[start, end]` window intersects
 * the visible time window. Used to skip cells that are off-screen.
 *
 * @param {Object} recording - Recording with `start` and `end` timestamps
 * @param {number} viewportStart - Visible window start (seconds)
 * @param {number} viewportEnd - Visible window end (seconds)
 * @returns {boolean} Whether the recording overlaps the viewport
 */
export const isRecordingInViewport = (recording, viewportStart, viewportEnd) =>
  recording.end > viewportStart && recording.start < viewportEnd;
