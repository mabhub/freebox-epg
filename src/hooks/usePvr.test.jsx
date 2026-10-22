import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import apiFetch from '@/api/client';
import { transformRecording } from '@/api/transformers';
import { useResizeRecording } from './usePvr';

vi.mock('@/api/client', () => ({
  default: vi.fn(),
  AuthError: class AuthError extends Error {
    name = 'AuthError';
  },
}));

const raw = {
  id: 7,
  channel_uuid: 'uuid-1',
  name: 'Série',
  start: 1000,
  end: 4000,
  margin_before: 300,
  margin_after: 900,
  state: 'waiting_start_time',
  media: 'Disque',
};

const renderResize = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  queryClient.setQueryData(['pvr', 'programmed'], [raw, { ...raw, id: 8 }]);
  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const hook = renderHook(() => useResizeRecording(), { wrapper });
  return { ...hook, queryClient };
};

const recording = transformRecording(raw, 'programmed');

describe('useResizeRecording', () => {
  afterEach(() => {
    apiFetch.mockReset();
  });

  it('sends the recording back with the new program slot', async () => {
    apiFetch.mockResolvedValue({});
    const { result } = renderResize();

    await act(() => result.current.mutateAsync({ recording, start: 1300, end: 4600 }));

    expect(apiFetch).toHaveBeenCalledWith('/pvr/programmed/7', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...raw, start: 1300, end: 4600 }),
    });
  });

  it('keeps the fields edited since the drag began, as an undo would otherwise revert them', async () => {
    apiFetch.mockResolvedValue({});
    const { result, queryClient } = renderResize();
    const edited = { ...raw, name: 'Renommée', margin_after: 600 };
    queryClient.setQueryData(['pvr', 'programmed'], [edited, { ...raw, id: 8 }]);

    await act(() => result.current.mutateAsync({ recording, start: 1000, end: 4000 }));

    expect(apiFetch.mock.calls[0][1].body).toBe(JSON.stringify(edited));
  });

  it('shows the new slot in the cache before the Freebox answers', async () => {
    apiFetch.mockReturnValue(new Promise(() => {}));
    const { result, queryClient } = renderResize();

    act(() => {
      result.current.mutate({ recording, start: 1300, end: 4600 });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(['pvr', 'programmed'])).toStrictEqual([
        { ...raw, start: 1300, end: 4600 },
        { ...raw, id: 8 },
      ]);
    });
  });

  it('puts the previous slot back when the Freebox refuses', async () => {
    apiFetch.mockRejectedValue(new Error('refused'));
    const { result, queryClient } = renderResize();

    await act(async () => {
      await result.current.mutateAsync({ recording, start: 1300, end: 4600 }).catch(() => {});
    });

    expect(queryClient.getQueryData(['pvr', 'programmed'])).toStrictEqual([raw, { ...raw, id: 8 }]);
  });
});
