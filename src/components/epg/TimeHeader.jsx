/**
 * Sticky time ruler displaying hour markers
 *
 * @param {Object} props - Component props
 * @param {number} props.timeOrigin - Unix timestamp of the grid's left edge
 * @param {number} props.pixelsPerMinute - Scale factor
 * @param {number} props.totalWidth - Total grid width in pixels
 * @param {number} props.sidebarWidth - Width of the channel sidebar
 * @returns {React.ReactElement} Time header
 */

import { memo, useMemo } from 'react';
import { Typography, styled } from '@mui/material';
import { formatTime, roundToHour } from '@/utils/time';
import { TIME_HEADER_HEIGHT } from '@/utils/constants';

const HeaderRoot = styled('div')(({ theme }) => ({
  height: TIME_HEADER_HEIGHT,
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const Marker = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  borderLeft: `1px solid ${theme.palette.divider}`,
  paddingLeft: theme.spacing(0.5),
}));

const TimeHeader = memo(({ timeOrigin, pixelsPerMinute, totalWidth, sidebarWidth }) => {
  const markers = useMemo(() => {
    const pixelsPerHour = pixelsPerMinute * 60;
    const hoursVisible = Math.ceil(totalWidth / pixelsPerHour) + 2;
    const firstHour = roundToHour(timeOrigin);
    const result = [];

    for (let index = -1; index < hoursVisible; index += 1) {
      const ts = firstHour + index * 3600;
      const offsetMinutes = (ts - timeOrigin) / 60;
      const leftPx = sidebarWidth + offsetMinutes * pixelsPerMinute;

      result.push({ ts, leftPx, label: formatTime(ts) });
    }

    return result;
  }, [timeOrigin, pixelsPerMinute, totalWidth, sidebarWidth]);

  return (
    <HeaderRoot style={{ width: totalWidth }}>
      {markers.map(({ ts, leftPx, label }) => (
        <Marker key={ts} style={{ left: leftPx }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            {label}
          </Typography>
        </Marker>
      ))}
    </HeaderRoot>
  );
});

TimeHeader.displayName = 'TimeHeader';

export default TimeHeader;
