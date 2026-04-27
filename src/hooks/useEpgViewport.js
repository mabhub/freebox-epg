/**
 * Hook that orchestrates EPG data loading based on the current viewport.
 *
 * Fetches the visible time range only for the channels currently in the
 * vertical viewport (passed in by the caller after virtualisation), via the
 * Freebox `by_channel` endpoint aligned on 2-hour buckets. This avoids the
 * `by_time` endpoint which returns the full Freebox channel catalog
 * (~450 channels) per hourly bucket.
 *
 * Measured 2026-04-26: ~264 KB decoded vs ~5.8 MB with by_time, on a
 * standard desktop viewport. Bumping OVERSCAN_ROWS or OVERSCAN_HOURS
 * multiplies the request count linearly — profile before changing.
 *
 * @module hooks/useEpgViewport
 */

import { useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useQueries } from '@tanstack/react-query';

import apiFetch from '@/api/client';
import { epgByChannelPath } from '@/api/endpoints';
import { transformEpgByChannel, mergeByChannelEntries } from '@/api/transformers';
import { get2HourBuckets } from '@/utils/time';
import { OVERSCAN_HOURS } from '@/utils/constants';

// Shared sentinel for the "no pairs to fetch" case so that the hook return
// value keeps a stable identity across renders. Treat as immutable: never
// mutate `programs` on it (consumers only read the Map via `.get`).
const EMPTY_PROGRAMS = new Map();
const EMPTY_RESULT = { programs: EMPTY_PROGRAMS, isLoading: false, error: null };

/**
 * Compute which channel/bucket pairs to fetch based on viewport position
 * and the visible (overscanned) channel slice.
 * @param {Array<{ uuid: string }>} visibleChannels - Channels currently rendered (overscan included)
 * @param {number} viewportWidth - Viewport width in pixels (0 while the container is being measured)
 * @param {number} pixelsPerMinute - Current responsive scale factor
 * @returns {{ programs: Map<string, Array>, isLoading: boolean, error: Error|null }} Merged programs and loading state
 */
const useEpgViewport = (visibleChannels, viewportWidth, pixelsPerMinute) => {
  const timeOrigin = useSelector((state) => state.epg.timeOrigin);
  const scrollLeft = useSelector((state) => state.epg.scrollLeft);

  const buckets = useMemo(() => {
    if (viewportWidth <= 0) {
      return [];
    }
    const pixelsPerSecond = pixelsPerMinute / 60;
    const viewportStartOffset = scrollLeft / pixelsPerSecond;
    const viewportEndOffset = (scrollLeft + viewportWidth) / pixelsPerSecond;

    const startTs = timeOrigin + viewportStartOffset - OVERSCAN_HOURS * 3600;
    const endTs = timeOrigin + viewportEndOffset + OVERSCAN_HOURS * 3600;

    return get2HourBuckets(startTs, endTs);
  }, [timeOrigin, scrollLeft, viewportWidth, pixelsPerMinute]);

  // Stabilise visibleChannels by uuid so that scroll-driven re-renders that
  // do not actually change the slice keep the same `pairs` identity, and
  // useQueries keeps the same observers. The key is both the dependency
  // and the data source — splitting it back into uuids makes the memo
  // self-contained and lets exhaustive-deps stay enabled.
  const visibleUuidsKey = useMemo(
    () => visibleChannels.map((c) => c.uuid).join('|'),
    [visibleChannels],
  );

  const pairs = useMemo(() => {
    const uuids = visibleUuidsKey ? visibleUuidsKey.split('|') : [];
    return uuids.flatMap((uuid) => buckets.map((ts) => ({ uuid, ts })));
  }, [visibleUuidsKey, buckets]);

  // `combine` re-runs whenever any individual query toggles a flag
  // (isLoading, isFetching…), so we cache the merged Map keyed on the
  // tuple of dataUpdatedAt timestamps + uuid identity. That way the
  // returned `programs` keeps its identity until real data actually
  // changed, and ChannelRow.memo can short-circuit on most renders.
  const cacheRef = useRef({ key: '', value: EMPTY_PROGRAMS });

  return useQueries({
    queries: pairs.map(({ uuid, ts }) => ({
      queryKey: ['epg', 'byChannel', uuid, ts],
      queryFn: ({ signal }) => apiFetch(epgByChannelPath(uuid, ts), { signal }),
      select: transformEpgByChannel,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    })),
    combine: (results) => {
      if (results.length === 0) {
        return EMPTY_RESULT;
      }
      const fingerprintParts = [];
      const entries = [];
      for (let i = 0; i < results.length; i += 1) {
        const result = results[i];
        const { uuid } = pairs[i];
        fingerprintParts.push(`${uuid}:${result.dataUpdatedAt ?? 0}`);
        if (result.data) {
          entries.push({ uuid, programs: result.data });
        }
      }
      const fingerprint = fingerprintParts.join('|');

      let programs;
      if (cacheRef.current.key === fingerprint) {
        programs = cacheRef.current.value;
      } else {
        programs = entries.length === 0 ? EMPTY_PROGRAMS : mergeByChannelEntries(entries);
        cacheRef.current = { key: fingerprint, value: programs };
      }

      return {
        programs,
        isLoading: results.some((r) => r.isLoading),
        error: results.find((r) => r.error)?.error ?? null,
      };
    },
  });
};

export default useEpgViewport;
