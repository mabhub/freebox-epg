/**
 * Single channel row in the EPG grid
 * Contains the sticky sidebar and program cells
 *
 * @param {Object} props - Component props
 * @param {Object} props.channel - Channel data
 * @param {Array} props.programs - Programs for this channel
 * @param {number} props.rowIndex - Absolute row index for positioning
 * @param {number} props.timeOrigin - Unix timestamp of the grid's left edge
 * @param {number} props.pixelsPerMinute - Scale factor
 * @param {number} props.sidebarWidth - Sidebar width in pixels
 * @param {boolean} props.isMobile - Whether in mobile viewport
 * @param {Function} props.onSelectProgram - Callback when a program is clicked
 * @returns {React.ReactElement} Channel row
 */

import { memo, useMemo } from 'react';
import { styled } from '@mui/material';
import { ROW_HEIGHT } from '@/utils/constants';
import useCurrentTime from '@/hooks/useCurrentTime';
import ChannelSidebar from './ChannelSidebar';
import ProgramCell from './ProgramCell';

const RowRoot = styled('div')({
  position: 'absolute',
  left: 0,
  right: 0,
  height: ROW_HEIGHT,
  display: 'flex',
});

const ChannelRow = memo(({
  channel,
  programs,
  rowIndex,
  timeOrigin,
  pixelsPerMinute,
  sidebarWidth,
  isMobile,
  onSelectProgram,
}) => {
  // Resolve the on-air program once per row instead of letting every cell
  // subscribe to the minute tick context — a row of 30 cells used to
  // re-render in full each minute even though at most one of them flips.
  const now = useCurrentTime();
  const onAirProgramId = useMemo(() => {
    const onAir = programs.find((p) => now >= p.date && now < p.date + p.duration);
    return onAir?.id ?? null;
  }, [programs, now]);

  return (
    <RowRoot style={{ top: rowIndex * ROW_HEIGHT }}>
      <ChannelSidebar
        channel={channel}
        sidebarWidth={sidebarWidth}
        isMobile={isMobile}
      />
      {programs.map((program) => (
        <ProgramCell
          key={program.id}
          program={program}
          timeOrigin={timeOrigin}
          pixelsPerMinute={pixelsPerMinute}
          sidebarWidth={sidebarWidth}
          channelUuid={channel.uuid}
          isOnAir={program.id === onAirProgramId}
          onSelect={onSelectProgram}
        />
      ))}
    </RowRoot>
  );
});

ChannelRow.displayName = 'ChannelRow';

export default ChannelRow;
