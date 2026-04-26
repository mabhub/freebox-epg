/**
 * Main EPG grid container
 * Orchestrates virtual scrolling, drag-to-scroll, and data loading
 *
 * @param {Object} props - Component props
 * @param {Array} props.channels - Visible (filtered) channel list
 * @param {boolean} props.isLoadingChannels - Whether channels are still loading
 * @returns {React.ReactElement} EPG grid
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Box, CircularProgress, Typography, styled } from '@mui/material';

import { setScroll, centerOnTimeOrigin, selectProgram } from '@/store/epgSlice';
import useVirtualChannels from '@/hooks/useVirtualChannels';
import useEpgViewport from '@/hooks/useEpgViewport';
import useDragScroll from '@/hooks/useDragScroll';
import useCurrentTime from '@/hooks/useCurrentTime';
import useLayoutConstants from '@/hooks/useLayoutConstants';
import { TIME_HEADER_HEIGHT, PAST_HOURS, FUTURE_HOURS } from '@/utils/constants';

import TimeHeader from './TimeHeader';
import ChannelRow from './ChannelRow';
import NowIndicator from './NowIndicator';

const HOURS_TO_RENDER = PAST_HOURS + FUTURE_HOURS;

const GridContent = styled('div')({
  position: 'relative',
  marginTop: TIME_HEADER_HEIGHT,
});

const EpgGrid = ({ channels, isLoadingChannels }) => {
  const dispatch = useDispatch();
  const [containerNode, setContainerNode] = useState(null);
  const { timeOrigin, scrollTop, scrollLeft } = useSelector(
    (state) => ({
      timeOrigin: state.epg.timeOrigin,
      scrollTop: state.epg.scrollTop,
      scrollLeft: state.epg.scrollLeft,
    }),
    shallowEqual,
  );
  const { sidebarWidth, pixelsPerMinute, isMobile } = useLayoutConstants();
  const now = useCurrentTime();

  const containerHeight = containerNode?.clientHeight ?? 0;
  const containerWidth = containerNode?.clientWidth ?? 0;
  const totalWidth = sidebarWidth + HOURS_TO_RENDER * 60 * pixelsPerMinute;

  // Re-centre the viewport whenever a new (pixelsPerMinute, timeOrigin)
  // pairing arrives — initial mount, breakpoint change, or a toolbar jump
  // (`Maintenant` / `20h30`). Dispatched to Redux *before* the first fetch
  // batch is computed, so `useEpgViewport` only ever sees the centred
  // scrollLeft and never wastes a batch on the default position.
  const lastCenteredKeyRef = useRef(null);
  const centerKey = `${pixelsPerMinute}|${timeOrigin}`;
  const isCentered = lastCenteredKeyRef.current === centerKey;
  useEffect(() => {
    if (!containerNode || containerWidth === 0 || isCentered) {
      return;
    }
    lastCenteredKeyRef.current = centerKey;
    dispatch(centerOnTimeOrigin({ pixelsPerMinute, viewportWidth: containerWidth }));
  }, [containerNode, containerWidth, pixelsPerMinute, dispatch, centerKey, isCentered]);

  // Apply programmatic scroll changes to the DOM. We compare to the actual
  // DOM scrollLeft to avoid feedback when the change came from a user
  // scroll (which already updated the DOM before firing onScroll).
  useEffect(() => {
    if (containerNode && Math.round(containerNode.scrollLeft) !== Math.round(scrollLeft)) {
      containerNode.scrollLeft = scrollLeft;
    }
  }, [containerNode, scrollLeft]);

  const { visibleChannels, startIndex, totalHeight } = useVirtualChannels({
    channels,
    scrollTop,
    containerHeight: containerHeight - TIME_HEADER_HEIGHT,
  });

  // Hold off the first fetch batch until the centring dispatch has landed,
  // otherwise the hook would issue queries against the default scrollLeft
  // and then re-issue them once centred.
  const { programs, isLoading: isLoadingPrograms } = useEpgViewport(
    visibleChannels,
    isCentered ? containerWidth : 0,
    pixelsPerMinute,
  );

  const handleScrollChange = useCallback(({ scrollLeft: sLeft, scrollTop: sTop }) => {
    dispatch(setScroll({ scrollLeft: sLeft, scrollTop: sTop }));
  }, [dispatch]);

  useDragScroll(containerNode, handleScrollChange);

  const handleScroll = useCallback((event) => {
    const { scrollTop: sTop, scrollLeft: sLeft } = event.target;
    dispatch(setScroll({ scrollTop: sTop, scrollLeft: sLeft }));
  }, [dispatch]);

  const handleSelectProgram = useCallback((programId, channelUuid) => {
    dispatch(selectProgram({ programId, channelUuid }));
  }, [dispatch]);

  const gridContent = useMemo(() =>
    visibleChannels.map((channel, index) => (
      <ChannelRow
        key={channel.uuid}
        channel={channel}
        programs={programs.get(channel.uuid) ?? []}
        rowIndex={startIndex + index}
        timeOrigin={timeOrigin}
        pixelsPerMinute={pixelsPerMinute}
        sidebarWidth={sidebarWidth}
        isMobile={isMobile}
        onSelectProgram={handleSelectProgram}
      />
    )), [
    visibleChannels,
    programs,
    startIndex,
    timeOrigin,
    pixelsPerMinute,
    sidebarWidth,
    isMobile,
    handleSelectProgram,
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
        <div style={{ transform: `translateX(-${scrollLeft}px)` }}>
          <TimeHeader
            timeOrigin={timeOrigin}
            pixelsPerMinute={pixelsPerMinute}
            totalWidth={totalWidth}
            sidebarWidth={sidebarWidth}
          />
        </div>
      </Box>

      {/* Scrollable grid content */}
      <Box
        ref={setContainerNode}
        onScroll={handleScroll}
        sx={{
          height: '100%',
          overflow: 'auto',
          cursor: 'grab',
          touchAction: 'pan-x pan-y',
        }}
      >
        <GridContent style={{ width: totalWidth, height: totalHeight }}>
          {gridContent}
          <NowIndicator
            timeOrigin={timeOrigin}
            pixelsPerMinute={pixelsPerMinute}
            now={now}
            sidebarWidth={sidebarWidth}
          />
        </GridContent>
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
