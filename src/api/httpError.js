/**
 * Error thrown for non-2xx, non-403 API responses. Carries the HTTP
 * status so callers (notably React Query's retry policy) can distinguish
 * transient failures (503, 429) from permanent ones.
 * @module api/httpError
 */

class ApiHttpError extends Error {
  constructor (status, statusText) {
    super(`API error: ${status} ${statusText}`);
    this.name = 'ApiHttpError';
    this.status = status;
  }
}

export default ApiHttpError;
