/**
 * Hook for fetching EPG data for a specific channel
 * @module hooks/useEpgByChannel
 */

import { useQuery } from '@tanstack/react-query';
import apiFetch from '@/api/client';
import { epgByChannelPath } from '@/api/endpoints';
import { transformEpgByChannel } from '@/api/transformers';

/**
 * Fetch EPG programs for a specific channel at a given timestamp
 * @param {string|null} channelUuid - Channel UUID or null to disable
 * @param {number|null} timestamp - Unix timestamp rounded to 7200s or null to disable
 * @returns {{ programs: Array, isLoading: boolean, error: Error|null }} Channel programs and loading state
 */
const useEpgByChannel = (channelUuid, timestamp) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['epg', 'byChannel', channelUuid, timestamp],
    queryFn: () => apiFetch(epgByChannelPath(channelUuid, timestamp)),
    select: transformEpgByChannel,
    enabled: Boolean(channelUuid) && Boolean(timestamp),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    programs: data ?? [],
    isLoading,
    error: error ?? null,
  };
};

export default useEpgByChannel;
