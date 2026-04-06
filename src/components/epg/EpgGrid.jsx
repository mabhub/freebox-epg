/**
 * Main EPG grid container
 * Orchestrates virtual scrolling, drag-to-scroll, and data loading
 *
 * @param {Object} props - Component props
 * @param {Array} props.channels - Visible (filtered) channel list
 * @param {boolean} props.isLoadingChannels - Whether channels are still loading
 * @returns {React.ReactElement} EPG grid
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, CircularProgress, Typography } from '@mui/material';

import { setScroll, selectProgram } from '@/store/epgSlice';
import useVirtualChannels from '@/hooks/useVirtualChannels';
import useEpgViewport from '@/hooks/useEpgViewport';
import useDragScroll from '@/hooks/useDragScroll';
import useCurrentTime from '@/hooks/useCurrentTime';
import useLayoutConstants from '@/hooks/useLayoutConstants';
import { ROW_HEIGHT, TIME_HEADER_HEIGHT, PAST_HOURS } from '@/utils/constants';

import TimeHeader from './TimeHeader';
import ChannelRow from './ChannelRow';
import NowIndicator from './NowIndicator';

const HOURS_TO_RENDER = PAST_HOURS + 24;
const DEFAULT_VIEWPORT_WIDTH = 1200;

const EpgGrid = ({ channels, isLoadingChannels }) => {
  const dispatch = useDispatch();
  const [containerNode, setContainerNode] = useState(null);
  const [scrollLeftPx, setScrollLeftPx] = useState(0);
  const { timeOrigin, scrollTop } = useSelector((state) => state.epg);
  const { sidebarWidth, pixelsPerMinute, isMobile } = useLayoutConstants();
  const now = useCurrentTime();

  const containerHeight = containerNode?.clientHeight ?? 0;
  const totalWidth = sidebarWidth + HOURS_TO_RENDER * 60 * pixelsPerMinute;

  // Scroll so that the target time sits at ~1/3 of the viewport width
  useEffect(() => {
    if (containerNode && channels.length > 0) {
      const pastOffsetPx = PAST_HOURS * 60 * pixelsPerMinute;
      const viewportThird = containerNode.clientWidth / 3;
      containerNode.scrollLeft = Math.max(0, pastOffsetPx - viewportThird);
    }
  }, [containerNode, channels.length, pixelsPerMinute, timeOrigin]);

  const { visibleChannels, startIndex, totalHeight } = useVirtualChannels({
    channels,
    scrollTop,
    containerHeight: containerHeight - TIME_HEADER_HEIGHT,
  });

  const { programs, isLoading: isLoadingPrograms } = useEpgViewport(
    containerNode?.clientWidth ?? DEFAULT_VIEWPORT_WIDTH,
    pixelsPerMinute,
  );

  const handleScrollChange = useCallback(({ scrollLeft, scrollTop: sTop }) => {
    dispatch(setScroll({ scrollLeft, scrollTop: sTop }));
  }, [dispatch]);

  useDragScroll(containerNode, handleScrollChange);

  const handleScroll = useCallback((event) => {
    const { scrollTop: sTop, scrollLeft: sLeft } = event.target;
    dispatch(setScroll({ scrollTop: sTop, scrollLeft: sLeft }));
    setScrollLeftPx(sLeft);
  }, [dispatch]);

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
        now={now}
        onSelectProgram={handleSelectProgram}
      />
    )), [
    visibleChannels,
    startIndex,
    timeOrigin,
    pixelsPerMinute,
    sidebarWidth,
    isMobile,
    now,
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
    <Box sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* TimeHeader rendered outside the scrollable area, synced via scrollLeft */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: TIME_HEADER_HEIGHT,
          zIndex: 10,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <Box sx={{ transform: `translateX(-${scrollLeftPx}px)` }}>
          <TimeHeader
            timeOrigin={timeOrigin}
            pixelsPerMinute={pixelsPerMinute}
            totalWidth={totalWidth}
            sidebarWidth={sidebarWidth}
          />
        </Box>
      </Box>

      {/* Scrollable grid content */}
      <Box
        ref={setContainerNode}
        onScroll={handleScroll}
        sx={{
          height: '100%',
          overflow: 'auto',
          cursor: 'grab',
          touchAction: 'pan-y',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: totalWidth,
            height: totalHeight,
            mt: `${TIME_HEADER_HEIGHT}px`,
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
            zIndex: 11,
          }}
        />
      )}
    </Box>
  );
};

export default EpgGrid;
