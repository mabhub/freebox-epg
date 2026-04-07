/**
 * Individual program cell in the EPG grid
 * Positioned absolutely based on start time and duration
 *
 * @param {Object} props - Component props
 * @param {Object} props.program - EPG program data
 * @param {number} props.timeOrigin - Unix timestamp of the grid's left edge
 * @param {number} props.pixelsPerMinute - Scale factor
 * @param {number} props.sidebarWidth - Width of the channel sidebar
 * @param {Function} props.onSelect - Callback when program is clicked
 * @returns {React.ReactElement} Program cell
 */

import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Box, Typography, Tooltip, styled } from '@mui/material';
import { getThumbnailUrl } from '@/utils/images';
import { formatTime } from '@/utils/time';
import { getCategoryColor, getCategoryAccent } from '@/utils/categories';
import { ROW_HEIGHT } from '@/utils/constants';
import useCurrentTime from '@/hooks/useCurrentTime';
import { usePrefetchProgram } from '@/hooks/useProgramDetail';

const MIN_CELL_WIDTH = 8;
const CELL_GAP = 4;
const THUMBNAIL_MIN_WIDTH = 120;
const SUBTITLE_MIN_WIDTH = 50;
const PREFETCH_DELAY_MS = 500;

const CellRoot = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 2,
  height: ROW_HEIGHT - 4,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: `0 ${theme.spacing(0.5)}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.action.hover,
  opacity: 0.55,
  cursor: 'pointer',
  transition: 'background-color 0.15s',
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const Thumbnail = styled('img')({
  width: 50,
  height: 38,
  objectFit: 'cover',
  borderRadius: 2,
  flexShrink: 0,
  pointerEvents: 'none',
});

const TextContainer = styled('div')({
  minWidth: 0,
  overflow: 'hidden',
});

const TOOLTIP_SLOT_PROPS = {
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
};

const ProgramCell = memo(({
  program,
  timeOrigin,
  pixelsPerMinute,
  sidebarWidth,
  channelUuid,
  onSelect,
}) => {
  const now = useCurrentTime();
  const offsetMinutes = (program.date - timeOrigin) / 60;
  const durationMinutes = program.duration / 60;
  const leftPx = sidebarWidth + offsetMinutes * pixelsPerMinute;
  const widthPx = Math.max(MIN_CELL_WIDTH, durationMinutes * pixelsPerMinute - CELL_GAP);
  const thumbnailUrl = getThumbnailUrl(program.picture);
  const categoryBg = getCategoryColor(program.category);
  const categoryAccent = getCategoryAccent(program.category);
  const isOnAir = now >= program.date && now < program.date + program.duration;
  const prefetchProgram = usePrefetchProgram();
  const prefetchTimer = useRef(null);

  const handleClick = useCallback(() => {
    onSelect(program.id, channelUuid);
  }, [onSelect, program.id, channelUuid]);

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
      slotProps={TOOLTIP_SLOT_PROPS}
    >
    <CellRoot
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        left: leftPx,
        width: widthPx,
        ...(categoryBg && { backgroundColor: categoryBg }),
        ...(isOnAir && { opacity: 1 }),
        ...(categoryAccent && { borderLeft: `3px solid ${categoryAccent}` }),
      }}
    >
      {thumbnailUrl && widthPx >= THUMBNAIL_MIN_WIDTH && (
        <Thumbnail
          src={thumbnailUrl}
          alt=""
          loading="lazy"
        />
      )}
      <TextContainer>
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
      </TextContainer>
    </CellRoot>
    </Tooltip>
  );
});

ProgramCell.displayName = 'ProgramCell';

export default ProgramCell;
