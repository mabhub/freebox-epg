import {
  PRIORITY,
  runInQueue,
  hasQueuedAhead,
  markSaturated,
  getLastSaturationAt,
  recordAnswer,
  resetSaturation,
} from './requestQueue';

const flush = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/**
 * Let queued tasks enter and settle.
 * @param {number} [turns] - Event loop turns to wait
 */
const settle = async (turns = 10) => {
  // eslint-disable-next-line no-await-in-loop -- sequential ticks needed to observe the queue
  for (let i = 0; i < turns; i += 1) await flush();
};

/**
 * Build a task that stays pending until released.
 * @param {string} name - Label pushed to `started` when the task begins
 * @param {Array<string>} started - Start order log
 * @returns {{ task: () => Promise<string>, release: () => void }} Task and its release handle
 */
const blockingTask = (name, started) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  return {
    task: async () => {
      started.push(name);
      await gate;
      return name;
    },
    release: () => release(),
  };
};

afterEach(() => {
  resetSaturation();
});

describe('runInQueue', () => {
  it('never runs more than 4 tasks at once', async () => {
    let inFlight = 0;
    let peak = 0;
    const releases = [];
    const task = () =>
      new Promise((resolve) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        releases.push(() => {
          inFlight -= 1;
          resolve();
        });
      });
    const promises = Array.from({ length: 10 }, () => runInQueue(task));

    await settle(20);
    while (releases.length > 0) {
      releases.shift()();
      // eslint-disable-next-line no-await-in-loop -- sequential ticks needed to observe the queue
      await settle(5);
    }
    await Promise.all(promises);
    expect(peak).toBe(4);
  });

  it('rejects with AbortError when the signal is already aborted', async () => {
    const task = vi.fn();
    const controller = new AbortController();
    controller.abort();
    await expect(runInQueue(task, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(task).not.toHaveBeenCalled();
  });

  it('drops a queued task from the queue when its signal aborts', async () => {
    const started = [];
    const blockers = Array.from({ length: 4 }, (_, i) => blockingTask(`b${i}`, started));
    const blockerPromises = blockers.map(({ task }) => runInQueue(task));
    const controller = new AbortController();
    const queued = runInQueue(() => Promise.resolve(started.push('queued')), { signal: controller.signal });
    const other = runInQueue(() => Promise.resolve(started.push('other')));

    await settle();
    controller.abort();
    await expect(queued).rejects.toMatchObject({ name: 'AbortError' });

    for (const { release } of blockers) release();
    await Promise.all([...blockerPromises, other]);
    expect(started).not.toContain('queued');
    expect(started).toContain('other');
  });

  it('serves waiting tasks by priority, then rank, then arrival', async () => {
    const started = [];
    const blockers = Array.from({ length: 4 }, (_, i) => blockingTask(`b${i}`, started));
    const blockerPromises = blockers.map(({ task }) => runInQueue(task));
    await settle();

    const order = [];
    const enqueue = (name, options) => runInQueue(() => Promise.resolve(order.push(name)), options);
    const waiting = [
      enqueue('a', { priority: PRIORITY.PREFETCH }),
      enqueue('b', { priority: PRIORITY.IMAGE }),
      enqueue('g', { priority: PRIORITY.EPG_OVERSCAN }),
      enqueue('c', { priority: PRIORITY.EPG_VISIBLE, rank: 0.5 }),
      enqueue('d', { priority: PRIORITY.EPG_VISIBLE, rank: 0.1 }),
      enqueue('e', { priority: PRIORITY.EPG_VISIBLE, rank: 0.1 }),
      enqueue('f'),
    ];

    // Free a single slot so waiting tasks run one after another.
    blockers[0].release();
    await Promise.all(waiting);
    for (const { release } of blockers) release();
    await Promise.all(blockerPromises);

    expect(order).toStrictEqual(['f', 'd', 'e', 'c', 'b', 'g', 'a']);
  });
});

describe('hasQueuedAhead', () => {
  it('reports a more urgent waiting task', async () => {
    const started = [];
    const blockers = Array.from({ length: 4 }, (_, i) => blockingTask(`b${i}`, started));
    const blockerPromises = blockers.map(({ task }) => runInQueue(task));
    const image = runInQueue(() => Promise.resolve('img'), { priority: PRIORITY.IMAGE });
    await settle();

    expect(hasQueuedAhead(PRIORITY.PREFETCH)).toBe(true);
    expect(hasQueuedAhead(PRIORITY.IMAGE)).toBe(false);

    for (const { release } of blockers) release();
    await Promise.all([...blockerPromises, image]);
    expect(hasQueuedAhead(PRIORITY.PREFETCH)).toBe(false);
  });
});

describe('saturation', () => {
  it('remembers the last saturation time', () => {
    markSaturated(1234);
    expect(getLastSaturationAt()).toBe(1234);
  });
});

describe('saturation pause', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Queue a task that records its start and answers with `status`.
   * @param {string} name - Label pushed to `started`
   * @param {Array<string>} started - Start order log
   * @param {number} status - HTTP status the Freebox answers
   * @returns {Promise<string>} Task result
   */
  const answering = (name, started, status) =>
    runInQueue(() => {
      started.push(name);
      recordAnswer(status);
      return Promise.resolve(name);
    });

  it('holds every start after a 503, then probes with a single request', async () => {
    const started = [];
    const blockers = Array.from({ length: 2 }, (_, i) => blockingTask(`b${i}`, started));
    const blockerPromises = blockers.map(({ task }) => runInQueue(task));
    await vi.advanceTimersByTimeAsync(0);

    recordAnswer(503);
    const probe = blockingTask('probe', started);
    const probePromise = runInQueue(probe.task);
    const others = [answering('x', started, 200), answering('y', started, 200)];
    await vi.advanceTimersByTimeAsync(999);
    expect(started).toStrictEqual(['b0', 'b1']);

    // The blockers ending during the pause start nothing.
    for (const { release } of blockers) release();
    await vi.advanceTimersByTimeAsync(0);
    expect(started).toStrictEqual(['b0', 'b1']);

    await vi.advanceTimersByTimeAsync(1);
    expect(started).toStrictEqual(['b0', 'b1', 'probe']);

    // A healthy answer reopens every slot.
    recordAnswer(200);
    probe.release();
    await Promise.all([...blockerPromises, probePromise, ...others]);
    expect(started).toStrictEqual(['b0', 'b1', 'probe', 'x', 'y']);
  });

  it('doubles the pause when the probe is saturated too', async () => {
    const started = [];
    recordAnswer(429);
    const first = answering('first', started, 503);
    const second = answering('second', started, 200);
    await vi.advanceTimersByTimeAsync(1000);
    expect(started).toStrictEqual(['first']);

    await vi.advanceTimersByTimeAsync(1999);
    expect(started).toStrictEqual(['first']);
    await vi.advanceTimersByTimeAsync(1);
    await Promise.all([first, second]);
    expect(started).toStrictEqual(['first', 'second']);
  });

  it('counts the answers of one burst as a single saturation', async () => {
    const started = [];
    recordAnswer(503);
    recordAnswer(503);
    recordAnswer(503);
    const task = answering('task', started, 200);
    await vi.advanceTimersByTimeAsync(1000);
    await task;
    expect(started).toStrictEqual(['task']);
  });

  it('caps the pause at 30 s', async () => {
    const started = [];
    for (let i = 0; i < 10; i += 1) {
      recordAnswer(503);
      // eslint-disable-next-line no-await-in-loop -- each saturation must land after the previous pause
      await vi.advanceTimersByTimeAsync(60_000);
    }
    recordAnswer(503);
    const task = answering('task', started, 200);
    await vi.advanceTimersByTimeAsync(29_999);
    expect(started).toStrictEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    await task;
    expect(started).toStrictEqual(['task']);
  });
});
