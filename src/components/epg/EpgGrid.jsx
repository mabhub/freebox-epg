/**
 * Main EPG grid container
 * Orchestrates virtual scrolling, drag-to-scroll, and data loading
 *
 * @param {Object} props - Component props
 * @param {Array} props.channels - Visible (filtered) channel list
 * @param {boolean} props.isLoadingChannels - Whether channels are still loading
 * @returns {React.ReactElement} EPG grid
 */

import { useRef, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, CircularProgress, Typography } from '@mui/material';

import { setScroll, selectProgram } from '@/store/epgSlice';
import useVirtualChannels from '@/hooks/useVirtualChannels';
import useEpgViewport from '@/hooks/useEpgViewport';
import useDragScroll from '@/hooks/useDragScroll';
import useCurrentTime from '@/hooks/useCurrentTime';
import useLayoutConstants from '@/hooks/useLayoutConstants';
import { ROW_HEIGHT, TIME_HEADER_HEIGHT } from '@/utils/constants';

import TimeHeader from './TimeHeader';
import ChannelRow from './ChannelRow';
import NowIndicator from './NowIndicator';

const HOURS_TO_RENDER = 24;

const EpgGrid = ({ channels, isLoadingChannels }) => {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const { timeOrigin, scrollTop } = useSelector((state) => state.epg);
  const { sidebarWidth, pixelsPerMinute, isMobile } = useLayoutConstants();
  const now = useCurrentTime();

  const totalWidth = sidebarWidth + HOURS_TO_RENDER * 60 * pixelsPerMinute;

  const { visibleChannels, startIndex, totalHeight } = useVirtualChannels({
    channels,
    scrollTop,
    containerHeight: containerHeight - TIME_HEADER_HEIGHT,
  });

  const { programs, isLoading: isLoadingPrograms } = useEpgViewport(
    containerRef.current?.clientWidth ?? 1200,
  );

  const handleScrollChange = useCallback(({ scrollLeft }) => {
    dispatch(setScroll({ scrollLeft }));
  }, [dispatch]);

  useDragScroll(scrollContainerRef, handleScrollChange);

  const handleVerticalScroll = useCallback((event) => {
    dispatch(setScroll({ scrollTop: event.target.scrollTop }));
  }, [dispatch]);

  const handleContainerRef = useCallback((node) => {
    containerRef.current = node;
    if (node) {
      setContainerHeight(node.clientHeight);
    }
  }, []);

  const handleSelectProgram = useCallback((programId) => {
    dispatch(selectProgram(programId));
  }, [dispatch]);

  const getChannelPrograms = useCallback((channelUuid) =>
    programs.get(channelUuid) ?? [], [programs]);

  const gridContent = useMemo(() =>
    visibleChannels.map((channel, index) => (
      <ChannelRow
        key={channel.uuid}
        channel={channel}
        programs={getChannelPrograms(channel.uuid)}
        rowIndex={startIndex + index}
        rowHeight={ROW_HEIGHT}
        timeOrigin={timeOrigin}
        pixelsPerMinute={pixelsPerMinute}
        sidebarWidth={sidebarWidth}
        isMobile={isMobile}
        onSelectProgram={handleSelectProgram}
      />
    )), [
    visibleChannels,
    startIndex,
    timeOrigin,
    pixelsPerMinute,
    sidebarWidth,
    isMobile,
    handleSelectProgram,
    getChannelPrograms,
  ]);

  if (isLoadingChannels) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>Chargement des chaînes...</Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={handleContainerRef}
      sx={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        ref={scrollContainerRef}
        onScroll={handleVerticalScroll}
        sx={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          cursor: 'grab',
          touchAction: 'pan-y',
        }}
      >
        <TimeHeader
          timeOrigin={timeOrigin}
          pixelsPerMinute={pixelsPerMinute}
          totalWidth={totalWidth}
          sidebarWidth={sidebarWidth}
        />
        <Box
          sx={{
            position: 'relative',
            width: totalWidth,
            height: totalHeight,
          }}
        >
          {gridContent}
          <NowIndicator
            timeOrigin={timeOrigin}
            pixelsPerMinute={pixelsPerMinute}
            now={now}
            sidebarWidth={sidebarWidth}
          />
        </Box>
      </Box>
      {isLoadingPrograms && (
        <CircularProgress
          size={24}
          sx={{
            position: 'absolute',
            top: TIME_HEADER_HEIGHT + 8,
            right: 8,
          }}
        />
      )}
    </Box>
  );
};

export default EpgGrid;
