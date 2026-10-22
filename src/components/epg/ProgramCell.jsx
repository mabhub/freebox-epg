/**
 * Individual program cell in the EPG grid
 * Positioned absolutely based on start time and duration
 *
 * @param {Object} props - Component props
 * @param {Object} props.program - EPG program data
 * @param {number} props.timeOrigin - Unix timestamp of the grid's left edge
 * @param {number} props.pixelsPerMinute - Scale factor
 * @param {number} props.sidebarWidth - Width of the channel sidebar
 * @param {string} props.channelUuid - UUID of the parent channel
 * @param {boolean} props.isOnAir - Whether the program is currently airing (computed by ChannelRow)
 * @param {string|null} [props.groupTitle] - Title of the series band the cell sits under; the cell then
 *   moves below the band, drops its thumbnail and hides its title when it is the band's
 * @param {Function} props.onSelect - Callback when program is clicked
 * @returns {React.ReactElement} Program cell
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Skeleton, Typography, Tooltip, styled, useMediaQuery } from '@mui/material';
import { formatTime } from '@/utils/time';
import { getCategoryColor, getCategoryAccent } from '@/utils/categories';
import formatSeasonEpisode from '@/utils/programs';
import { CELL_GAP_PX, ROW_HEIGHT, SERIES_BAND_HEIGHT } from '@/utils/constants';
import { usePrefetchProgram } from '@/hooks/useProgramDetail';
import useFreeboxImage from '@/hooks/useFreeboxImage';

const MIN_CELL_WIDTH = 8;
const THUMBNAIL_MIN_WIDTH = 120;
const SUBTITLE_MIN_WIDTH = 50;
const PREFETCH_DELAY_MS = 500;
const TOOLTIP_IDLE_DELAY_MS = 250;

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

const THUMBNAIL_BOX = {
  width: 50,
  height: 38,
  borderRadius: 2,
  flexShrink: 0,
};

const Thumbnail = styled('img')({
  ...THUMBNAIL_BOX,
  objectFit: 'cover',
  pointerEvents: 'none',
});

const ThumbnailPlaceholder = styled(Skeleton)(THUMBNAIL_BOX);

/**
 * Program thumbnail loaded through the request queue. A placeholder of the
 * same size holds its space until it arrives, so the title does not shift;
 * it stops pulsing if the image never comes.
 * @param {Object} props - Component props
 * @param {string} props.url - Image URL
 * @returns {React.ReactElement} Thumbnail or placeholder
 */
const ProgramThumbnail = ({ url }) => {
  const { src, failed } = useFreeboxImage(url);
  return src ? (
    <Thumbnail src={src} alt="" />
  ) : (
    <ThumbnailPlaceholder variant="rectangular" animation={failed ? false : 'pulse'} />
  );
};

const TextContainer = styled('div')({
  minWidth: 0,
  overflow: 'hidden',
});

/** Cell bounds under a series band: 2 px above the band, 2 px between band and cell, 2 px at the bottom */
const GROUPED_CELL_BOUNDS = { top: SERIES_BAND_HEIGHT + 4, height: ROW_HEIGHT - SERIES_BAND_HEIGHT - 6 };

/**
 * The two text lines of a cell. Under a band carrying its title, the
 * subtitle takes the first line and season/episode the second.
 * @param {Object} program - EPG program
 * @param {string|null} groupTitle - Title shown by the band above the cell, if any
 * @returns {{ main: string, secondary: string|null }} Bold line and secondary line
 */
const cellLines = (program, groupTitle) => {
  const seasonEp = formatSeasonEpisode(program);
  if (program.title !== groupTitle) {
    return { main: program.title, secondary: program.sub_title ?? seasonEp };
  }
  if (program.sub_title) {
    return { main: program.sub_title, secondary: seasonEp };
  }
  return { main: seasonEp ?? program.title, secondary: null };
};

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

