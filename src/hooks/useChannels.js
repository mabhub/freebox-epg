/**
 * Hook for fetching and merging channel data
 * @module hooks/useChannels
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@/api/client';
import { channelsPath, bouquetFreeboxTvChannelsPath } from '@/api/endpoints';
import { mergeChannels } from '@/api/transformers';

/**
 * Fetch and merge channel details with bouquet channel list
 * Returns a sorted array of channels (sub_number === 0, available only)
 * @returns {{ channels: Array, isLoading: boolean, error: Error|null }} Channel data and loading state
 */
const useChannels = () => {
  const channelsQuery = useQuery({
    queryKey: ['channels'],
    queryFn: () => apiFetch(channelsPath()),
    staleTime: Infinity,
  });

  const bouquetQuery = useQuery({
    queryKey: ['bouquet', 'freeboxtv', 'channels'],
    queryFn: () => apiFetch(bouquetFreeboxTvChannelsPath()),
    staleTime: Infinity,
  });

  const channels = useMemo(() => {
    if (!channelsQuery.data || !bouquetQuery.data) {
      return [];
    }
    return mergeChannels(channelsQuery.data, bouquetQuery.data);
  }, [channelsQuery.data, bouquetQuery.data]);

  return {
    channels,
    isLoading: channelsQuery.isLoading || bouquetQuery.isLoading,
    error: channelsQuery.error ?? bouquetQuery.error,
  };
};

export default useChannels;
