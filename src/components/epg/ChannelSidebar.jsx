/**
 * Sticky channel sidebar showing logo, number, and name
 *
 * @param {Object} props - Component props
 * @param {Object} props.channel - Channel data
 * @param {number} props.sidebarWidth - Sidebar width in pixels
 * @param {boolean} props.isMobile - Whether in mobile viewport
 * @returns {React.ReactElement} Channel sidebar cell
 */

import { memo } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { getLogoUrl } from '@/utils/images';

const ChannelSidebar = memo(({ channel, sidebarWidth, isMobile }) => {
  const tooltipContent = (
    <Box>
      <Typography variant="subtitle2">{channel.name}</Typography>
      <Typography variant="body2">N° {channel.number}</Typography>
      {channel.hasAbo && (
        <Typography variant="caption" color="warning.main">
          Abonnement requis
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} placement="right" arrow>
      <Box
        sx={{
          position: 'sticky',
          left: 0,
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 0.5,
          backgroundColor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          zIndex: 3,
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={getLogoUrl(channel.uuid)}
          alt={channel.name}
          sx={{
            width: isMobile ? 32 : 40,
            height: isMobile ? 28 : 35,
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />
        {!isMobile && (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              fontWeight="bold"
              noWrap
              sx={{ display: 'block', lineHeight: 1.2 }}
            >
              {channel.number}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ display: 'block', lineHeight: 1.2 }}
            >
              {channel.shortName ?? channel.name}
            </Typography>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
});

ChannelSidebar.displayName = 'ChannelSidebar';

export default ChannelSidebar;
