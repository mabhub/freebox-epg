/**
 * Sticky channel sidebar showing logo, number, and name
 *
 * @param {Object} props - Component props
 * @param {Object} props.channel - Channel data
 * @param {number} props.sidebarWidth - Sidebar width in pixels
 * @param {boolean} props.isMobile - Whether in mobile viewport
 * @returns {React.ReactElement} Channel sidebar cell
 */

import { memo, useMemo } from 'react';
import { Box, Typography, Tooltip, styled } from '@mui/material';
import getLogoUrl from '@/utils/images';

const SidebarRoot = styled('div')(({ theme }) => ({
  position: 'sticky',
  left: 0,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: `0 ${theme.spacing(0.5)}`,
  backgroundColor: '#2c2c2c',
  color: '#fff',
  borderRight: `1px solid ${theme.palette.divider}`,
  zIndex: 3,
  overflow: 'hidden',
}));

const ChannelLogo = styled('img')({
  objectFit: 'contain',
  flexShrink: 0,
});

const TextBlock = styled('div')({
  minWidth: 0,
});

const ChannelSidebar = memo(({ channel, sidebarWidth, isMobile }) => {
  const tooltipContent = useMemo(() => (
    <Box>
      <Typography variant="subtitle2">{channel.name}</Typography>
      <Typography variant="body2">N° {channel.number}</Typography>
      {channel.hasAbo && (
        <Typography variant="caption" color="warning.main">
          Abonnement requis
        </Typography>
      )}
    </Box>
  ), [channel.name, channel.number, channel.hasAbo]);

  return (
    <Tooltip title={tooltipContent} placement="right" arrow>
      <SidebarRoot style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
        <ChannelLogo
          src={getLogoUrl(channel.uuid)}
          alt={channel.name}
          loading="lazy"
          style={{
            width: isMobile ? 32 : 40,
            height: isMobile ? 28 : 35,
          }}
        />
        {!isMobile && (
          <TextBlock>
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
          </TextBlock>
        )}
      </SidebarRoot>
    </Tooltip>
  );
});

ChannelSidebar.displayName = 'ChannelSidebar';

export default ChannelSidebar;
