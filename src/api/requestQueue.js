/**
 * Single priority queue for every request sent to the Freebox (API calls
 * and images). The Freebox serves about 15 requests per second whatever the
 * parallelism and answers 503 past ~25 waiting requests, so the order in
 * which the client spends its slots decides what the user sees first.
 * @module api/requestQueue
 */

/**
 * Service classes, most urgent first. A caller that names none is served
 * as an interaction: forgetting it costs the prefetch some latency, never
 * the user.
 */
export const PRIORITY = Object.freeze({
  INTERACTION: 0,
  EPG_VISIBLE: 1,
  EPG_OVERSCAN: 2,
  IMAGE: 3,
  PREFETCH: 4,
});

/** Maximum number of in-flight requests to the Freebox at any time.
 *  The router caps simultaneous HTTP connections (observed 503
 *  "Limite de connexion dépassée" past ~6-8 in flight); throttling
 *  client-side avoids the burst and the cascade of retries that follows.
 *  4 leaves headroom for the EPG worst case (full viewport + recordings)
 *  while staying well under the cap. */
const MAX_CONCURRENT_REQUESTS = 4;

let inFlight = 0;
let nextSeq = 0;
let lastSaturationAt = 0;
const waiting = [];

/**
 * Build an `AbortError` matching the DOM convention so callers (and
 * React Query) can recognise the cancellation through `error.name`.
 * @returns {Error} Abort error
 */
export const buildAbortError = () => {
  const error = new Error('Request aborted');
  error.name = 'AbortError';
  return error;
};

/**
 * Tell whether entry `a` must be served before entry `b`.
 * @param {{ priority: number, rank: number, seq: number }} a - Waiting entry
 * @param {{ priority: number, rank: number, seq: number }} b - Waiting entry
 * @returns {boolean} True if `a` comes first
 */
const isBefore = (a, b) => {
  if (a.priority !== b.priority) return a.priority < b.priority;
  if (a.rank !== b.rank) return a.rank < b.rank;
  return a.seq < b.seq;
};

/**
 * Remove and return the most urgent waiting entry, or undefined.
 * @returns {Object|undefined} Entry to run next
 */
const takeNext = () => {
  let best = -1;
  for (let i = 0; i < waiting.length; i += 1) {
    if (best === -1 || isBefore(waiting[i], waiting[best])) best = i;
  }
  return best === -1 ? undefined : waiting.splice(best, 1)[0];
};

/**
 * Wait for a free slot. Resolves at once when one is available.
 * @param {{ priority: number, rank: number, signal?: AbortSignal }} options - Entry ordering and cancellation
 * @returns {Promise<void>} Resolves when the caller holds a slot
 */
const acquireSlot = ({ priority, rank, signal }) => {
  if (inFlight < MAX_CONCURRENT_REQUESTS) {
    inFlight += 1;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const entry = { priority, rank, seq: nextSeq, run: null };
    nextSeq += 1;
    const onAbort = () => {
      const idx = waiting.indexOf(entry);
      if (idx !== -1) waiting.splice(idx, 1);
      reject(buildAbortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    entry.run = () => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    };
    waiting.push(entry);
  });
};

/**
 * Hand the slot over to the most urgent waiting entry, or free it.
 */
const releaseSlot = () => {
  const next = takeNext();
  if (next) {
    // The slot passes straight to the next entry: inFlight is unchanged.
    next.run();
  } else {
    inFlight -= 1;
  }
};

/**
 * Run a task under the global concurrency limit. Waiting tasks are served
 * by priority, then rank, then arrival. If the caller passes an
 * `AbortSignal`, the task is dropped before entering the network — both at
 * queue-entry time and as soon as abort fires while waiting — so a request
 * that is no longer useful never holds back one that still is.
 *
 * @template T
 * @param {() => Promise<T>} task - Function performing the request
 * @param {Object} [options] - Queue options
 * @param {number} [options.priority] - Service class, see PRIORITY (interaction by default)
 * @param {number} [options.rank] - Order inside the class, lower first (0 by default)
 * @param {AbortSignal} [options.signal] - Abort signal observed while waiting
 * @returns {Promise<T>} Resolution of the task
 * @throws {Error} AbortError if the signal aborts before the task starts
 */
export const runInQueue = async (task, { priority = PRIORITY.INTERACTION, rank = 0, signal } = {}) => {
  if (signal?.aborted) {
    throw buildAbortError();
  }
  await acquireSlot({ priority, rank, signal });
  try {
    return await task();
  } finally {
    releaseSlot();
  }
};

/**
 * Tell whether a task more urgent than `priority` is waiting for a slot.
 * @param {number} priority - Service class of the caller
 * @returns {boolean} True if a waiting task has a strictly smaller priority
 */
export const hasQueuedAhead = (priority) => waiting.some((entry) => entry.priority < priority);

/**
 * Record that the Freebox answered 503 or 429.
 * @param {number} [now] - Time of the answer, in milliseconds (current time by default)
 */
export const markSaturated = (now = Date.now()) => {
  lastSaturationAt = now;
};

/**
 * Time of the last 503 or 429 answer.
 * @returns {number} Milliseconds since epoch, or 0 if none yet
 */
export const getLastSaturationAt = () => lastSaturationAt;
