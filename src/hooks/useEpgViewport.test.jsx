import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import apiFetch from '@/api/client';
import epgReducer, { setScroll } from '@/store/epgSlice';
import { PAST_HOURS, OVERSCAN_HOURS } from '@/utils/constants';
import { roundTo2Hours, nowTimestamp } from '@/utils/time';
import useEpgViewport from './useEpgViewport';

vi.mock('@/api/client', () => ({
  default: vi.fn(),
  AuthError: class AuthError extends Error {},
}));

const channel = (n) => ({ uuid: `uuid-${n}`, number: n, name: `C${n}` });

const programDict = (uuid, ts) => ({
  [`${ts}_x`]: { id: `prog_${uuid}_${ts}`, date: ts, duration: 7200, title: 't' },
});

const renderViewport = ({ visibleChannels, viewportWidth, pixelsPerMinute = 4 }) => {
  const store = configureStore({ reducer: { epg: epgReducer } });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const wrapper = ({ children }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
  return {
    store,
    queryClient,
    ...renderHook(
      ({ vc, vw, ppm }) => useEpgViewport(vc, vw, ppm),
      {
        wrapper,
        initialProps: { vc: visibleChannels, vw: viewportWidth, ppm: pixelsPerMinute },
      },
    ),
  };
};

beforeEach(() => {
  apiFetch.mockReset();
  apiFetch.mockImplementation((path) => {
    const m = path.match(/by_channel\/(uuid-\d+)\/(\d+)/);
    return Promise.resolve(m ? programDict(m[1], parseInt(m[2], 10)) : {});
  });
});

describe('useEpgViewport', () => {
  it('returns an empty result and emits no fetch while the viewport is unmeasured', () => {
    const { result } = renderViewport({
      visibleChannels: [channel(1), channel(2)],
      viewportWidth: 0,
    });
    expect(result.current.programs.size).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('fetches one query per (visibleChannel, 2h-bucket) pair covering the viewport', async () => {
    const channels = [channel(1), channel(2), channel(3)];
    // 1200px / (4px/min) = 5h viewport, +/- OVERSCAN_HOURS (1h) → 7h window
    // Aligned on 2h buckets → 4 buckets
    const { result } = renderViewport({
      visibleChannels: channels,
      viewportWidth: 1200,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const distinctBuckets = new Set(
      apiFetch.mock.calls.map(([p]) => p.match(/by_channel\/uuid-\d+\/(\d+)/)[1]),
    );
    const expectedBuckets = Math.ceil(
      ((1200 / (4 / 60)) + 2 * OVERSCAN_HOURS * 3600) / 7200,
    );
    expect(distinctBuckets.size).toBeGreaterThanOrEqual(expectedBuckets);
    expect(distinctBuckets.size).toBeLessThanOrEqual(expectedBuckets + 1);
    expect(apiFetch).toHaveBeenCalledTimes(channels.length * distinctBuckets.size);
    expect(result.current.programs.get('uuid-1')).toBeInstanceOf(Array);
    expect(result.current.programs.get('uuid-2').length).toBeGreaterThan(0);
  });

  it('does not refetch when visibleChannels is replaced by a value-equal array', async () => {
    const initialChannels = [channel(1), channel(2)];
    const { result, rerender } = renderViewport({
      visibleChannels: initialChannels,
      viewportWidth: 1200,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const firstCallCount = apiFetch.mock.calls.length;

    // New array, same uuids — simulates a scrollTop tick that produced a
    // different reference but the same overscan slice.
    rerender({ vc: [channel(1), channel(2)], vw: 1200, ppm: 4 });

    // Wait long enough that any in-flight observer or scheduler tick would
    // have surfaced a new fetch by now.
    await new Promise((r) => { setTimeout(r, 100); });
    expect(apiFetch.mock.calls.length).toBe(firstCallCount);
  });

  it('emits no by_time requests', async () => {
    const { result } = renderViewport({
      visibleChannels: [channel(1)],
      viewportWidth: 1200,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiFetch.mock.calls.every(([p]) => !p.includes('/by_time/'))).toBe(true);
  });

  it('keeps the bucket window inside the viewport (+/- overscan)', async () => {
    const { result } = renderViewport({
      visibleChannels: [channel(1)],
      viewportWidth: 1200,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const buckets = apiFetch.mock.calls
      .map(([p]) => parseInt(p.match(/by_channel\/uuid-1\/(\d+)/)[1], 10))
      .toSorted((a, b) => a - b);
    const now = nowTimestamp();
    const timeOrigin = now - PAST_HOURS * 3600;
    const PAST_OFFSET_PX = PAST_HOURS * 60 * 4;
    const pixelsPerSecond = 4 / 60;
    const viewportStart = timeOrigin + PAST_OFFSET_PX / pixelsPerSecond;
    const viewportEnd = viewportStart + 1200 / pixelsPerSecond;
    expect(buckets[0]).toBeGreaterThanOrEqual(
      roundTo2Hours(viewportStart - OVERSCAN_HOURS * 3600),
    );
    expect(buckets.at(-1)).toBeLessThanOrEqual(
      roundTo2Hours(viewportEnd + OVERSCAN_HOURS * 3600),
    );
  });

  it('fetches the new window when the user scrolls horizontally', async () => {
    const { result, store } = renderViewport({
      visibleChannels: [channel(1)],
      viewportWidth: 1200,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const initialBuckets = new Set(
      apiFetch.mock.calls.map(([p]) => p.match(/by_channel\/uuid-1\/(\d+)/)[1]),
    );
    // Scroll forward by a full extra viewport (1200px / (4px/min) = 5h),
    // which guarantees at least 2 entirely new 2-hour buckets become visible.
    act(() => {
      store.dispatch(setScroll({ scrollLeft: 1200 + 1200 }));
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const allBuckets = new Set(
      apiFetch.mock.calls.map(([p]) => p.match(/by_channel\/uuid-1\/(\d+)/)[1]),
    );
    const newBuckets = [...allBuckets].filter((b) => !initialBuckets.has(b));
    expect(newBuckets.length).toBeGreaterThanOrEqual(2);
  });
});
