/**
 * Absolute layer rendered on top of the EPG grid that surfaces every
 * programmed and recently-finished recording as a thin strip at the bottom
 * of its channel row.
 *
 * Positioning mirrors `ProgramCell`: `left = sidebarWidth + (start - timeOrigin) * px/s`,
 * so any change in `pixelsPerMinute` or `timeOrigin` shifts both layers in
 * lock-step.
 *
 * Dragging an edge of a cell previews the new program slot (with a time
 * label, and a guide line when the edge sticks to a program bound), then
 * hands it to `onResize` on release.
 *
 * @param {Object} props - Component props
 * @param {Array} props.visibleChannels - Sliced channel list (matches ChannelRow's slice)
 * @param {number} props.startIndex - Absolute index of `visibleChannels[0]`
 * @param {number} props.timeOrigin - Unix timestamp at the left edge of the timeline
 * @param {number} props.pixelsPerMinute - Current responsive scale factor
 * @param {number} props.sidebarWidth - Sidebar width offset
 * @param {number} props.viewportStart - Visible window start (seconds)
 * @param {number} props.viewportEnd - Visible window end (seconds)
 * @param {Function} props.onSelect - Called with the recording when the user clicks a cell
 * @param {Function} props.onDelete - Called with the recording when the user clicks the inline delete
 * @param {Map<string, Array>} props.programs - Programs by channel UUID, whose bounds a dragged edge sticks to
 * @param {number} props.now - Current timestamp
 * @param {Function} props.onResize - Called with `(recording, { start, end })` when a drag changes a program slot
 * @returns {React.ReactElement|null} Overlay layer
 */

import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { styled, useTheme } from '@mui/material';

import useRecordingResizeDrag from '@/hooks/useRecordingResizeDrag';
import useRecordingsByChannel from '@/hooks/useRecordingsByChannel';
import { ROW_HEIGHT } from '@/utils/constants';
import { computeRecordingRect, isRecordingInViewport } from '@/utils/recordingPosition';
import { collectSnapTargets } from '@/utils/recordingResize';
import { getRecordingStateColor } from '@/utils/recordingStates';
import { formatTime } from '@/utils/time';

import RecordingCell from './RecordingCell';

const OverlayRoot = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 5,
  '& > *': {
    pointerEvents: 'auto',
  },
});

const ResizeLabel = styled('div')(({ theme }) => ({
  position: 'absolute',
  transform: 'translate(-50%, -100%)',
  marginTop: -4,
  padding: theme.spacing(0.25, 0.75),
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.grey[900],
  color: theme.palette.common.white,
  fontSize: '0.7rem',
  whiteSpace: 'nowrap',
  zIndex: 1,
}));

const SnapGuide = styled('div')({
  position: 'absolute',
  height: ROW_HEIGHT,
  borderLeft: '2px dashed var(--state-color)',
});

const isSameRecording = (a, b) => a.kind === b.kind && a.id === b.id;

/**
 * Recording as shown while its slot is being dragged: the margins keep
 * their length around the previewed slot.
 * @param {Object} recording - Unified recording
 * @param {{ start: number, end: number }} slot - Previewed program slot
 * @returns {Object} Recording with the previewed bounds
 */
const withSlot = (recording, { start, end }) => ({
  ...recording,
  start: start - recording.marginBefore,
  end: end + recording.marginAfter,
  raw: { ...recording.raw, start, end },
});

/**
 * Text of the label shown next to the dragged edge.
 * @param {Object} draft - Drag preview from useRecordingResizeDrag
 * @returns {string} Program bound and real recording bound
 */
const labelFor = (draft) =>
  draft.edge === 'end'
    ? `Fin ${formatTime(draft.end)} · enregistre jusqu'à ${formatTime(draft.end + draft.recording.marginAfter)}`
    : `Début ${formatTime(draft.start)} · enregistre dès ${formatTime(draft.start - draft.recording.marginBefore)}`;

const RecordingsOverlay = memo(
  ({
    visibleChannels,
    startIndex,
    timeOrigin,
    pixelsPerMinute,
    sidebarWidth,
    viewportStart,
    viewportEnd,
    onSelect,
    onDelete,
    programs,
    now,
    onResize,
  }) => {
    const theme = useTheme();
    const recordingsByChannel = useRecordingsByChannel();
    const [overlayNode, setOverlayNode] = useState(null);
    const { draft, startResize } = useRecordingResizeDrag({
      overlayNode,
      timeOrigin,
      pixelsPerMinute,
      sidebarWidth,
      now,
      dataVersion: recordingsByChannel,
      onCommit: onResize,
    });

    // Read at mousedown only, so cells keep a stable callback as programs load.
    const programsRef = useRef(programs);
    programsRef.current = programs;
    const handleResizeStart = useCallback(
      (event, recording, edge) =>
        startResize({
          event,
          recording,
          edge,
          snapTargets: collectSnapTargets(programsRef.current.get(recording.channelUuid)),
        }),
      [startResize],
    );

    const cells = useMemo(() => {
      if (recordingsByChannel.size === 0) return [];

      const result = [];
      for (const [index, channel] of visibleChannels.entries()) {
        const channelRecordings = recordingsByChannel.get(channel.uuid);
        if (channelRecordings) {
          const rowIndex = startIndex + index;
          for (const listed of channelRecordings) {
            const isResizing = draft !== null && isSameRecording(draft.recording, listed);
            const recording = isResizing ? withSlot(listed, draft) : listed;
            if (isRecordingInViewport(recording, viewportStart, viewportEnd)) {
              const rect = computeRecordingRect({
                recording,
                rowIndex,
                timeOrigin,
                pixelsPerMinute,
                sidebarWidth,
              });
              result.push({ recording, rect, isResizing });
            }
          }
        }
      }
      return result;
    }, [
      recordingsByChannel,
      visibleChannels,
      startIndex,
      timeOrigin,
      pixelsPerMinute,
      sidebarWidth,
      viewportStart,
      viewportEnd,
      draft,
    ]);

    if (cells.length === 0) return null;

    // Label and guide only while the mouse is down, not after the release.
    const dragged = draft && !('committedAt' in draft) ? cells.find((cell) => cell.isResizing) : null;
    const xOf = (timestamp) => sidebarWidth + ((timestamp - timeOrigin) / 60) * pixelsPerMinute;

    return (
      <OverlayRoot ref={setOverlayNode}>
        {cells.map(({ recording, rect, isResizing }) => (
          <RecordingCell
            key={`${recording.kind}-${recording.id}`}
            recording={recording}
            rect={rect}
            onSelect={onSelect}
            onDelete={onDelete}
            onResizeStart={handleResizeStart}
            isResizing={isResizing}
          />
        ))}
        {dragged && (
          <ResizeLabel
            style={{
              left: draft.edge === 'end' ? dragged.rect.left + dragged.rect.width : dragged.rect.left,
              top: dragged.rect.top,
              // Inline so it beats the overlay's `& > *` rule that re-enables pointer events.
              pointerEvents: 'none',
            }}
          >
            {labelFor(draft)}
          </ResizeLabel>
        )}
        {dragged && draft.snappedTo !== null && (
          <SnapGuide
            style={{
              left: xOf(draft.snappedTo),
              top: dragged.rect.top + dragged.rect.height - ROW_HEIGHT,
              pointerEvents: 'none',
              '--state-color': getRecordingStateColor(theme, dragged.recording.state),
            }}
          />
        )}
      </OverlayRoot>
    );
  },
);

RecordingsOverlay.displayName = 'RecordingsOverlay';

export default RecordingsOverlay;
