import { PRIORITY, runInQueue, hasQueuedAhead, markSaturated, getLastSaturationAt } from './requestQueue';

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
