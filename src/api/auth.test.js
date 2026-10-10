import { checkAuth, logout } from './auth';

const htmlResponse = (status, statusText) =>
  new Response('<html>Bad Gateway</html>', {
    status,
    statusText,
    headers: { 'Content-Type': 'text/html' },
  });

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('checkAuth', () => {
  it('returns the login status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      Response.json({ success: true, result: { logged_in: true } }),
    );
    await expect(checkAuth()).resolves.toStrictEqual({ logged_in: true });
  });

  it('reports an unreachable Freebox when the proxy answers with a non-JSON page', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(htmlResponse(502, 'Bad Gateway'));
    await expect(checkAuth()).rejects.toThrow('La Freebox ne répond pas (HTTP 502)');
  });
});

describe('logout', () => {
  it('reports an unreachable Freebox on a non-JSON page', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(htmlResponse(504, 'Gateway Timeout'));
    await expect(logout()).rejects.toThrow('La Freebox ne répond pas (HTTP 504)');
  });
});
