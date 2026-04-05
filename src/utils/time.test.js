import {
  roundToHour,
  roundTo2Hours,
  formatDuration,
  getHourBuckets,
  nowTimestamp,
} from './time';

describe('roundToHour', () => {
  it('rounds down to the nearest hour', () => {
    expect(roundToHour(3661)).toBe(3600);
  });

  it('returns same value if already on the hour', () => {
    expect(roundToHour(7200)).toBe(7200);
  });

  it('handles zero', () => {
    expect(roundToHour(0)).toBe(0);
  });

  it('rounds down for large timestamps', () => {
    const ts = 1712345678;
    const expected = Math.floor(ts / 3600) * 3600;
    expect(roundToHour(ts)).toBe(expected);
  });
});

describe('roundTo2Hours', () => {
  it('rounds down to the nearest 2-hour boundary', () => {
    expect(roundTo2Hours(7201)).toBe(7200);
  });

  it('rounds 3600 down to 0', () => {
    expect(roundTo2Hours(3600)).toBe(0);
  });

  it('returns same value if already on 2-hour boundary', () => {
    expect(roundTo2Hours(14400)).toBe(14400);
  });
});

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(2700)).toBe('45min');
  });

  it('formats hours only', () => {
    expect(formatDuration(7200)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(5400)).toBe('1h30');
  });

  it('pads minutes with leading zero', () => {
    expect(formatDuration(3900)).toBe('1h05');
  });
});

describe('getHourBuckets', () => {
  it('returns correct buckets for a 3-hour range', () => {
    const buckets = getHourBuckets(3600, 14400);
    expect(buckets).toStrictEqual([3600, 7200, 10800, 14400]);
  });

  it('rounds start and end timestamps down', () => {
    const buckets = getHourBuckets(3601, 7201);
    expect(buckets).toStrictEqual([3600, 7200]);
  });

  it('returns single bucket when start equals end', () => {
    const buckets = getHourBuckets(3600, 3600);
    expect(buckets).toStrictEqual([3600]);
  });
});

describe('nowTimestamp', () => {
  it('returns a number close to current time', () => {
    const ts = nowTimestamp();
    const expected = Math.floor(Date.now() / 1000);
    expect(ts).toBeGreaterThanOrEqual(expected - 1);
    expect(ts).toBeLessThanOrEqual(expected + 1);
  });
});
