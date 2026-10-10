/**
 * Main EPG page component
 * Orchestrates the toolbar, grid, modals, and filter drawer
 *
 * @returns {React.ReactElement} EPG page
 */

import { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { Box } from '@mui/material';

import Layout from '@/components/Layout';
import useChannels from '@/hooks/useChannels';
import { getCachedChannelPrograms } from '@/hooks/useEpgViewport';
import { NowProvider } from '@/hooks/useCurrentTime';
import useRecenterOnReturn from '@/hooks/useRecenterOnReturn';
import { selectProgram, clearSelection } from '@/store/epgSlice';
import EpgToolbar from './EpgToolbar';
import EpgGrid from './EpgGrid';
import ProgramModal from './ProgramModal';
import ChannelFilter from './ChannelFilter';

const EpgPage = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [filterOpen, setFilterOpen] = useState(false);
  const { channels, isLoading: isLoadingChannels } = useChannels();
  const hiddenChannels = useSelector((state) => state.channels.hiddenChannels);
  const selectedProgramId = useSelector((state) => state.epg.selectedProgramId);
  const selectedChannelUuid = useSelector((state) => state.epg.selectedChannelUuid);
  useRecenterOnReturn();

  const visibleChannels = useMemo(() =>
    channels.filter((ch) => !hiddenChannels.includes(ch.uuid)),
  [channels, hiddenChannels]);

  // The list is keyed only by the channel: the prev/next arrows in the
  // modal navigate inside the array we already computed, and re-reading
  // the cache on every keystroke would re-iterate every byChannel bucket.
  const channelPrograms = useMemo(() =>
    getCachedChannelPrograms(queryClient, selectedChannelUuid),
  [queryClient, selectedChannelUuid]);

  const selectedChannel = useMemo(
    () => channels.find((ch) => ch.uuid === selectedChannelUuid) ?? null,
    [channels, selectedChannelUuid],
  );

  const handleToggleFilter = useCallback(() => {
    setFilterOpen((prev) => !prev);
  }, []);

  const handleCloseModal = useCallback(() => {
    dispatch(clearSelection());
  }, [dispatch]);

  const handleNavigateProgram = useCallback((programId) => {
    dispatch(selectProgram({ programId, channelUuid: selectedChannelUuid }));
  }, [dispatch, selectedChannelUuid]);

  return (
    <NowProvider>
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
          channelPrograms={channelPrograms}
          selectedChannel={selectedChannel}
          onNavigate={handleNavigateProgram}
          onClose={handleCloseModal}
        />
        <ChannelFilter
          open={filterOpen}
          onClose={handleToggleFilter}
          channels={channels}
        />
      </Layout>
    </NowProvider>
  );
};

export default EpgPage;
