/**
 * Image loader for pictures served by the Freebox (`/api/latest/tv/img/…`).
 *
 * A plain `<img src>` bypasses the request queue: the browser fires every
 * image at once, the Freebox answers 503 past ~25 waiting requests, and the
 * image is never retried. Here an image already in the HTTP cache is read
 * straight away; any other one waits for a queue slot, is retried on
 * 503/429/network errors like API calls, and is handed out as a blob URL.
 * @module api/imageLoader
 */

import { IMAGE_CACHE_MAX_ENTRIES } from '@/utils/constants';
import { ApiHttpError, MAX_TRANSIENT_RETRIES, isTransientError, transientRetryDelay } from './client';
import { PRIORITY, buildAbortError, recordAnswer, runInQueue } from './requestQueue';

/** Loaded images, least recently used first: url → blob URL */
const cache = new Map();

/**
 * Remember a loaded image, evicting (and revoking) the least recently used
 * one past the cache size. Revoking does not affect an image already shown.
 * @param {string} url - Image URL
 * @param {string} objectUrl - Blob URL
 */
const remember = (url, objectUrl) => {
  cache.set(url, objectUrl);
  if (cache.size > IMAGE_CACHE_MAX_ENTRIES) {
    const [oldestUrl, oldestObjectUrl] = cache.entries().next().value;
    cache.delete(oldestUrl);
    URL.revokeObjectURL(oldestObjectUrl);
  }
};

/**
 * Wait without holding a queue slot.
 * @param {number} ms - Delay in milliseconds
 * @param {AbortSignal} [signal] - Abort signal cutting the wait short
 * @returns {Promise<void>} Resolves after the delay
 * @throws {Error} AbortError if the signal aborts first
 */
const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(buildAbortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(buildAbortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });

/**
 * Read the image from the HTTP cache without touching the network.
 * @param {string} url - Image URL (same origin)
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<Blob|null>} The cached image, or null if absent
 */
const readHttpCache = async (url, signal) => {
  try {
    const response = await fetch(url, { cache: 'only-if-cached', mode: 'same-origin', signal });
    return response.ok ? await response.blob() : null;
  } catch {
    return null;
  }
};

/**
 * Fetch the image from the Freebox through the request queue, retrying
 * transient failures with the same backoff as API calls.
 * @param {string} url - Image URL
 * @param {AbortSignal} [signal] - Abort signal, observed while waiting for a
 *   slot or a retry; a request already sent runs to its end
 * @returns {Promise<Blob>} The image
 * @throws {ApiHttpError} On a permanent HTTP failure or once retries are spent
 */
const fetchFromNetwork = async (url, signal) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop -- retries are sequential by design
      return await runInQueue(
        async () => {
          // No signal: once sent, the image is served anyway and kept in memory.
          const response = await fetch(url);
          recordAnswer(response.status);
          if (!response.ok) {
            throw new ApiHttpError(response.status, response.statusText);
          }
          return response.blob();
        },
        { priority: PRIORITY.IMAGE, signal },
      );
    } catch (error) {
      if (!isTransientError(error) || attempt >= MAX_TRANSIENT_RETRIES) throw error;
      // eslint-disable-next-line no-await-in-loop -- retries are sequential by design
      await wait(transientRetryDelay(attempt + 1), signal);
    }
  }
};

/**
 * Load a Freebox image and return a blob URL for it.
 * @param {string} url - Image URL, same origin (`/api/latest/tv/img/…`)
 * @param {Object} [options] - Options
 * @param {AbortSignal} [options.signal] - Abort signal; an aborted load leaves the queue
 * @returns {Promise<string>} Blob URL of the image
 * @throws {ApiHttpError} On a permanent HTTP failure or once retries are spent
 * @throws {Error} AbortError if the signal aborts
 */
export const loadImage = async (url, { signal } = {}) => {
  const known = cache.get(url);
  if (known) {
    // Refresh the entry so the most used images stay in memory.
    cache.delete(url);
    cache.set(url, known);
    return known;
  }
  const blob = (await readHttpCache(url, signal)) ?? (await fetchFromNetwork(url, signal));
  const objectUrl = URL.createObjectURL(blob);
  remember(url, objectUrl);
  return objectUrl;
};

/**
 * Return the blob URL of an image already loaded in memory, without
 * loading anything. Lets a remounted component show the image on its first
 * render instead of flashing its placeholder.
 * @param {string} url - Image URL
 * @returns {string|null} Blob URL, or null if the image is not in memory
 */
export const peekImage = (url) => cache.get(url) ?? null;

/**
 * Forget every loaded image and revoke its blob URL. For tests and logout.
 */
export const clearImageCache = () => {
  for (const objectUrl of cache.values()) URL.revokeObjectURL(objectUrl);
  cache.clear();
};
