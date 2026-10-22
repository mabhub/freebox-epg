/**
 * API client for the Freebox TV API
 * @module api/client
 */

import { API_BASE_URL } from '@/utils/constants';
import AuthError from './errors';
import ApiHttpError from './httpError';
import { PRIORITY, markSaturated, runInQueue } from './requestQueue';

export { default as ApiHttpError } from './httpError';
export { default as AuthError } from './errors';
export { PRIORITY } from './requestQueue';

/** HTTP statuses the Freebox returns when saturated or rate limiting */
const TRANSIENT_STATUSES = new Set([503, 429]);

/**
 * Tell whether a failed request is worth retrying. Only saturation (503,
 * 429) and network failures (fetch rejects with a TypeError) are
 * transient; auth errors, other HTTP statuses, `success: false` payloads
 * and non-JSON bodies would fail the same way again. An AbortError is a
 * deliberate cancellation and must not be retried either.
 * @param {Error} error - Error thrown by apiFetch
 * @returns {boolean} True if a retry may succeed
 */
export const isTransientError = (error) => {
  if (error instanceof ApiHttpError) {
    return TRANSIENT_STATUSES.has(error.status);
  }
  return error instanceof TypeError;
};

/** Number of retries granted to a transient failure (503, 429, network) */
export const MAX_TRANSIENT_RETRIES = 5;

/**
 * Delay before the n-th retry of a transient failure: exponential backoff
 * capped at 30 s. Shared by React Query and the image loader.
 * @param {number} attempt - Retry number
 * @returns {number} Delay in milliseconds
 */
export const transientRetryDelay = (attempt) => Math.min(1000 * 2 ** attempt, 30_000);

/**
 * Fetch wrapper for the Freebox API
 * Handles base URL, credentials, and response unwrapping
 * @param {string} path - API path (e.g., "/tv/channels/")
 * @param {RequestInit & { priority?: number, rank?: number }} [options] - Fetch
 *   options. `signal` is forwarded to the underlying fetch and observed by the
 *   request queue; `priority` and `rank` order the request in the queue (see
 *   PRIORITY) and are not sent to fetch.
 * @returns {Promise<*>} Unwrapped API result, or null when the Freebox sends
 *   none (its answer for an empty list). React Query treats `undefined` as a
 *   failed fetch and would keep showing the previous data.
 * @throws {AuthError} If the API returns 403 (session expired)
 * @throws {ApiHttpError} If the API returns a non-2xx, non-403 status
 * @throws {Error} If the API returns success: false or network error
 */
const apiFetch = (path, { priority = PRIORITY.INTERACTION, rank = 0, ...init } = {}) =>
  runInQueue(
    async () => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        credentials: 'include',
        headers: {
          'X-FBX-FREEBOX0S': '1',
          ...init.headers,
        },
      });

      if (response.status === 403) {
        throw new AuthError('Session expired');
      }

      if (!response.ok) {
        if (TRANSIENT_STATUSES.has(response.status)) {
          markSaturated();
        }
        throw new ApiHttpError(response.status, response.statusText);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.msg ?? `API error: ${data.error_code ?? 'unknown'}`);
      }

      return data.result ?? null;
    },
    { priority, rank, signal: init.signal },
  );

export default apiFetch;
