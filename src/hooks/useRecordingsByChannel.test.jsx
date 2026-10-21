import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import apiFetch from '@/api/client';
import useRecordingsByChannel from './useRecordingsByChannel';

vi.mock('@/api/client', () => ({
  default: vi.fn(),
  AuthError: class AuthError extends Error {
    name = 'AuthError';
  },
}));

vi.mock('@/hooks/useCurrentTime', () => ({
  default: () => 10_000,
}));

const programmedRaw = ({
  id,
  channel_uuid,
  start,
  end,
  state = 'waiting_start_time',
  has_record_gen = false,
  record_gen_id,
}) => ({
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

const finishedRaw = ({ id, channel_uuid, start, end, state = 'finished' }) => ({
  id,
  channel_uuid,
  channel_name: `Ch-${channel_uuid}`,
  start,
  end,
  name: `Done ${id}`,
  state,
});

const renderRecordings = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return renderHook(() => useRecordingsByChannel(), { wrapper });
};

// Serves the given raw lists to the programmed and finished PVR endpoints
const mockPvrLists = ({ programmed = [], finished = [] }) => {
  apiFetch.mockImplementation((path) => Promise.resolve(path.includes('programmed') ? programmed : finished));
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
    mockPvrLists({
      programmed: [
        programmedRaw({ id: 1, channel_uuid: 'a', start: 5000, end: 5500 }),
        programmedRaw({ id: 2, channel_uuid: 'a', start: 1000, end: 1500 }),
        programmedRaw({ id: 3, channel_uuid: 'b', start: 2000, end: 2500 }),
      ],
      finished: [
        finishedRaw({ id: 90, channel_uuid: 'a', start: 9000, end: 9500 }),
        finishedRaw({ id: 91, channel_uuid: 'b', start: 9000, end: 9500 }),
      ],
    });

    const { result } = renderRecordings();
    await waitFor(() => expect(result.current.size).toBe(2));

    const a = result.current.get('a');
    expect(a.map((r) => r.id)).toStrictEqual([2, 1, 90]);
    expect(a[0].kind).toBe('programmed');
    expect(a[2].kind).toBe('finished');

    const b = result.current.get('b');
    expect(b.map((r) => r.id)).toStrictEqual([3, 91]);
  });

  it('keeps a single entry for a running recording listed by both endpoints', async () => {
    // The Freebox also lists an in-progress recording under /pvr/finished/,
    // with the same id and its margins included in start/end
    mockPvrLists({
      programmed: [programmedRaw({ id: 399, channel_uuid: 'a', start: 1000, end: 2000, state: 'running' })],
      finished: [
        finishedRaw({ id: 399, channel_uuid: 'a', start: 700, end: 2900, state: 'running' }),
        finishedRaw({ id: 12, channel_uuid: 'b', start: 100, end: 500 }),
      ],
    });

    const { result } = renderRecordings();
    await waitFor(() => expect([...result.current.keys()].toSorted()).toStrictEqual(['a', 'b']));

    const a = result.current.get('a');
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ id: 399, kind: 'programmed', state: 'running' });
  });

  it('drops finished recordings older than 6 hours', async () => {
    // useCurrentTime mocked at 10_000s; cutoff = 10_000 - 21_600 = -11_600
    mockPvrLists({
      finished: [
        // end before cutoff -> dropped
        finishedRaw({ id: 1, channel_uuid: 'a', start: -50_000, end: -20_000 }),
        // end after cutoff -> kept
        finishedRaw({ id: 2, channel_uuid: 'a', start: -5_000, end: -1_000 }),
      ],
    });

    const { result } = renderRecordings();
    await waitFor(() => expect(result.current.get('a')?.length).toBe(1));
    expect(result.current.get('a')[0].id).toBe(2);
  });

  it('skips recordings without a channel UUID', async () => {
    mockPvrLists({
      programmed: [
        programmedRaw({ id: 1, channel_uuid: '', start: 1000, end: 1500 }),
        programmedRaw({ id: 2, channel_uuid: 'a', start: 1000, end: 1500 }),
      ],
    });

    const { result } = renderRecordings();
    await waitFor(() => expect(result.current.size).toBe(1));
    expect(result.current.has('a')).toBe(true);
    expect(result.current.has('')).toBe(false);
  });

  it('returns the same reference between renders when data is identical', async () => {
    mockPvrLists({
      programmed: [programmedRaw({ id: 1, channel_uuid: 'a', start: 1000, end: 1500 })],
    });

    const { result, rerender } = renderRecordings();
    await waitFor(() => expect(result.current.size).toBe(1));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
