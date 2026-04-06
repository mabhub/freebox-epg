/**
 * Hook for fetching detailed program information
 * @module hooks/useProgramDetail
 */

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@/api/client';
import { programDetailPath } from '@/api/endpoints';

const PROGRAM_STALE_TIME = 10 * 60 * 1000;

/**
 * Build the query key for a program detail
 * @param {string} programId - Program ID
 * @returns {Array} Query key
 */
const programQueryKey = (programId) => ['epg', 'program', programId];

/**
 * Fetch detailed information for a single program
 * Only fetches when programId is provided (modal is open)
 * @param {string|null} programId - Program ID (e.g., "pluri_1682160849") or null
 * @returns {{ program: Object|null, isLoading: boolean, error: Error|null }} Program detail and loading state
 */
const useProgramDetail = (programId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: programQueryKey(programId),
    queryFn: () => apiFetch(programDetailPath(programId)),
    enabled: Boolean(programId),
    staleTime: PROGRAM_STALE_TIME,
  });

  return {
    program: data ?? null,
    isLoading,
    error: error ?? null,
  };
};

/**
 * Return a function that prefetches program details into the TanStack cache
 * Intended to be called on hover to anticipate modal opening
 * @returns {Function} prefetch(programId) - triggers a background fetch
 */
export const usePrefetchProgram = () => {
  const queryClient = useQueryClient();

  return useCallback((programId) => {
    if (!programId) {
      return;
    }
    queryClient.prefetchQuery({
      queryKey: programQueryKey(programId),
      queryFn: () => apiFetch(programDetailPath(programId)),
      staleTime: PROGRAM_STALE_TIME,
    });
  }, [queryClient]);
};

export default useProgramDetail;
