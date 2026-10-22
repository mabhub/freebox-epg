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
  // Images of the rendered cells before the margins: they show on screen,
  // the margins only serve the next scroll.
  IMAGE: 2,
  EPG_OVERSCAN: 3,
  PREFETCH: 4,
});

/** Maximum number of in-flight requests to the Freebox at any time.
 *  The router caps simultaneous HTTP connections (observed 503
 *  "Limite de connexion dépassée" past ~6-8 in flight); throttling
 *  client-side avoids the burst and the cascade of retries that follows.
 *  4 leaves headroom for the EPG worst case (full viewport + recordings)
 *  while staying well under the cap. */
const MAX_CONCURRENT_REQUESTS = 4;

/** HTTP statuses the Freebox answers when saturated or rate limiting */
export const SATURATION_STATUSES = new Set([503, 429]);

/** Pause after a first 503/429. A saturated Freebox refuses in ~50 ms, so
 *  without a pause the queue would send dozens of doomed requests per
 *  second and keep it saturated. */
const SATURATION_PAUSE_MS = 1000;

/** Longest pause, reached when saturations follow each other */
const SATURATION_PAUSE_MAX_MS = 30_000;

let inFlight = 0;
let nextSeq = 0;
let lastSaturationAt = 0;
// Saturations in a row, without a healthy answer in between. While it is
// non-zero the queue probes the Freebox with one request at a time.
let saturationStreak = 0;
let pausedUntil = 0;
let resumeTimer = null;
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
 * Start the most urgent waiting entries while the Freebox accepts more
 * requests: up to 4 in flight, a single probe after a saturation, none
 * during a pause. A pause schedules the next attempt at its end.
 */
const pump = () => {
  const now = Date.now();
  if (now < pausedUntil) {
    clearTimeout(resumeTimer);
    resumeTimer = waiting.length > 0 ? setTimeout(pump, pausedUntil - now) : null;
    return;
  }
  const limit = saturationStreak > 0 ? 1 : MAX_CONCURRENT_REQUESTS;
  while (inFlight < limit && waiting.length > 0) {
    inFlight += 1;
    takeNext().run();
  }
};

/**
 * Wait for a free slot. Resolves at once when one is available.
 * @param {{ priority: number, rank: number, signal?: AbortSignal }} options - Entry ordering and cancellation
 * @returns {Promise<void>} Resolves when the caller holds a slot
 */
const acquireSlot = ({ priority, rank, signal }) =>
  new Promise((resolve, reject) => {
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
    pump();
  });

/**
 * Free a slot and hand it to the most urgent waiting entry.
 */
const releaseSlot = () => {
  inFlight -= 1;
  pump();
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
 * Record that the Freebox answered 503 or 429: the queue starts nothing
 * for a pause, 1 s doubled at each saturation in a row up to 30 s, then
 * probes with one request at a time until a healthy answer. Answers to
 * requests sent before the pause belong to the same burst and do not
 * lengthen it.
 * @param {number} [now] - Time of the answer, in milliseconds (current time by default)
 */
export const markSaturated = (now = Date.now()) => {
  lastSaturationAt = now;
  if (now < pausedUntil) return;
  saturationStreak += 1;
  pausedUntil = now + Math.min(SATURATION_PAUSE_MS * 2 ** (saturationStreak - 1), SATURATION_PAUSE_MAX_MS);
};

/**
 * Record the status of an answer from the Freebox. A saturation pauses the
 * queue (see markSaturated); any other answer proves the Freebox serves
 * again and reopens every slot.
 * @param {number} status - HTTP status of the answer
 */
export const recordAnswer = (status) => {
  if (SATURATION_STATUSES.has(status)) {
    markSaturated();
    return;
  }
  if (saturationStreak > 0) {
    saturationStreak = 0;
    pump();
  }
};

/**
 * Time of the last 503 or 429 answer.
 * @returns {number} Milliseconds since epoch, or 0 if none yet
 */
export const getLastSaturationAt = () => lastSaturationAt;

/**
 * Forget every saturation and its pause. For tests.
 */
export const resetSaturation = () => {
  clearTimeout(resumeTimer);
  resumeTimer = null;
  lastSaturationAt = 0;
  saturationStreak = 0;
  pausedUntil = 0;
};
