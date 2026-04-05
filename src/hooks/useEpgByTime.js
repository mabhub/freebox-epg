/**
 * Hook for fetching EPG data by time slots
 * @module hooks/useEpgByTime
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import apiFetch from '@/api/client';
import { epgByTimePath } from '@/api/endpoints';
import { transformEpgByTime, mergeEpgMaps } from '@/api/transformers';

/**
 * Fetch EPG programs for multiple hourly time buckets in parallel
 * @param {Array<number>} timestamps - Array of hourly-rounded Unix timestamps
 * @returns {{ programs: Map<string, Array>, isLoading: boolean, error: Error|null }} EPG programs map and loading state
 */
const useEpgByTime = (timestamps) => {
  const queries = useQueries({
    queries: timestamps.map((ts) => ({
      queryKey: ['epg', 'byTime', ts],
      queryFn: () => apiFetch(epgByTimePath(ts)),
      select: transformEpgByTime,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error ?? null;

  const programs = useMemo(() => {
    const loadedMaps = queries
      .filter((q) => q.data)
      .map((q) => q.data);

    if (loadedMaps.length === 0) {
      return new Map();
    }

    return mergeEpgMaps(loadedMaps);
  }, [queries]);

  return { programs, isLoading, error };
};

export default useEpgByTime;
