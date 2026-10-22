import { PRIORITY } from '@/api/requestQueue';
import { jumpTargetRange, pairPriority, viewportTimeRange } from './viewport';

describe('pairPriority', () => {
  const range = { onScreenStart: 10, onScreenEnd: 20, startTs: 72_000, endTs: 90_000 };

  it('ranks an on-screen pair as visible', () => {
    expect(pairPriority({ rowIndex: 15, ts: 79_200 }, range).priority).toBe(PRIORITY.EPG_VISIBLE);
  });

  it('ranks a row in the overscan as overscan', () => {
    expect(pairPriority({ rowIndex: 5, ts: 79_200 }, range).priority).toBe(PRIORITY.EPG_OVERSCAN);
  });

  it('ranks a bucket outside the viewport time as overscan', () => {
    expect(pairPriority({ rowIndex: 15, ts: 64_800 }, range).priority).toBe(PRIORITY.EPG_OVERSCAN);
  });

  it('ranks the centre before the edges', () => {
    const centre = pairPriority({ rowIndex: 15, ts: 79_200 }, range).rank;
    const edge = pairPriority({ rowIndex: 10, ts: 72_000 }, range).rank;
    expect(centre).toBeLessThan(edge);
  });
});

describe('viewportTimeRange', () => {
  it('computes the on-screen time range without overscan', () => {
    // 4 px/min: 240 px = 1 h, 1200 px = 5 h
    expect(
      viewportTimeRange({ timeOrigin: 1000, scrollLeft: 240, viewportWidth: 1200, pixelsPerMinute: 4 }),
    ).toStrictEqual({ startTs: 1000 + 3600, endTs: 1000 + 3600 + 18_000 });
  });
});

describe('jumpTargetRange', () => {
  it('spans the screen shown after a jump, the target a third of the way in', () => {
    expect(jumpTargetRange(100_000, 9 * 3600)).toStrictEqual({
      startTs: 100_000 - 3 * 3600,
      endTs: 100_000 + 6 * 3600,
    });
  });
});
