/**
 * Main EPG page component
 * Orchestrates the toolbar, grid, modals, and filter drawer
 *
 * @returns {React.ReactElement} EPG page
 */

import { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box } from '@mui/material';

import Layout from '@/components/Layout';
import useChannels from '@/hooks/useChannels';
import { clearSelection } from '@/store/epgSlice';
import EpgToolbar from './EpgToolbar';
import EpgGrid from './EpgGrid';
import ProgramModal from './ProgramModal';
import ChannelFilter from './ChannelFilter';

const EpgPage = () => {
  const dispatch = useDispatch();
  const [filterOpen, setFilterOpen] = useState(false);
  const { channels, isLoading: isLoadingChannels } = useChannels();
  const hiddenChannels = useSelector((state) => state.channels.hiddenChannels);
  const selectedProgramId = useSelector((state) => state.epg.selectedProgramId);

  const visibleChannels = useMemo(() =>
    channels.filter((ch) => !hiddenChannels.includes(ch.uuid)),
  [channels, hiddenChannels]);

  const handleToggleFilter = useCallback(() => {
    setFilterOpen((prev) => !prev);
  }, []);

  const handleCloseModal = useCallback(() => {
    dispatch(clearSelection());
  }, [dispatch]);

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
      <ProgramModal
        programId={selectedProgramId}
        onClose={handleCloseModal}
      />
      <ChannelFilter
        open={filterOpen}
        onClose={handleToggleFilter}
        channels={channels}
      />
    </Layout>
  );
};

export default EpgPage;
