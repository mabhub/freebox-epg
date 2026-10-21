import { renderHook } from '@testing-library/react';

import { transformRecording } from '@/api/transformers';
import { timestampToDatetimeLocal } from '@/utils/time';
import useRecordingForm from './useRecordingForm';

describe('useRecordingForm', () => {
  it('pre-fills an edited timer with its own bounds, without the margins', () => {
    const raw = { id: 1, start: 1_800_000_000, end: 1_800_009_000, margin_before: 300, margin_after: 900 };
    const recording = transformRecording(raw, 'programmed');

    const { result } = renderHook(() => useRecordingForm({ open: true, recording, program: null }));

    expect(result.current.values.start).toBe(timestampToDatetimeLocal(raw.start));
    expect(result.current.values.end).toBe(timestampToDatetimeLocal(raw.end));
  });
});
