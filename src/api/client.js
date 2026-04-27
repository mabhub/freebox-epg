/**
 * API client for the Freebox TV API
 * @module api/client
 */

import { API_BASE_URL } from '@/utils/constants';
import AuthError from './errors';
import ApiHttpError from './httpError';

export { ApiHttpError, AuthError };

/** Maximum number of in-flight requests to the Freebox at any time.
 *  The router caps simultaneous HTTP connections (observed 503
 *  "Limite de connexion dépassée" past ~6-8 in flight); throttling
 *  client-side avoids the burst and the cascade of retries that follows.
 *  4 leaves headroom for the EPG worst case (full viewport + recordings)
 *  while staying well under the cap. */
const MAX_CONCURRENT_REQUESTS = 4;

let inFlight = 0;
const queue = [];

/**
 * Run a fetch task under the global concurrency limit. Tasks beyond the
 * limit wait in a FIFO queue and are released as in-flight requests
 * complete.
 * @param {() => Promise<*>} task - Function performing the fetch
 * @returns {Promise<*>} Resolution of the underlying task
 */
const withConcurrencyLimit = async (task) => {
  if (inFlight >= MAX_CONCURRENT_REQUESTS) {
    await new Promise((resolve) => { queue.push(resolve); });
  }
  inFlight += 1;
  try {
    return await task();
  } finally {
    inFlight -= 1;
    const next = queue.shift();
    if (next) next();
  }
};

/**
 * Fetch wrapper for the Freebox API
 * Handles base URL, credentials, and response unwrapping
 * @param {string} path - API path (e.g., "/tv/channels/")
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<*>} Unwrapped API result
 * @throws {AuthError} If the API returns 403 (session expired)
 * @throws {ApiHttpError} If the API returns a non-2xx, non-403 status
 * @throws {Error} If the API returns success: false or network error
 */
const apiFetch = (path, options = {}) =>
  withConcurrencyLimit(async () => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'X-FBX-FREEBOX0S': '1',
        ...options.headers,
      },
    });

    if (response.status === 403) {
      throw new AuthError('Session expired');
    }

    if (!response.ok) {
      throw new ApiHttpError(response.status, response.statusText);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.msg ?? `API error: ${data.error_code ?? 'unknown'}`);
    }

    return data.result;
  });

export default apiFetch;
