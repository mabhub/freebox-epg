/**
 * Single channel row in the EPG grid
 * Contains the sticky sidebar and program cells
 *
 * @param {Object} props - Component props
 * @param {Object} props.channel - Channel data
 * @param {Array} props.programs - Programs for this channel
 * @param {number} props.rowIndex - Absolute row index for positioning
 * @param {number} props.rowHeight - Row height in pixels
 * @param {number} props.timeOrigin - Unix timestamp of the grid's left edge
 * @param {number} props.pixelsPerMinute - Scale factor
 * @param {number} props.sidebarWidth - Sidebar width in pixels
 * @param {boolean} props.isMobile - Whether in mobile viewport
 * @param {Function} props.onSelectProgram - Callback when a program is clicked
 * @returns {React.ReactElement} Channel row
 */

import { memo } from 'react';
import { Box } from '@mui/material';
import ChannelSidebar from './ChannelSidebar';
import ProgramCell from './ProgramCell';

const ChannelRow = memo(({
  channel,
  programs,
  rowIndex,
  rowHeight,
  timeOrigin,
  pixelsPerMinute,
  sidebarWidth,
  isMobile,
  onSelectProgram,
}) => (
  <Box
    sx={{
      position: 'absolute',
      top: rowIndex * rowHeight,
      left: 0,
      right: 0,
      height: rowHeight,
      display: 'flex',
    }}
  >
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
        onSelect={onSelectProgram}
      />
    ))}
  </Box>
));

ChannelRow.displayName = 'ChannelRow';

export default ChannelRow;
