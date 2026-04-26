/**
 * Absolute layer rendered on top of the EPG grid that surfaces every
 * programmed and recently-finished recording as a thin strip at the bottom
 * of its channel row.
 *
 * Positioning mirrors `ProgramCell`: `left = sidebarWidth + (start - timeOrigin) * px/s`,
 * so any change in `pixelsPerMinute` or `timeOrigin` shifts both layers in
 * lock-step.
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
 * @returns {React.ReactElement|null} Overlay layer
 */

import { memo, useMemo } from 'react';
import { styled } from '@mui/material';

import useRecordingsByChannel from '@/hooks/useRecordingsByChannel';
import { computeRecordingRect, isRecordingInViewport } from '@/utils/recordingPosition';

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

const RecordingsOverlay = memo(({
  visibleChannels,
  startIndex,
  timeOrigin,
  pixelsPerMinute,
  sidebarWidth,
  viewportStart,
  viewportEnd,
  onSelect,
  onDelete,
}) => {
  const recordingsByChannel = useRecordingsByChannel();

  const cells = useMemo(() => {
    if (recordingsByChannel.size === 0) return [];

    const result = [];
    for (const [index, channel] of visibleChannels.entries()) {
      const channelRecordings = recordingsByChannel.get(channel.uuid);
      if (channelRecordings) {
        const rowIndex = startIndex + index;
        for (const recording of channelRecordings) {
          if (isRecordingInViewport(recording, viewportStart, viewportEnd)) {
            const rect = computeRecordingRect({
              recording,
              rowIndex,
              timeOrigin,
              pixelsPerMinute,
              sidebarWidth,
            });
            result.push({ recording, rect });
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
  ]);

  if (cells.length === 0) return null;

  return (
    <OverlayRoot>
      {cells.map(({ recording, rect }) => (
        <RecordingCell
          key={`${recording.kind}-${recording.id}`}
          recording={recording}
          rect={rect}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </OverlayRoot>
  );
});

RecordingsOverlay.displayName = 'RecordingsOverlay';

export default RecordingsOverlay;
