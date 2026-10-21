/**
 * Drag state for resizing a recording from an edge of its overlay cell.
 * @module hooks/useRecordingResizeDrag
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { RESIZE_SNAP_PX } from '@/utils/constants';
import { computeResizedBounds, pointerToTime } from '@/utils/recordingResize';

/**
 * Cancel a click before it reaches its target.
 * @param {MouseEvent} event - Click event
 */
const cancelClick = (event) => {
  event.stopPropagation();
  event.preventDefault();
};

/**
 * Swallow the click the browser fires right after a drag, so releasing
 * the mouse does not open a modal.
 */
const swallowNextClick = () => {
  globalThis.addEventListener('click', cancelClick, { capture: true, once: true });
  setTimeout(() => globalThis.removeEventListener('click', cancelClick, { capture: true }), 0);
};

/**
 * Track a resize drag: preview the program slot while the pointer moves,
 * then hand the new slot to `onCommit` on release. A committed preview
 * stays shown until `dataVersion` changes (the recordings list was updated
 * or rolled back), so the cell does not jump back in between.
 *
 * @param {Object} args - Hook arguments
 * @param {HTMLElement|null} args.overlayNode - Overlay layer, aligned with the grid content's left edge
 * @param {number} args.timeOrigin - Timestamp at the timeline's left edge
 * @param {number} args.pixelsPerMinute - Current scale factor
 * @param {number} args.sidebarWidth - Sidebar width before the timeline
 * @param {number} args.now - Current timestamp
 * @param {*} args.dataVersion - Changes whenever the recordings list changes
 * @param {Function} args.onCommit - Called with `(recording, { start, end })` when a drag changes the slot
 * @returns {{ draft: Object|null, startResize: Function }} Current preview (`recording`, `edge`, `start`,
 *   `end`, `snappedTo`) and the mousedown handler for a resize handle
 */
const useRecordingResizeDrag = ({
  overlayNode,
  timeOrigin,
  pixelsPerMinute,
  sidebarWidth,
  now,
  dataVersion,
  onCommit,
}) => {
  const [draft, setDraft] = useState(null);
  const paramsRef = useRef(null);
  paramsRef.current = { overlayNode, timeOrigin, pixelsPerMinute, sidebarWidth, now, dataVersion, onCommit };
  const stopRef = useRef(null);

  useEffect(() => () => stopRef.current?.(), []);

  const startResize = useCallback(({ event, recording, edge, snapTargets }) => {
    if (event.button !== 0) return;
    event.preventDefault();

    let latest = { start: recording.raw.start, end: recording.raw.end, snappedTo: null };
    let moved = false;
    setDraft({ recording, edge, ...latest });

    const handleMove = (moveEvent) => {
      const params = paramsRef.current;
      const left = params.overlayNode?.getBoundingClientRect().left ?? 0;
      latest = computeResizedBounds({
        recording,
        edge,
        pointerTime: pointerToTime({ ...params, x: moveEvent.clientX - left }),
        now: params.now,
        snapTargets,
        snapThreshold: (RESIZE_SNAP_PX / params.pixelsPerMinute) * 60,
      });
      moved = true;
      setDraft({ recording, edge, ...latest });
    };

    const listeners = new AbortController();
    const stop = () => {
      listeners.abort();
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      stopRef.current = null;
    };

    const handleUp = () => {
      stop();
      if (moved) swallowNextClick();
      const changed = latest.start !== recording.raw.start || latest.end !== recording.raw.end;
      if (!changed) {
        setDraft(null);
        return;
      }
      setDraft({ recording, edge, ...latest, committedAt: paramsRef.current.dataVersion });
      paramsRef.current.onCommit(recording, { start: latest.start, end: latest.end });
    };

    document.addEventListener('mousemove', handleMove, { signal: listeners.signal });
    document.addEventListener('mouseup', handleUp, { signal: listeners.signal });
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    stopRef.current = stop;
  }, []);

  const isStale = draft !== null && 'committedAt' in draft && draft.committedAt !== dataVersion;
  return { draft: isStale ? null : draft, startResize };
};

export default useRecordingResizeDrag;
