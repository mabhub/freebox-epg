/**
 * Pure helpers for resizing a recording by dragging an edge of its overlay
 * cell. A drag moves the program slot (`raw.start` / `raw.end`); the
 * margins keep their length and follow the edge.
 * @module utils/recordingResize
 */

import { RESIZE_MIN_DURATION_SECONDS, RESIZE_STEP_SECONDS } from './constants';
import computeFieldLocks from './recordingLocks';

/**
 * Edges a drag may move, matching the start/end locks of the edit modal.
 * @param {Object} recording - Unified recording
 * @returns {{ start: boolean, end: boolean }} Whether each edge can move
 */
export const getResizableEdges = (recording) => {
  const locks = computeFieldLocks(recording);
  return { start: locks.start, end: locks.end };
};

/**
 * Program bounds of a channel, which a dragged edge sticks to.
 * @param {Array<{ date: number, duration: number }>|undefined} programs - Channel programs
 * @returns {number[]} Distinct timestamps, ascending
 */
export const collectSnapTargets = (programs) => {
  const bounds = new Set((programs ?? []).flatMap(({ date, duration }) => [date, date + duration]));
  return [...bounds].toSorted((a, b) => a - b);
};

/**
 * Convert a horizontal position in the grid content to a timestamp.
 * @param {Object} args - Inputs
 * @param {number} args.x - Offset from the grid content's left edge (px)
 * @param {number} args.timeOrigin - Timestamp at the timeline's left edge
 * @param {number} args.pixelsPerMinute - Current scale factor
 * @param {number} args.sidebarWidth - Sidebar width before the timeline
 * @returns {number} Timestamp (seconds)
 */
export const pointerToTime = ({ x, timeOrigin, pixelsPerMinute, sidebarWidth }) =>
  timeOrigin + ((x - sidebarWidth) / pixelsPerMinute) * 60;

/**
 * Closest snap target within the threshold, or null.
 * @param {number} value - Candidate bound
 * @param {number[]} targets - Snap targets
 * @param {number} threshold - Maximum distance (seconds)
 * @returns {number|null} The target to stick to
 */
const findSnap = (value, targets, threshold) => {
  let best = null;
  for (const target of targets) {
    const distance = Math.abs(target - value);
    if (distance <= threshold && (best === null || distance < Math.abs(best - value))) best = target;
  }
  return best;
};

/**
 * Round a limit up to the next 5-minute step, so a held edge stays on a
 * round time.
 * @param {number} timestamp - Limit (seconds)
 * @returns {number} Rounded limit
 */
const ceilToStep = (timestamp) => Math.ceil(timestamp / RESIZE_STEP_SECONDS) * RESIZE_STEP_SECONDS;

/**
 * Program slot after dragging one edge of a recording's cell. The pointer
 * marks the real edge (margin included); the program bound sits one margin
 * inside it, then sticks to a nearby program bound or rounds to 5 minutes,
 * then is held within limits: the slot lasts at least 5 minutes, a waiting
 * recording does not start (margin included) before now, and a running one
 * ends at least 5 minutes after now (both now limits rounded up to 5 minutes).
 *
 * @param {Object} args - Inputs
 * @param {Object} args.recording - Unified recording (slot read from `raw`)
 * @param {'start'|'end'} args.edge - Dragged edge
 * @param {number} args.pointerTime - Timestamp under the pointer
 * @param {number} args.now - Current timestamp
 * @param {number[]} args.snapTargets - Program bounds of the channel
 * @param {number} args.snapThreshold - Snap distance (seconds)
 * @returns {{ start: number, end: number, snappedTo: number|null }} New slot, and the bound it stuck to
 */
export const computeResizedBounds = ({ recording, edge, pointerTime, now, snapTargets, snapThreshold }) => {
  const { start, end } = recording.raw;
  const candidate = edge === 'end' ? pointerTime - recording.marginAfter : pointerTime + recording.marginBefore;
  const snap = findSnap(candidate, snapTargets, snapThreshold);
  const aligned = snap ?? Math.round(candidate / RESIZE_STEP_SECONDS) * RESIZE_STEP_SECONDS;

  const bound =
    edge === 'end'
      ? Math.max(
          aligned,
          start + RESIZE_MIN_DURATION_SECONDS,
          recording.state === 'running' ? ceilToStep(now + RESIZE_MIN_DURATION_SECONDS) : -Infinity,
        )
      : Math.min(Math.max(aligned, ceilToStep(now + recording.marginBefore)), end - RESIZE_MIN_DURATION_SECONDS);

  return {
    start: edge === 'start' ? bound : start,
    end: edge === 'end' ? bound : end,
    snappedTo: snap !== null && bound === snap ? snap : null,
  };
};
