/**
 * Main EPG page component
 * Orchestrates the toolbar, grid, modals, and filter drawer
 *
 * @returns {React.ReactElement} EPG page
 */

import { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box } from '@mui/material';

import Layout from '@/components/Layout';
import useChannels from '@/hooks/useChannels';
import EpgToolbar from './EpgToolbar';
import EpgGrid from './EpgGrid';

const EpgPage = () => {
  const [_filterOpen, setFilterOpen] = useState(false);
  const { channels, isLoading: isLoadingChannels } = useChannels();
  const hiddenChannels = useSelector((state) => state.channels.hiddenChannels);

  const visibleChannels = useMemo(() =>
    channels.filter((ch) => !hiddenChannels.includes(ch.uuid)),
  [channels, hiddenChannels]);

  const handleToggleFilter = useCallback(() => {
    setFilterOpen((prev) => !prev);
  }, []);

  return (
    <Layout>
      <EpgToolbar onToggleFilter={handleToggleFilter} />
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <EpgGrid
          channels={visibleChannels}
          isLoadingChannels={isLoadingChannels}
        />
      </Box>
    </Layout>
  );
};

export default EpgPage;
