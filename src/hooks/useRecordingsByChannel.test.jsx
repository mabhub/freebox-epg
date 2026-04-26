import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import apiFetch from '@/api/client';
import useRecordingsByChannel from './useRecordingsByChannel';

vi.mock('@/api/client', () => ({
  default: vi.fn(),
  AuthError: class AuthError extends Error {},
}));

vi.mock('@/hooks/useCurrentTime', () => ({
  default: () => 10_000,
}));

const programmedRaw = ({ id, channel_uuid, start, end, state = 'waiting_start_time', has_record_gen = false, record_gen_id }) => ({
  id,
  channel_uuid,
  channel_name: `Ch-${channel_uuid}`,
  start,
  end,
  name: `Rec ${id}`,
  subname: '',
  state,
  has_record_gen,
  record_gen_id,
});

const finishedRaw = ({ id, channel_uuid, start, end }) => ({
  id,
  channel_uuid,
  channel_name: `Ch-${channel_uuid}`,
  start,
  end,
  name: `Done ${id}`,
});

const renderRecordings = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useRecordingsByChannel(), { wrapper });
};

beforeEach(() => {
  apiFetch.mockReset();
});

describe('useRecordingsByChannel', () => {
  it('returns an empty Map while data is loading', () => {
    apiFetch.mockReturnValue(new Promise(() => {}));
    const { result } = renderRecordings();
    expect(result.current.size).toBe(0);
  });

  it('groups programmed and finished entries by channel and sorts by start', async () => {
    apiFetch.mockImplementation((path) => {
      if (path.includes('programmed')) {
        return Promise.resolve([
          programmedRaw({ id: 1, channel_uuid: 'a', start: 5000, end: 5500 }),
          programmedRaw({ id: 2, channel_uuid: 'a', start: 1000, end: 1500 }),
          programmedRaw({ id: 3, channel_uuid: 'b', start: 2000, end: 2500 }),
        ]);
      }
      // finished
      return Promise.resolve([
        finishedRaw({ id: 90, channel_uuid: 'a', start: 9000, end: 9500 }),
        finishedRaw({ id: 91, channel_uuid: 'b', start: 9000, end: 9500 }),
      ]);
    });

    const { result } = renderRecordings();
    await waitFor(() => expect(result.current.size).toBe(2));

    const a = result.current.get('a');
    expect(a.map((r) => r.id)).toEqual([2, 1, 90]);
    expect(a[0].kind).toBe('programmed');
    expect(a[2].kind).toBe('finished');

    const b = result.current.get('b');
    expect(b.map((r) => r.id)).toEqual([3, 91]);
  });

  it('drops finished recordings older than 6 hours', async () => {
    // useCurrentTime mocked at 10_000s; cutoff = 10_000 - 21_600 = -11_600
    apiFetch.mockImplementation((path) => {
      if (path.includes('programmed')) return Promise.resolve([]);
      return Promise.resolve([
        // end before cutoff -> dropped
        finishedRaw({ id: 1, channel_uuid: 'a', start: -50_000, end: -20_000 }),
        // end after cutoff -> kept
        finishedRaw({ id: 2, channel_uuid: 'a', start: -5_000, end: -1_000 }),
      ]);
    });

    const { result } = renderRecordings();
    await waitFor(() => expect(result.current.get('a')?.length).toBe(1));
    expect(result.current.get('a')[0].id).toBe(2);
  });

  it('skips recordings without a channel UUID', async () => {
    apiFetch.mockImplementation((path) => {
      if (path.includes('programmed')) {
        return Promise.resolve([
          programmedRaw({ id: 1, channel_uuid: '', start: 1000, end: 1500 }),
          programmedRaw({ id: 2, channel_uuid: 'a', start: 1000, end: 1500 }),
        ]);
      }
      return Promise.resolve([]);
    });

    const { result } = renderRecordings();
    await waitFor(() => expect(result.current.size).toBe(1));
    expect(result.current.has('a')).toBe(true);
    expect(result.current.has('')).toBe(false);
  });

  it('returns the same reference between renders when data is identical', async () => {
    apiFetch.mockImplementation((path) => {
      if (path.includes('programmed')) {
        return Promise.resolve([programmedRaw({ id: 1, channel_uuid: 'a', start: 1000, end: 1500 })]);
      }
      return Promise.resolve([]);
    });

    const { result, rerender } = renderRecordings();
    await waitFor(() => expect(result.current.size).toBe(1));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