const ProgramCell = memo(
  ({ program, timeOrigin, pixelsPerMinute, sidebarWidth, channelUuid, isOnAir, onSelect, groupTitle = null }) => {
    const offsetMinutes = (program.date - timeOrigin) / 60;
    const durationMinutes = program.duration / 60;
    const leftPx = sidebarWidth + offsetMinutes * pixelsPerMinute;
    const widthPx = Math.max(MIN_CELL_WIDTH, durationMinutes * pixelsPerMinute - CELL_GAP_PX);
    const categoryBg = getCategoryColor(program.category);
    const categoryAccent = getCategoryAccent(program.category);
    const prefetchProgram = usePrefetchProgram();
    const prefetchTimer = useRef(null);
    const idleTimer = useRef(null);
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const supportsHover = useMediaQuery('(hover: hover) and (pointer: fine)');
    const { main, secondary } = cellLines(program, groupTitle);

    const handleClick = useCallback(() => {
      onSelect(program.id, channelUuid);
    }, [onSelect, program.id, channelUuid]);

    const scheduleTooltip = useCallback(() => {
      if (!supportsHover) return;
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setTooltipOpen(true), TOOLTIP_IDLE_DELAY_MS);
    }, [supportsHover]);

    const handleMouseEnter = useCallback(() => {
      prefetchTimer.current = setTimeout(() => {
        prefetchProgram(program.id);
      }, PREFETCH_DELAY_MS);
      scheduleTooltip();
    }, [prefetchProgram, program.id, scheduleTooltip]);

    const handleMouseMove = useCallback(() => {
      setTooltipOpen(false);
      scheduleTooltip();
    }, [scheduleTooltip]);

    const handleMouseLeave = useCallback(() => {
      if (prefetchTimer.current) {
        clearTimeout(prefetchTimer.current);
        prefetchTimer.current = null;
      }
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
        idleTimer.current = null;
      }
      setTooltipOpen(false);
    }, []);

    useEffect(
      () => () => {
        clearTimeout(prefetchTimer.current);
        clearTimeout(idleTimer.current);
      },
      [],
    );

    const tooltipContent = useMemo(() => {
      const startTime = formatTime(program.date);
      const endTime = formatTime(program.date + program.duration);
      const seasonEp = formatSeasonEpisode(program);
      const desc = program.desc ?? program.short_desc ?? '';
      const truncatedDesc = desc.length > 200 ? `${desc.slice(0, 200)}…` : desc;

      return (
        <Box sx={{ maxWidth: 300 }}>
          <Typography variant="caption" color="text.secondary">
            {program.category_name} &bull; {startTime} - {endTime}
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {program.title}
            {seasonEp ? ` ${seasonEp}` : ''}
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
        open={tooltipOpen}
        placement="bottom-start"
        arrow
        disableInteractive
        disableHoverListener
        disableFocusListener
        disableTouchListener
        slotProps={TOOLTIP_SLOT_PROPS}
      >
        <CellRoot
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            left: leftPx,
            width: widthPx,
            ...(groupTitle !== null && GROUPED_CELL_BOUNDS),
            ...(categoryBg && { backgroundColor: categoryBg }),
            ...(isOnAir && { opacity: 1 }),
            ...(categoryAccent && { borderLeft: `3px solid ${categoryAccent}` }),
          }}
        >
          {groupTitle === null && widthPx >= THUMBNAIL_MIN_WIDTH && program.picture && (
            <ProgramThumbnail url={program.picture} />
          )}
          <TextContainer>
            <Typography variant="caption" fontWeight="bold" noWrap sx={{ display: 'block', lineHeight: 1.3 }}>
              {main}
            </Typography>
            {widthPx >= SUBTITLE_MIN_WIDTH && secondary && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', lineHeight: 1.2 }}>
                {secondary}
              </Typography>
            )}
          </TextContainer>
        </CellRoot>
      </Tooltip>
    );
  },
);

ProgramCell.displayName = 'ProgramCell';

export default ProgramCell;
