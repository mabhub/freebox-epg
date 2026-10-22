/**
 * Hook that spends the spare Freebox budget, while the grid is idle, on the
 * `by_channel` buckets the user is likely to reach next: the channels on
 * screen over the whole grid, then tonight for the first channels.
 *
 * The Freebox limits the number of requests over a sliding window (a 429
 * blocks every route for about a minute), so the prefetch sends one request
 * at a time at a calibrated pace, gives way to any more urgent request,
 * stops after any 503/429 and never retries. Only the tab holding a Web
 * Lock prefetches, so several open tabs do not add up.
 *
 * @module hooks/useIdlePrefetch
 */

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { PRIORITY, hasQueuedAhead, getLastSaturationAt } from '@/api/requestQueue';
import { byChannelQuery } from '@/hooks/useEpgViewport';
import buildPrefetchPlan from '@/utils/prefetchPlan';
import { eveningRange } from '@/utils/time';
import {
  FUTURE_HOURS,
  PAST_HOURS,
  PREFETCH_EVENING_START_HOUR,
  PREFETCH_FIRST_CHANNELS,
  PREFETCH_LOCK_NAME,
  PREFETCH_PAUSE_MS,
  PREFETCH_RATE_PER_SECOND,
} from '@/utils/constants';

const hasWebLocks = () => typeof navigator !== 'undefined' && Boolean(navigator.locks);

/**
 * Prefetch likely `by_channel` buckets into the React Query cache while the
 * grid is idle.
 * @param {Object} params - Grid state
 * @param {Array<{ uuid: string }>} params.channels - Channels of the grid, in display order
 * @param {Array<{ uuid: string }>} params.onScreenChannels - Channels currently on screen
 * @param {{ startTs: number, endTs: number }} params.viewportRange - Time span on screen, Unix seconds
 * @param {number} params.timeOrigin - Unix timestamp of the grid's left edge
 * @param {boolean} params.enabled - False while the grid is measuring or loading what is on screen
 */
const useIdlePrefetch = ({ channels, onScreenChannels, viewportRange, timeOrigin, enabled }) => {
  const queryClient = useQueryClient();
  const [hasLock, setHasLock] = useState(() => !hasWebLocks());

  // Read by the timer at each tick, so scrolling never restarts it.
  const inputsRef = useRef(null);
  useEffect(() => {
    inputsRef.current = { channels, onScreenChannels, viewportRange, timeOrigin, enabled };
  });

  useEffect(() => {
    if (!hasWebLocks()) {
      return;
    }
    const controller = new AbortController();
    let release = () => {};
    const holdLock = () => {
      setHasLock(true);
      return new Promise((resolve) => {
        release = resolve;
      });
    };
    const acquire = async () => {
      try {
        await navigator.locks.request(PREFETCH_LOCK_NAME, { signal: controller.signal }, holdLock);
      } catch (error) {
        // Aborted while waiting: the tab is going away. Any other failure:
        // behave as a browser without Web Locks.
        if (error?.name !== 'AbortError') setHasLock(true);
      }
    };
    acquire();
    return () => {
      controller.abort();
      release();
    };
  }, []);

  useEffect(() => {
    if (!hasLock) {
      return;
    }
    let inFlight = false;
    let pausedUntil = 0;

    const isKnown = (uuid, ts) => {
      const state = queryClient.getQueryState(byChannelQuery(uuid, ts).queryKey);
      return state?.data !== undefined || state?.fetchStatus === 'fetching';
    };

    const prefetch = async ({ uuid, ts }) => {
      inFlight = true;
      try {
        await queryClient.fetchQuery({ ...byChannelQuery(uuid, ts, { priority: PRIORITY.PREFETCH }), retry: false });
      } catch {
        pausedUntil = Date.now() + PREFETCH_PAUSE_MS;
      } finally {
        inFlight = false;
      }
    };

    const tick = () => {
      const inputs = inputsRef.current;
      const now = Date.now();
      if (
        !inputs?.enabled ||
        inFlight ||
        now < pausedUntil ||
        now - getLastSaturationAt() < PREFETCH_PAUSE_MS ||
        hasQueuedAhead(PRIORITY.PREFETCH)
      ) {
        return;
      }
      const { channels: all, onScreenChannels: onScreen, viewportRange: viewport, timeOrigin: origin } = inputs;
      const [next] = buildPrefetchPlan({
        onScreenUuids: onScreen.map((c) => c.uuid),
        firstUuids: all.slice(0, PREFETCH_FIRST_CHANNELS).map((c) => c.uuid),
        gridRange: { startTs: origin, endTs: origin + (PAST_HOURS + FUTURE_HOURS) * 3600 },
        viewportRange: viewport,
        eveningRange: eveningRange(origin + PAST_HOURS * 3600, PREFETCH_EVENING_START_HOUR),
        isKnown,
      });
      if (next) {
        prefetch(next);
      }
    };

    const id = setInterval(tick, Math.ceil(1000 / PREFETCH_RATE_PER_SECOND));
    return () => clearInterval(id);
  }, [hasLock, queryClient]);
};

export default useIdlePrefetch;
