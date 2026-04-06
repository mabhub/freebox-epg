/**
 * Vertical line indicating the current time on the EPG grid
 *
 * @param {Object} props - Component props
 * @param {number} props.timeOrigin - Unix timestamp of the grid's left edge
 * @param {number} props.pixelsPerMinute - Scale factor
 * @param {number} props.now - Current Unix timestamp
 * @param {number} props.sidebarWidth - Width of the channel sidebar
 * @returns {React.ReactElement|null} Now indicator line
 */

import { memo } from 'react';
import { Box } from '@mui/material';

const NowIndicator = memo(({ timeOrigin, pixelsPerMinute, now, sidebarWidth }) => {
  const offsetSeconds = now - timeOrigin;

  if (offsetSeconds < 0) {
    return null;
  }

  const leftPx = sidebarWidth + (offsetSeconds / 60) * pixelsPerMinute;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: leftPx,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: 'secondary.main',
        zIndex: 4,
        pointerEvents: 'none',
      }}
    />
  );
});

NowIndicator.displayName = 'NowIndicator';

export default NowIndicator;
