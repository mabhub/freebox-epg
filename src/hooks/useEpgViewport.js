/**
 * Hook that orchestrates EPG data loading based on the current viewport
 * @module hooks/useEpgViewport
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useEpgByTime from './useEpgByTime';
import { getHourBuckets } from '@/utils/time';
import { OVERSCAN_HOURS } from '@/utils/constants';

/**
 * Compute which EPG time buckets to fetch based on viewport scroll position
 * @param {number} viewportWidth - Viewport width in pixels
 * @param {number} pixelsPerMinute - Current responsive scale factor
 * @returns {{ programs: Map<string, Array>, isLoading: boolean, error: Error|null }} Merged programs and loading state
 */
const useEpgViewport = (viewportWidth, pixelsPerMinute) => {
  const timeOrigin = useSelector((state) => state.epg.timeOrigin);
  const scrollLeft = useSelector((state) => state.epg.scrollLeft);

  const timestamps = useMemo(() => {
    const pixelsPerSecond = pixelsPerMinute / 60;
    const viewportStartOffset = scrollLeft / pixelsPerSecond;
    const viewportEndOffset = (scrollLeft + viewportWidth) / pixelsPerSecond;

    const startTs = timeOrigin + viewportStartOffset - OVERSCAN_HOURS * 3600;
    const endTs = timeOrigin + viewportEndOffset + OVERSCAN_HOURS * 3600;

    return getHourBuckets(startTs, endTs);
  }, [timeOrigin, scrollLeft, viewportWidth, pixelsPerMinute]);

  return useEpgByTime(timestamps);
};

export default useEpgViewport;
