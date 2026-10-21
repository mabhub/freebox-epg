import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import apiFetch from '@/api/client';
import { transformRecording } from '@/api/transformers';
import useResizeWithUndo from './useResizeWithUndo';

vi.mock('@/api/client', () => ({
  default: vi.fn(),
  AuthError: class AuthError extends Error {
    name = 'AuthError';
  },
}));

const raw = { id: 7, name: 'Série', start: 1000, end: 4000, margin_before: 300, margin_after: 900 };
const recording = transformRecording(raw, 'programmed');

const renderResize = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return renderHook(() => useResizeWithUndo(), { wrapper });
};

const sentBody = (call) => JSON.parse(call[1].body);

describe('useResizeWithUndo', () => {
  afterEach(() => {
    apiFetch.mockReset();
  });

  it('confirms a saved resize with an undo', async () => {
    apiFetch.mockResolvedValue({});
    const { result } = renderResize();

    act(() => result.current.resize(recording, { start: 1300, end: 4600 }));

    await waitFor(() => expect(result.current.notice).not.toBeNull());
    expect(result.current.notice.message).toMatch(/^Enregistrement modifié : \d\d:\d\d – \d\d:\d\d$/);
    expect(result.current.notice.undo).toBeTypeOf('function');
  });

  it('sends the slot from before the drag when undone', async () => {
    apiFetch.mockResolvedValue({});
    const { result } = renderResize();
    act(() => result.current.resize(recording, { start: 1300, end: 4600 }));
    await waitFor(() => expect(result.current.notice).not.toBeNull());

    act(() => result.current.notice.undo());

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    expect(sentBody(apiFetch.mock.calls[1])).toMatchObject({ start: 1000, end: 4000 });
  });

  it('reports a refusal with the Freebox message and no undo', async () => {
    apiFetch.mockRejectedValue(new Error('Horaire invalide'));
    const { result } = renderResize();

    act(() => result.current.resize(recording, { start: 1300, end: 4600 }));

    await waitFor(() => expect(result.current.notice).not.toBeNull());
    expect(result.current.notice).toStrictEqual({
      message: 'Modification refusée par la Freebox : Horaire invalide',
      severity: 'error',
    });
  });

  it('clears the notice on close', async () => {
    apiFetch.mockResolvedValue({});
    const { result } = renderResize();
    act(() => result.current.resize(recording, { start: 1300, end: 4600 }));
    await waitFor(() => expect(result.current.notice).not.toBeNull());

    act(() => result.current.closeNotice());

    expect(result.current.notice).toBeNull();
  });
});
