/**
 * Individual program cell in the EPG grid
 * Positioned absolutely based on start time and duration
 *
 * @param {Object} props - Component props
 * @param {Object} props.program - EPG program data
 * @param {number} props.timeOrigin - Unix timestamp of the grid's left edge
 * @param {number} props.pixelsPerMinute - Scale factor
 * @param {number} props.sidebarWidth - Width of the channel sidebar
 * @param {number} props.rowHeight - Height of the row
 * @param {Function} props.onSelect - Callback when program is clicked
 * @returns {React.ReactElement} Program cell
 */

import { memo, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { getThumbnailUrl } from '@/utils/images';

const MIN_CELL_WIDTH = 40;
const CELL_GAP = 1;

const ProgramCell = memo(({
  program,
  timeOrigin,
  pixelsPerMinute,
  sidebarWidth,
  rowHeight,
  onSelect,
}) => {
  const offsetMinutes = (program.date - timeOrigin) / 60;
  const durationMinutes = program.duration / 60;
  const leftPx = sidebarWidth + offsetMinutes * pixelsPerMinute;
  const widthPx = Math.max(MIN_CELL_WIDTH, durationMinutes * pixelsPerMinute - CELL_GAP);
  const thumbnailUrl = getThumbnailUrl(program.picture);

  const handleClick = useCallback(() => {
    onSelect(program.id);
  }, [onSelect, program.id]);

  return (
    <Box
      onClick={handleClick}
      sx={{
        position: 'absolute',
        left: leftPx,
        top: 2,
        width: widthPx,
        height: rowHeight - 4,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.5,
        borderRadius: 0.5,
        overflow: 'hidden',
        backgroundColor: 'action.hover',
        border: 1,
        borderColor: 'divider',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        '&:hover': {
          backgroundColor: 'action.selected',
        },
      }}
    >
      {thumbnailUrl && (
        <Box
          component="img"
          src={thumbnailUrl}
          alt=""
          loading="lazy"
          sx={{
            width: 50,
            height: 38,
            objectFit: 'cover',
            borderRadius: 0.5,
            flexShrink: 0,
          }}
        />
      )}
      <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
        <Typography
          variant="caption"
          fontWeight="bold"
          noWrap
          sx={{ display: 'block', lineHeight: 1.3 }}
        >
          {program.title}
        </Typography>
        {program.sub_title && (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: 'block', lineHeight: 1.2 }}
          >
            {program.sub_title}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

ProgramCell.displayName = 'ProgramCell';

export default ProgramCell;
