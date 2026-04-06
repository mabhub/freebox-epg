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

import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { getThumbnailUrl } from '@/utils/images';
import { formatTime } from '@/utils/time';
import getCategoryColor from '@/utils/categories';
import useCurrentTime from '@/hooks/useCurrentTime';
import { usePrefetchProgram } from '@/hooks/useProgramDetail';

const MIN_CELL_WIDTH = 8;
const CELL_GAP = 4;
const THUMBNAIL_MIN_WIDTH = 120;
const SUBTITLE_MIN_WIDTH = 100;
const PREFETCH_DELAY_MS = 500;

const ProgramCell = memo(({
  program,
  timeOrigin,
  pixelsPerMinute,
  sidebarWidth,
  rowHeight,
  onSelect,
}) => {
  const now = useCurrentTime();
  const offsetMinutes = (program.date - timeOrigin) / 60;
  const durationMinutes = program.duration / 60;
  const leftPx = sidebarWidth + offsetMinutes * pixelsPerMinute;
  const widthPx = Math.max(MIN_CELL_WIDTH, durationMinutes * pixelsPerMinute - CELL_GAP);
  const thumbnailUrl = getThumbnailUrl(program.picture);
  const categoryBg = getCategoryColor(program.category);
  const isOnAir = now >= program.date && now < program.date + program.duration;
  const prefetchProgram = usePrefetchProgram();
  const prefetchTimer = useRef(null);

  const handleClick = useCallback(() => {
    onSelect(program.id);
  }, [onSelect, program.id]);

  const handleMouseEnter = useCallback(() => {
    prefetchTimer.current = setTimeout(() => {
      prefetchProgram(program.id);
    }, PREFETCH_DELAY_MS);
  }, [prefetchProgram, program.id]);

  const handleMouseLeave = useCallback(() => {
    if (prefetchTimer.current) {
      clearTimeout(prefetchTimer.current);
      prefetchTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearTimeout(prefetchTimer.current), []);

  const tooltipContent = useMemo(() => {
    const startTime = formatTime(program.date);
    const endTime = formatTime(program.date + program.duration);
    const seasonEp = program.season_number
      ? ` s${program.season_number}${program.episode_number ? `e${program.episode_number}` : ''}`
      : '';
    const desc = program.desc ?? program.short_desc ?? '';
    const truncatedDesc = desc.length > 200 ? `${desc.slice(0, 200)}…` : desc;

    return (
      <Box sx={{ maxWidth: 300 }}>
        <Typography variant="caption" color="text.secondary">
          {program.category_name} &bull; {startTime} - {endTime}
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          {program.title}{seasonEp}
        </Typography>
        {program.sub_title && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {program.sub_title}
          </Typography>
        )}
        {truncatedDesc && (
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block', lineHeight: 1.4 }}>
            {truncatedDesc}
          </Typography>
        )}
      </Box>
    );
  }, [program]);

  return (
    <Tooltip
      title={tooltipContent}
      enterDelay={400}
      enterNextDelay={200}
      placement="bottom-start"
      arrow
      disableInteractive
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 4,
            border: 1,
            borderColor: 'divider',
            '& .MuiTooltip-arrow': {
              color: 'background.paper',
            },
          },
        },
      }}
    >
    <Box
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
        backgroundColor: categoryBg || 'action.hover',
        opacity: isOnAir ? 1 : 0.55,
        border: 1,
        borderColor: 'divider',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        '&:hover': {
          backgroundColor: 'action.selected',
        },
      }}
    >
      {thumbnailUrl && widthPx >= THUMBNAIL_MIN_WIDTH && (
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
            pointerEvents: 'none',
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
        {widthPx >= SUBTITLE_MIN_WIDTH && (program.sub_title || program.season_number) && (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: 'block', lineHeight: 1.2 }}
          >
            {program.sub_title ?? `s${program.season_number}${program.episode_number ? `e${program.episode_number}` : ''}`}
          </Typography>
        )}
      </Box>
    </Box>
    </Tooltip>
  );
});

ProgramCell.displayName = 'ProgramCell';

export default ProgramCell;
