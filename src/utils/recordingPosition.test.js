import {
  computeRecordingRect,
  isRecordingInViewport,
  findRecordingCoveringProgram,
} from './recordingPosition';
import { ROW_HEIGHT, OVERLAY_HEIGHT_RATIO, OVERLAY_MIN_WIDTH_PX } from './constants';

describe('computeRecordingRect', () => {
  const baseArgs = {
    recording: { start: 1000, end: 1000 + 30 * 60 }, // 30 minutes
    rowIndex: 2,
    timeOrigin: 1000,
    pixelsPerMinute: 4,
    sidebarWidth: 120,
  };

  it('places left at sidebarWidth when start equals timeOrigin', () => {
    const rect = computeRecordingRect(baseArgs);
    expect(rect.left).toBe(120);
  });

  it('multiplies offset minutes by pixelsPerMinute', () => {
    const rect = computeRecordingRect({
      ...baseArgs,
      recording: { start: 1000 + 15 * 60, end: 1000 + 45 * 60 },
    });
    expect(rect.left).toBe(120 + 15 * 4);
    expect(rect.width).toBe(30 * 4);
  });

  it('clamps width to OVERLAY_MIN_WIDTH_PX for very short recordings', () => {
    const rect = computeRecordingRect({
      ...baseArgs,
      recording: { start: 1000, end: 1000 + 30 }, // 30 seconds
    });
    expect(rect.width).toBe(OVERLAY_MIN_WIDTH_PX);
  });

  it('places the cell at the bottom of its row', () => {
    const rect = computeRecordingRect(baseArgs);
    expect(rect.height).toBeCloseTo(ROW_HEIGHT * OVERLAY_HEIGHT_RATIO, 5);
    expect(rect.top).toBeCloseTo(2 * ROW_HEIGHT + (ROW_HEIGHT - rect.height), 5);
  });

  it('returns negative left for recordings starting before timeOrigin', () => {
    const rect = computeRecordingRect({
      ...baseArgs,
      recording: { start: 1000 - 10 * 60, end: 1000 + 5 * 60 },
    });
    expect(rect.left).toBe(120 - 10 * 4);
  });
});

describe('isRecordingInViewport', () => {
  it('keeps recordings overlapping the viewport', () => {
    expect(isRecordingInViewport({ start: 100, end: 200 }, 150, 300)).toBeTruthy();
    expect(isRecordingInViewport({ start: 50, end: 400 }, 150, 300)).toBeTruthy();
  });

  it('rejects recordings entirely before the viewport', () => {
    expect(isRecordingInViewport({ start: 0, end: 100 }, 150, 300)).toBeFalsy();
    expect(isRecordingInViewport({ start: 0, end: 150 }, 150, 300)).toBeFalsy();
  });

  it('rejects recordings entirely after the viewport', () => {
    expect(isRecordingInViewport({ start: 300, end: 400 }, 150, 300)).toBeFalsy();
    expect(isRecordingInViewport({ start: 350, end: 400 }, 150, 300)).toBeFalsy();
  });
});

describe('findRecordingCoveringProgram', () => {
  const program = { date: 1000, duration: 600 }; // 1000 → 1600

  it('returns the recording when it covers the program exactly', () => {
    const recordings = [{ id: 1, start: 1000, end: 1600 }];
    expect(findRecordingCoveringProgram(recordings, program)).toBe(recordings[0]);
  });

  it('returns the recording when it covers the program with margins', () => {
    const recordings = [{ id: 1, start: 990, end: 1700 }];
    expect(findRecordingCoveringProgram(recordings, program)).toBe(recordings[0]);
  });

  it('returns null when the recording is shorter than the program', () => {
    const recordings = [{ id: 1, start: 1100, end: 1600 }];
    expect(findRecordingCoveringProgram(recordings, program)).toBeNull();
  });

  it('returns null when the recording ends before the program ends', () => {
    const recordings = [{ id: 1, start: 1000, end: 1500 }];
    expect(findRecordingCoveringProgram(recordings, program)).toBeNull();
  });

  it('returns null when there are no recordings for the channel', () => {
    expect(findRecordingCoveringProgram(undefined, program)).toBeNull();
    expect(findRecordingCoveringProgram([], program)).toBeNull();
  });

  it('returns the first matching recording when several cover the program', () => {
    const recordings = [
      { id: 1, start: 990, end: 1700 },
      { id: 2, start: 800, end: 2000 },
    ];
    expect(findRecordingCoveringProgram(recordings, program).id).toBe(1);
  });
});
