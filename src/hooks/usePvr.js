import { useQuery, useMutation } from '@tanstack/react-query';
import apiFetch from '@/api/client';
import { pvrConfigPath, pvrMediaPath, pvrProgrammedPath } from '@/api/endpoints';

/**
 * Fetch PVR recording configuration (margins)
 * @returns {{ data: { margin_before: number, margin_after: number }|undefined, isLoading: boolean }} Query result
 */
export const usePvrConfig = () =>
  useQuery({
    queryKey: ['pvr', 'config'],
    queryFn: () => apiFetch(pvrConfigPath()),
    staleTime: Infinity,
  });

/**
 * Fetch available PVR storage media
 * @returns {{ data: Array|undefined, isLoading: boolean }} Query result
 */
export const usePvrMedia = () =>
  useQuery({
    queryKey: ['pvr', 'media'],
    queryFn: () => apiFetch(pvrMediaPath()),
    staleTime: Infinity,
  });

/**
 * Create a programmed recording
 * @returns {import('@tanstack/react-query').UseMutationResult} Mutation result
 */
export const useCreateRecording = () =>
  useMutation({
    mutationFn: (payload) =>
      apiFetch(pvrProgrammedPath(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
  });
