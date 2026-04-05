/**
 * Hook for fetching detailed program information
 * @module hooks/useProgramDetail
 */

import { useQuery } from '@tanstack/react-query';
import apiFetch from '@/api/client';
import { programDetailPath } from '@/api/endpoints';

/**
 * Fetch detailed information for a single program
 * Only fetches when programId is provided (modal is open)
 * @param {string|null} programId - Program ID (e.g., "pluri_1682160849") or null
 * @returns {{ program: Object|null, isLoading: boolean, error: Error|null }} Program detail and loading state
 */
const useProgramDetail = (programId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['epg', 'program', programId],
    queryFn: () => apiFetch(programDetailPath(programId)),
    enabled: Boolean(programId),
    staleTime: 10 * 60 * 1000,
  });

  return {
    program: data ?? null,
    isLoading,
    error: error ?? null,
  };
};

export default useProgramDetail;
