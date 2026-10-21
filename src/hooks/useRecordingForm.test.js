import { renderHook } from '@testing-library/react';

import { transformRecording } from '@/api/transformers';
import { timestampToDatetimeLocal } from '@/utils/time';
import useRecordingForm from './useRecordingForm';

describe('useRecordingForm', () => {
  it('pre-fills an edited timer with its own bounds and margins in minutes', () => {
    const raw = { id: 1, start: 1_800_000_000, end: 1_800_009_000, margin_before: 300, margin_after: 900 };
    const recording = transformRecording(raw, 'programmed');

    const { result } = renderHook(() => useRecordingForm({ open: true, recording, program: null }));

    expect(result.current.values).toMatchObject({
      start: timestampToDatetimeLocal(raw.start),
      end: timestampToDatetimeLocal(raw.end),
      marginBefore: '5',
      marginAfter: '15',
    });
    expect(result.current).toMatchObject({ startTs: raw.start, endTs: raw.end, marginBefore: 300, marginAfter: 900 });
  });

  it('pre-fills a new recording with the program slot and the default margins apart', () => {
    const program = { title: 'Tracker', sub_title: 'Sans foi ni loi', date: 1_800_000_000, duration: 2700 };
    const pvrConfig = { margin_before: 120, margin_after: 600 };

    const { result } = renderHook(() => useRecordingForm({ open: true, recording: null, program, pvrConfig }));

    expect(result.current.values).toMatchObject({
      start: timestampToDatetimeLocal(program.date),
      end: timestampToDatetimeLocal(program.date + program.duration),
      marginBefore: '2',
      marginAfter: '10',
    });
    expect(result.current).toMatchObject({ marginBefore: 120, marginAfter: 600 });
  });

  it('reads a blank or invalid margin as no margin', () => {
    const program = { title: 'X', date: 1_800_000_000, duration: 600 };

    const { result } = renderHook(() => useRecordingForm({ open: true, recording: null, program, pvrConfig: null }));

    expect(result.current.values).toMatchObject({ marginBefore: '0', marginAfter: '0' });
    expect(result.current).toMatchObject({ marginBefore: 0, marginAfter: 0 });
  });
});
