/* eslint-disable vitest/prefer-called-once -- contradicts vitest/prefer-called-times, both enabled */
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import apiFetch from '@/api/client';
import ApiHttpError from '@/api/httpError';
import AuthError from '@/api/errors';
import { PRIORITY, hasQueuedAhead, getLastSaturationAt } from '@/api/requestQueue';
import { PREFETCH_RATE_PER_SECOND, PREFETCH_PAUSE_MS } from '@/utils/constants';
import { byChannelQuery } from './useEpgViewport';
import useIdlePrefetch from './useIdlePrefetch';

vi.mock('@/api/client', () => ({ default: vi.fn() }));
vi.mock('@/api/requestQueue', async (importOriginal) => ({
  ...(await importOriginal()),
  hasQueuedAhead: vi.fn(),
  getLastSaturationAt: vi.fn(),
}));

const B = 7200;
const T0 = 1000 * B;
const TICK = 1000 / PREFETCH_RATE_PER_SECOND;
const channel = (id) => ({ uuid: id });
// On screen from 6:30 to 11:00 after the grid's left edge: buckets 3, 4 and 5 overlap it.
const viewportRange = { startTs: T0 + 6.5 * 3600, endTs: T0 + 11 * 3600 };

const pairOf = (call) => {
  const m = call[0].match(/by_channel\/([^/]+)\/(\d+)/);
  return { uuid: m[1], ts: Number(m[2]) };
};

const renderPrefetch = (props = {}) => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const initialProps = {
    channels: [channel('a'), channel('b')],
    onScreenChannels: [channel('a')],
    viewportRange,
    timeOrigin: T0,
    enabled: true,
    ...props,
  };
  return { queryClient, ...renderHook((p) => useIdlePrefetch(p), { wrapper, initialProps }) };
};

const ticks = (n) => act(() => vi.advanceTimersByTimeAsync(n * TICK));

const setLocks = (locks) => Object.defineProperty(navigator, 'locks', { value: locks, configurable: true });

beforeEach(() => {
  vi.useFakeTimers();
  setLocks(undefined);
  apiFetch.mockReset();
  apiFetch.mockResolvedValue({});
  hasQueuedAhead.mockReset().mockReturnValue(false);
  getLastSaturationAt.mockReset().mockReturnValue(0);
});

afterEach(() => {
  vi.useRealTimers();
  setLocks(undefined);
});

describe('useIdlePrefetch', () => {
  it('does nothing while disabled', async () => {
    renderPrefetch({ enabled: false });
    renderPrefetch({ channels: [], onScreenChannels: [] });
    await ticks(10);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('prefetches the nearest pair with the prefetch priority', async () => {
    const { queryClient } = renderPrefetch();
    await ticks(1);
    expect(apiFetch).toHaveBeenCalledExactlyOnceWith(
      `/tv/epg/by_channel/a/${T0 + 3 * B}/`,
      expect.objectContaining({ priority: PRIORITY.PREFETCH }),
    );
    expect(queryClient.getQueryData(['epg', 'byChannel', 'a', T0 + 3 * B])).toStrictEqual({});
  });

  it('prefetches one pair per tick', async () => {
    renderPrefetch();
    await ticks(2);
    expect(apiFetch).toHaveBeenCalledTimes(2);
    expect(pairOf(apiFetch.mock.calls[1])).toStrictEqual({ uuid: 'a', ts: T0 + 4 * B });
  });

  it('keeps a single prefetch in flight', async () => {
    apiFetch.mockReturnValue(new Promise(() => {}));
    renderPrefetch();
    await ticks(5);
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('yields to more urgent waiting requests', async () => {
    hasQueuedAhead.mockReturnValue(true);
    renderPrefetch();
    await ticks(5);
    expect(hasQueuedAhead).toHaveBeenCalledWith(PRIORITY.PREFETCH);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('pauses after a saturation', async () => {
    getLastSaturationAt.mockReturnValue(Date.now());
    renderPrefetch();
    await act(() => vi.advanceTimersByTimeAsync(PREFETCH_PAUSE_MS - TICK));
    expect(apiFetch).not.toHaveBeenCalled();
    await ticks(2);
    expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('/by_channel/'), expect.anything());
  });

  it('pauses after its own failure without retrying', async () => {
    apiFetch.mockRejectedValueOnce(new ApiHttpError(429, 'Too Many Requests'));
    renderPrefetch();
    await ticks(1);
    expect(apiFetch).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(PREFETCH_PAUSE_MS - TICK));
    expect(apiFetch).toHaveBeenCalledTimes(1);
    await ticks(2);
    expect(apiFetch.mock.calls.length).toBeGreaterThan(1);
  });

  it('pauses on an expired session', async () => {
    apiFetch.mockRejectedValueOnce(new AuthError('Session expired'));
    renderPrefetch();
    await ticks(1);
    await act(() => vi.advanceTimersByTimeAsync(PREFETCH_PAUSE_MS - TICK));
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('skips a pair the grid is already fetching', async () => {
    const { queryClient } = renderPrefetch({ onScreenChannels: [channel('a'), channel('b')] });
    apiFetch.mockReturnValueOnce(new Promise(() => {}));
    queryClient.fetchQuery(byChannelQuery('a', T0 + 3 * B));
    apiFetch.mockClear();
    await ticks(1);
    expect(pairOf(apiFetch.mock.calls[0])).toStrictEqual({ uuid: 'b', ts: T0 + 3 * B });
  });

  it('follows the new viewport after a jump', async () => {
    const { rerender } = renderPrefetch();
    await ticks(1);
    rerender({
      channels: [channel('a'), channel('c')],
      onScreenChannels: [channel('c')],
      viewportRange,
      timeOrigin: T0,
      enabled: true,
    });
    await ticks(1);
    expect(pairOf(apiFetch.mock.calls[1]).uuid).toBe('c');
  });

  it('waits for the tab lock', async () => {
    setLocks({ request: vi.fn(() => new Promise(() => {})) });
    renderPrefetch();
    await ticks(5);
    expect(navigator.locks.request).toHaveBeenCalledWith(
      'freebox-epg:prefetch',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
      expect.any(Function),
    );
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('prefetches once it holds the tab lock', async () => {
    setLocks({ request: vi.fn((name, options, grant) => grant()) });
    renderPrefetch();
    await ticks(1);
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('releases the lock on unmount', async () => {
    let options;
    let held;
    setLocks({
      request: vi.fn((name, opts, grant) => {
        options = opts;
        held = grant();
        return held;
      }),
    });
    const { unmount } = renderPrefetch();
    unmount();
    expect(options.signal.aborted).toBe(true);
    await expect(held).resolves.toBeUndefined();
  });

  it('runs without Web Locks', async () => {
    renderPrefetch();
    await ticks(1);
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
