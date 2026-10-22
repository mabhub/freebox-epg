import buildPrefetchPlan from './prefetchPlan';

const B = 7200;
const T0 = 1000 * B;
const gridRange = { startTs: T0, endTs: T0 + 4 * B };
const viewportRange = { startTs: T0 + B + 600, endTs: T0 + 2 * B - 600 };
const eveningRange = { startTs: T0 + 10 * B, endTs: T0 + 12 * B };
const never = () => false;

const plan = (overrides = {}) =>
  buildPrefetchPlan({
    onScreenUuids: ['a'],
    firstUuids: [],
    gridRange,
    viewportRange,
    eveningRange,
    isKnown: never,
    ...overrides,
  });

describe('buildPrefetchPlan', () => {
  it('orders on-screen buckets from the viewport outwards', () => {
    expect(plan()).toStrictEqual([
      { uuid: 'a', ts: T0 + B },
      { uuid: 'a', ts: T0 },
      { uuid: 'a', ts: T0 + 2 * B },
      { uuid: 'a', ts: T0 + 3 * B },
    ]);
  });

  it('serves every on-screen channel at one distance before moving further', () => {
    expect(plan({ onScreenUuids: ['a', 'b'] }).slice(0, 4)).toStrictEqual([
      { uuid: 'a', ts: T0 + B },
      { uuid: 'b', ts: T0 + B },
      { uuid: 'a', ts: T0 },
      { uuid: 'b', ts: T0 },
    ]);
  });

  it('appends the evening of the first channels after the on-screen part', () => {
    expect(plan({ firstUuids: ['x', 'y'] }).slice(4)).toStrictEqual([
      { uuid: 'x', ts: T0 + 10 * B },
      { uuid: 'x', ts: T0 + 11 * B },
      { uuid: 'y', ts: T0 + 10 * B },
      { uuid: 'y', ts: T0 + 11 * B },
    ]);
  });

  it('does not repeat a pair present in both parts', () => {
    expect(plan({ firstUuids: ['a'], eveningRange: { startTs: T0 + 3 * B, endTs: T0 + 5 * B } })).toStrictEqual([
      { uuid: 'a', ts: T0 + B },
      { uuid: 'a', ts: T0 },
      { uuid: 'a', ts: T0 + 2 * B },
      { uuid: 'a', ts: T0 + 3 * B },
      { uuid: 'a', ts: T0 + 4 * B },
    ]);
  });

  it('skips known pairs', () => {
    expect(plan({ isKnown: (uuid, ts) => ts === T0 + B })).toStrictEqual([
      { uuid: 'a', ts: T0 },
      { uuid: 'a', ts: T0 + 2 * B },
      { uuid: 'a', ts: T0 + 3 * B },
    ]);
  });

  it('returns nothing without channels', () => {
    expect(plan({ onScreenUuids: [], firstUuids: [] })).toStrictEqual([]);
  });
});
