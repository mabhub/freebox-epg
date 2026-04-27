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
 * Build an `AbortError` matching the DOM convention so callers (and
 * React Query) can recognise the cancellation through `error.name`.
 * @returns {Error} Abort error
 */
const buildAbortError = () => {
  const error = new Error('Request aborted');
  error.name = 'AbortError';
  return error;
};

/**
 * Run a fetch task under the global concurrency limit. Tasks beyond the
 * limit wait in a FIFO queue and are released as in-flight requests
 * complete. If the caller passes an `AbortSignal`, the task is dropped
 * before entering the network — both at queue-entry time and as soon as
 * abort fires while waiting in the queue — so a pair of (channel, bucket)
 * scrolled out of the viewport never blocks one that is still on screen.
 *
 * @param {() => Promise<*>} task - Function performing the fetch
 * @param {AbortSignal} [signal] - Optional abort signal observed before launch
 * @returns {Promise<*>} Resolution of the underlying task
 */
const withConcurrencyLimit = async (task, signal) => {
  if (signal?.aborted) {
    throw buildAbortError();
  }
  if (inFlight >= MAX_CONCURRENT_REQUESTS) {
    // The slot object holds both the entry function the queue runs and a
    // flag we flip on abort. Storing the same object lets the abort
    // handler splice the entry out of the queue, and lets the queue
    // walker skip already-aborted entries — without this, an aborted
    // entry would still consume a slot when reached, holding back the
    // requests that are still relevant.
    const slot = { aborted: false, run: null };
    await new Promise((resolve, reject) => {
      const onAbort = () => {
        slot.aborted = true;
        const idx = queue.indexOf(slot);
        if (idx !== -1) queue.splice(idx, 1);
        reject(buildAbortError());
      };
      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }
      slot.run = () => {
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve();
      };
      queue.push(slot);
    });
  }
  inFlight += 1;
  try {
    return await task();
  } finally {
    inFlight -= 1;
    // Skip aborted entries left in the queue (defensive: onAbort already
    // splices, but keep this so a late-arriving abort doesn't waste a slot).
    let next;
    while (queue.length > 0) {
      const candidate = queue.shift();
      if (!candidate.aborted) { next = candidate; break; }
    }
    if (next) next.run();
  }
};

/**
 * Fetch wrapper for the Freebox API
 * Handles base URL, credentials, and response unwrapping
 * @param {string} path - API path (e.g., "/tv/channels/")
 * @param {RequestInit} [options] - Fetch options. `signal` is forwarded to
 *   the underlying fetch and observed by the concurrency queue.
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
  }, options.signal);

export default apiFetch;
