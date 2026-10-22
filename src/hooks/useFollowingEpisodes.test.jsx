import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import apiFetch from '@/api/client';
import useFollowingEpisodes from './useFollowingEpisodes';

vi.mock('@/api/client', () => ({
  default: vi.fn(),
  AuthError: class AuthError extends Error {
    name = 'AuthError';
  },
}));

const BUCKET = 7200;
// Aligned on 2 hours, like the by_channel buckets.
const T0 = 1_700_006_400;
const episode = (id, start, duration = 3000) => ({ id, title: 'Tracker', date: start, duration });

/* The 2nd and 3rd episodes air in the next bucket, the grid never loaded it. */
const DICTS = {
  [T0]: { a: episode('a', T0 + 4200) },
  [T0 + BUCKET]: { b: episode('b', T0 + 7200), c: episode('c', T0 + 10200) },
};

const renderEpisodes = (channelUuid, program, queryOptions) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, ...queryOptions } } });
  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return renderHook(() => useFollowingEpisodes(channelUuid, program), { wrapper });
};

const requestedBuckets = () =>
  apiFetch.mock.calls.map(([path]) => Number.parseInt(path.match(/by_channel\/[^/]+\/(\d+)/)[1], 10));

beforeEach(() => {
  apiFetch.mockReset();
  apiFetch.mockImplementation((path) => {
    const ts = Number.parseInt(path.match(/by_channel\/[^/]+\/(\d+)/)[1], 10);
    return Promise.resolve(DICTS[ts] ?? {});
  });
});

describe('useFollowingEpisodes', () => {
  it('loads the buckets after the program and returns the episodes found there', async () => {
    const { result } = renderEpisodes('uuid-1', episode('a', T0 + 4200));
    await waitFor(() => expect(result.current.episodes.map((p) => p.id)).toStrictEqual(['b', 'c']));
  });

  it('loads from the bucket where the program ends up to 6 hours later', async () => {
    const { result } = renderEpisodes('uuid-1', episode('a', T0 + 4200));
    await waitFor(() => expect(result.current.episodes).toHaveLength(2));
    const end = T0 + 4200 + 3000;
    expect(Math.max(...requestedBuckets())).toBeLessThanOrEqual(end + 6 * 3600);
    expect(Math.min(...requestedBuckets())).toBe(T0 + BUCKET);
  });

  it('fetches nothing without a program', () => {
    const { result } = renderEpisodes('uuid-1', null);
    expect(result.current).toStrictEqual({ episodes: [], isLoading: false });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('reports loading until the buckets first answer', async () => {
    const { result } = renderEpisodes('uuid-1', episode('a', T0 + 4200));
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('stops reporting loading once an attempt failed, without waiting for the retries', async () => {
    apiFetch.mockRejectedValue(new Error('503'));
    const { result } = renderEpisodes('uuid-1', episode('a', T0 + 4200), { retry: 1, retryDelay: 60_000 });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.episodes).toStrictEqual([]);
  });
});
