import apiFetch, { AuthError, ApiHttpError, PRIORITY, isTransientError, transientRetryDelay } from './client';
import { getLastSaturationAt } from './requestQueue';

const buildResponse = (body, init = {}) =>
  Response.json(body, {
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
  });

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('apiFetch', () => {
  it('unwraps the result on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(buildResponse({ success: true, result: { ok: 1 } }));
    await expect(apiFetch('/x')).resolves.toStrictEqual({ ok: 1 });
  });

  it('returns null for a success without result, as the Freebox answers an empty list', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(buildResponse({ success: true }));
    await expect(apiFetch('/pvr/programmed/')).resolves.toBeNull();
  });

  it('throws AuthError on 403', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 403, statusText: 'Forbidden' }));
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

  it('does not forward priority and rank to fetch', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(buildResponse({ success: true, result: 1 }));
    await apiFetch('/x', { priority: PRIORITY.IMAGE, rank: 2 });
    expect(spy.mock.calls[0][1]).not.toHaveProperty('priority');
    expect(spy.mock.calls[0][1]).not.toHaveProperty('rank');
  });

  it.each([503, 429])('marks the Freebox saturated on %i', async (status) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status }));
    const before = Date.now();
    await expect(apiFetch('/x')).rejects.toMatchObject({ status });
    expect(getLastSaturationAt()).toBeGreaterThanOrEqual(before);
  });
});

describe('transientRetryDelay', () => {
  it('caps the transient retry delay at 30 s', () => {
    expect(transientRetryDelay(1)).toBe(2000);
    expect(transientRetryDelay(10)).toBe(30_000);
  });
});

describe('isTransientError', () => {
  it('retries saturation and rate limiting', () => {
    expect(isTransientError(new ApiHttpError(503, 'Service Unavailable'))).toBe(true);
    expect(isTransientError(new ApiHttpError(429, 'Too Many Requests'))).toBe(true);
  });

  it('retries network failures raised by fetch', () => {
    expect(isTransientError(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('does not retry permanent failures', () => {
    expect(isTransientError(new ApiHttpError(404, 'Not Found'))).toBe(false);
    expect(isTransientError(new AuthError('Session expired'))).toBe(false);
    expect(isTransientError(new Error('API error: invalid_request'))).toBe(false);
    expect(isTransientError(new SyntaxError('Unexpected token <'))).toBe(false);
  });

  it('does not retry deliberate cancellations', () => {
    expect(isTransientError(new DOMException('Aborted', 'AbortError'))).toBe(false);
  });
});
