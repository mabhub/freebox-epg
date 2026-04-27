import apiFetch, { AuthError } from './client';

const buildResponse = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    headers: { 'Content-Type': 'application/json' },
  });

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('apiFetch', () => {
  it('unwraps the result on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      buildResponse({ success: true, result: { ok: 1 } }),
    );
    await expect(apiFetch('/x')).resolves.toStrictEqual({ ok: 1 });
  });

  it('throws AuthError on 403', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 403, statusText: 'Forbidden' }),
    );
    await expect(apiFetch('/x')).rejects.toBeInstanceOf(AuthError);
  });

  it('throws ApiHttpError carrying status on non-2xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 503, statusText: 'Service Unavailable' }),
    );
    await expect(apiFetch('/x')).rejects.toMatchObject({
      name: 'ApiHttpError',
      status: 503,
    });
  });

  it('limits concurrency to 4 simultaneous requests', async () => {
    let inFlight = 0;
    let peak = 0;
    const resolvers = [];

    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      return new Promise((resolve) => {
        resolvers.push(() => {
          inFlight -= 1;
          resolve(buildResponse({ success: true, result: null }));
        });
      });
    });

    const promises = Array.from({ length: 10 }, (_, i) => apiFetch(`/x/${i}`));

    // Yield enough turns for the four leading tasks to enter fetch().
    // eslint-disable-next-line no-await-in-loop -- sequential ticks needed to observe the queue
    for (let i = 0; i < 20; i += 1) await flush();
    expect(peak).toBe(4);
    expect(resolvers).toHaveLength(4);

    // Resolve them one by one; each release lets the next queued task
    // enter fetch — peak must never go above 4.
    while (resolvers.length > 0) {
      const next = resolvers.shift();
      next();
      // eslint-disable-next-line no-await-in-loop -- sequential ticks needed to observe the queue
      for (let i = 0; i < 5; i += 1) await flush();
    }
    await Promise.all(promises);
    expect(peak).toBe(4);
  });
});
