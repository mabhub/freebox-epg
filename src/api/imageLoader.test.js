/* eslint-disable vitest/prefer-called-once -- contradicts vitest/prefer-called-times, both enabled */
import { transientRetryDelay } from './client';
import { getLastSaturationAt, resetSaturation, runInQueue } from './requestQueue';
import { clearImageCache, loadImage, peekImage } from './imageLoader';

vi.mock('./requestQueue', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, runInQueue: vi.fn(original.runInQueue) };
});

vi.mock('@/utils/constants', async (importOriginal) => ({
  ...(await importOriginal()),
  IMAGE_CACHE_MAX_ENTRIES: 2,
}));

const image = (status = 200) => new Response(status === 200 ? new Blob(['img']) : '', { status });
const notCached = () => Promise.reject(new TypeError('Failed to fetch'));

/**
 * Stub fetch: the HTTP-cache probe and the network answers are scripted separately.
 * @param {Object} script - Answers
 * @param {() => Promise<Response>} [script.cached] - Answer to the `only-if-cached` probe
 * @param {Array<() => Promise<Response>>} [script.network] - Successive network answers
 * @returns {import('vitest').MockInstance} fetch spy
 */
const stubFetch = ({ cached = notCached, network = [] }) => {
  const answers = [...network];
  return vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
    if (init?.cache === 'only-if-cached') return cached();
    return answers.shift()();
  });
};

let blobCount = 0;

beforeEach(() => {
  vi.restoreAllMocks();
  runInQueue.mockClear();
  blobCount = 0;
  // jsdom has no blob URLs.
  Object.assign(URL, {
    createObjectURL: vi.fn(() => {
      blobCount += 1;
      return `blob:${blobCount}`;
    }),
    revokeObjectURL: vi.fn(),
  });
  clearImageCache();
});

afterEach(() => {
  resetSaturation();
  vi.useRealTimers();
});

describe('loadImage', () => {
  it('serves an HTTP-cached image without entering the queue', async () => {
    const spy = stubFetch({ cached: () => Promise.resolve(image()) });
    await expect(loadImage('/api/latest/tv/img/a.jpg')).resolves.toBe('blob:1');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(runInQueue).not.toHaveBeenCalled();
  });

  it('fetches through the queue when not cached', async () => {
    const spy = stubFetch({ network: [() => Promise.resolve(image())] });
    await expect(loadImage('/api/latest/tv/img/a.jpg')).resolves.toBe('blob:1');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][1]?.cache).toBeUndefined();
    expect(runInQueue).toHaveBeenCalledTimes(1);
  });

  it('retries a 503 then succeeds', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const before = Date.now();
    const spy = stubFetch({ network: [() => Promise.resolve(image(503)), () => Promise.resolve(image())] });
    const pending = loadImage('/api/latest/tv/img/a.jpg');
    await vi.advanceTimersByTimeAsync(transientRetryDelay(1));
    await expect(pending).resolves.toBe('blob:1');
    expect(spy).toHaveBeenCalledTimes(3);
    expect(getLastSaturationAt()).toBeGreaterThanOrEqual(before);
  });

  it('gives up on 404 without retrying', async () => {
    const spy = stubFetch({ network: [() => Promise.resolve(image(404))] });
    await expect(loadImage('/api/latest/tv/img/a.jpg')).rejects.toMatchObject({ status: 404 });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('stops retrying when aborted during the backoff', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const spy = stubFetch({ network: [() => Promise.resolve(image(503)), () => Promise.resolve(image())] });
    const controller = new AbortController();
    const pending = loadImage('/api/latest/tv/img/a.jpg', { signal: controller.signal });
    await vi.advanceTimersByTimeAsync(10);
    const callsBeforeAbort = spy.mock.calls.length;
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(spy).toHaveBeenCalledTimes(callsBeforeAbort);
  });

  it('keeps an image already requested when the load is aborted', async () => {
    let answer;
    const spy = stubFetch({
      network: [
        () =>
          new Promise((resolve) => {
            answer = resolve;
          }),
      ],
    });
    const controller = new AbortController();
    const pending = loadImage('/api/latest/tv/img/a.jpg', { signal: controller.signal });
    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    controller.abort();
    answer(image());
    await pending;
    expect(spy.mock.calls[1][1]?.signal).toBeUndefined();
    expect(peekImage('/api/latest/tv/img/a.jpg')).toBe('blob:1');
  });

  it('serves a second load from memory', async () => {
    const spy = stubFetch({ cached: () => Promise.resolve(image()) });
    await loadImage('/api/latest/tv/img/a.jpg');
    await expect(loadImage('/api/latest/tv/img/a.jpg')).resolves.toBe('blob:1');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('revokes the oldest entry past the cache size', async () => {
    stubFetch({ cached: () => Promise.resolve(image()) });
    await loadImage('/api/latest/tv/img/a.jpg');
    await loadImage('/api/latest/tv/img/b.jpg');
    await loadImage('/api/latest/tv/img/c.jpg');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith('blob:2');
  });
});

describe('peekImage', () => {
  it('returns null for an image not loaded yet', () => {
    expect(peekImage('/api/latest/tv/img/a.jpg')).toBeNull();
  });

  it('returns the blob url of a loaded image without fetching', async () => {
    const spy = stubFetch({ cached: () => Promise.resolve(image()) });
    await loadImage('/api/latest/tv/img/a.jpg');
    expect(peekImage('/api/latest/tv/img/a.jpg')).toBe('blob:1');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
