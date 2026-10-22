import { renderHook, waitFor } from '@testing-library/react';
import { ApiHttpError } from '@/api/client';
import { loadImage, peekImage } from '@/api/imageLoader';
import useFreeboxImage from './useFreeboxImage';

vi.mock('@/api/imageLoader', () => ({ loadImage: vi.fn(), peekImage: vi.fn(() => null) }));

beforeEach(() => {
  loadImage.mockReset();
});

describe('useFreeboxImage', () => {
  it('returns no source and loads nothing for a null url', () => {
    const { result } = renderHook(() => useFreeboxImage(null));
    expect(result.current).toStrictEqual({ src: null, failed: false });
    expect(loadImage).not.toHaveBeenCalled();
  });

  it('returns the blob url once loaded', async () => {
    loadImage.mockResolvedValue('blob:1');
    const { result } = renderHook(() => useFreeboxImage('/api/latest/tv/img/a.jpg'));
    await waitFor(() => expect(result.current).toStrictEqual({ src: 'blob:1', failed: false }));
  });

  it('flags a definitive failure', async () => {
    loadImage.mockRejectedValue(new ApiHttpError(404, 'Not Found'));
    const { result } = renderHook(() => useFreeboxImage('/api/latest/tv/img/a.jpg'));
    await waitFor(() => expect(result.current).toStrictEqual({ src: null, failed: true }));
  });

  it('serves an image already in memory on the first render without loading it', () => {
    peekImage.mockReturnValueOnce('blob:cached');
    const { result } = renderHook(() => useFreeboxImage('/api/latest/tv/img/a.jpg'));
    expect(result.current).toStrictEqual({ src: 'blob:cached', failed: false });
    expect(loadImage).not.toHaveBeenCalled();
  });

  it('aborts the load on unmount', () => {
    loadImage.mockReturnValue(new Promise(() => {}));
    const errorSpy = vi.spyOn(console, 'error');
    const { unmount } = renderHook(() => useFreeboxImage('/api/latest/tv/img/a.jpg'));
    const { signal } = loadImage.mock.calls[0][1];
    unmount();
    expect(signal.aborted).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
