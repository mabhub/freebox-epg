import { collectSnapTargets, computeResizedBounds, getResizableEdges, pointerToTime } from './recordingResize';

// Multiple of 300 so 5-minute steps fall on round clock times.
const T = 1_800_000_000;

/**
 * Unified recording whose program slot is [T+3900, T+7200] (55 min) with
 * 5 min before and 15 min after, so the real window is [T+3600, T+8100].
 * @param {Object} [overrides] - Fields to replace
 * @returns {Object} Unified recording
 */
const makeRecording = (overrides = {}) => ({
  kind: 'programmed',
  state: 'waiting',
  generatorId: null,
  start: T + 3600,
  end: T + 8100,
  marginBefore: 300,
  marginAfter: 900,
  raw: { start: T + 3900, end: T + 7200, margin_before: 300, margin_after: 900 },
  ...overrides,
});

describe('getResizableEdges', () => {
  it('lets both edges move on a waiting recording', () => {
    expect(getResizableEdges(makeRecording())).toStrictEqual({ start: true, end: true });
  });

  it('lets only the end move on a running recording', () => {
    expect(getResizableEdges(makeRecording({ state: 'running' }))).toStrictEqual({ start: false, end: true });
  });

  it('locks both edges on a finished recording', () => {
    expect(getResizableEdges(makeRecording({ kind: 'finished', state: 'finished' }))).toStrictEqual({
      start: false,
      end: false,
    });
  });

  it('locks both edges on an occurrence of a recurring recording', () => {
    expect(getResizableEdges(makeRecording({ generatorId: 12 }))).toStrictEqual({ start: false, end: false });
  });
});

describe('collectSnapTargets', () => {
  it('returns each program bound once, sorted', () => {
    const programs = [
      { date: T + 3900, duration: 3300 },
      { date: T, duration: 3900 },
    ];
    expect(collectSnapTargets(programs)).toStrictEqual([T, T + 3900, T + 7200]);
  });

  it('returns an empty list without programs', () => {
    expect(collectSnapTargets()).toStrictEqual([]);
  });
});

describe('pointerToTime', () => {
  it('converts a grid x offset to a timestamp', () => {
    // 120 px sidebar, then 90 px at 3 px/min = 30 min after the origin.
    expect(pointerToTime({ x: 210, timeOrigin: T, pixelsPerMinute: 3, sidebarWidth: 120 })).toBe(T + 1800);
  });
});

describe('computeResizedBounds', () => {
  const base = { now: T, snapTargets: [], snapThreshold: 240 };

  describe('end edge', () => {
    it('moves the program end one margin inside the pointer, rounded to 5 minutes', () => {
      // Real edge at T+9050 → program end T+8150 → rounds to T+8100.
      const result = computeResizedBounds({ ...base, recording: makeRecording(), edge: 'end', pointerTime: T + 9050 });
      expect(result).toStrictEqual({ start: T + 3900, end: T + 8100, snappedTo: null });
    });

    it('snaps the program end to a nearby program bound', () => {
      // Program end would be T+8500; the next program starts at T+8400 (100 s away).
      const result = computeResizedBounds({
        ...base,
        snapTargets: [T + 8400],
        recording: makeRecording(),
        edge: 'end',
        pointerTime: T + 9400,
      });
      expect(result).toStrictEqual({ start: T + 3900, end: T + 8400, snappedTo: T + 8400 });
    });

    it('picks the closest of several program bounds', () => {
      const result = computeResizedBounds({
        ...base,
        snapTargets: [T + 8300, T + 8450],
        recording: makeRecording(),
        edge: 'end',
        pointerTime: T + 9400,
      });
      expect(result.end).toBe(T + 8450);
    });

    it('ignores program bounds beyond the threshold', () => {
      // Program end T+8800 is 400 s from T+8400 → plain rounding to T+8700.
      const result = computeResizedBounds({
        ...base,
        snapTargets: [T + 8400],
        recording: makeRecording(),
        edge: 'end',
        pointerTime: T + 9700,
      });
      expect(result).toStrictEqual({ start: T + 3900, end: T + 8700, snappedTo: null });
    });

    it('keeps the program at least 5 minutes long', () => {
      const result = computeResizedBounds({ ...base, recording: makeRecording(), edge: 'end', pointerTime: T });
      expect(result.end).toBe(T + 4200);
    });

    it('keeps the end of a running recording at least 5 minutes after now', () => {
      const result = computeResizedBounds({
        ...base,
        now: T + 6000,
        recording: makeRecording({ state: 'running' }),
        edge: 'end',
        pointerTime: T + 4000,
      });
      expect(result.end).toBe(T + 6300);
    });

    it('rounds the running limit up to the next 5 minutes', () => {
      // now + 5 min = T+6310 → T+6600.
      const result = computeResizedBounds({
        ...base,
        now: T + 6010,
        recording: makeRecording({ state: 'running' }),
        edge: 'end',
        pointerTime: T + 4000,
      });
      expect(result.end).toBe(T + 6600);
    });
  });

  describe('start edge', () => {
    it('moves the program start one margin inside the pointer, rounded to 5 minutes', () => {
      // Real edge at T+2950 → program start T+3250 → rounds to T+3300.
      const result = computeResizedBounds({
        ...base,
        recording: makeRecording(),
        edge: 'start',
        pointerTime: T + 2950,
      });
      expect(result).toStrictEqual({ start: T + 3300, end: T + 7200, snappedTo: null });
    });

    it('keeps the real start (margin included) at or after now', () => {
      const result = computeResizedBounds({
        ...base,
        now: T + 3000,
        recording: makeRecording(),
        edge: 'start',
        pointerTime: T + 1000,
      });
      expect(result.start).toBe(T + 3300);
    });

    it('rounds the now limit up to the next 5 minutes', () => {
      // now + margin = T+3310 → T+3600.
      const result = computeResizedBounds({
        ...base,
        now: T + 3010,
        recording: makeRecording(),
        edge: 'start',
        pointerTime: T + 1000,
      });
      expect(result.start).toBe(T + 3600);
    });

    it('keeps the program at least 5 minutes long', () => {
      const result = computeResizedBounds({
        ...base,
        recording: makeRecording(),
        edge: 'start',
        pointerTime: T + 9000,
      });
      expect(result.start).toBe(T + 6900);
    });

    it('reports no snap when a limit overrides it', () => {
      const result = computeResizedBounds({
        ...base,
        now: T + 3000,
        snapTargets: [T + 2400],
        recording: makeRecording(),
        edge: 'start',
        pointerTime: T + 2000,
      });
      expect(result).toStrictEqual({ start: T + 3300, end: T + 7200, snappedTo: null });
    });
  });
});
