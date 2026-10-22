import { act, renderHook } from '@testing-library/react';
import useRecordingsByChannel from '@/hooks/useRecordingsByChannel';
import useRecordGroup from './useRecordGroup';

vi.mock('@/hooks/useRecordingsByChannel', () => ({ default: vi.fn() }));

const CHANNEL = { uuid: 'uuid-1', name: 'Disney Channel' };
const RUN = { id: 'a', date: 1000, duration: 1800, sub_title: 'La belle (+2 épisodes)' };

describe('useRecordGroup', () => {
  it('opens the creation form for a run nothing records yet', () => {
    useRecordingsByChannel.mockReturnValue(new Map());
    const onEditRecording = vi.fn();
    const { result } = renderHook(() => useRecordGroup(onEditRecording));
    act(() => result.current.recordGroup(RUN, CHANNEL));
    expect(result.current.target).toStrictEqual({ program: RUN, channelUuid: 'uuid-1', channelName: 'Disney Channel' });
    expect(onEditRecording).not.toHaveBeenCalled();
  });

  it('opens the recording that already covers the run instead', () => {
    const covering = { id: 'rec-1', start: 900, end: 3000 };
    useRecordingsByChannel.mockReturnValue(new Map([['uuid-1', [covering]]]));
    const onEditRecording = vi.fn();
    const { result } = renderHook(() => useRecordGroup(onEditRecording));
    act(() => result.current.recordGroup(RUN, CHANNEL));
    expect(onEditRecording).toHaveBeenCalledWith(covering);
    expect(result.current.target).toBeNull();
  });

  it('still offers to create when a recording covers only part of the run', () => {
    useRecordingsByChannel.mockReturnValue(new Map([['uuid-1', [{ id: 'rec-1', start: 900, end: 1700 }]]]));
    const { result } = renderHook(() => useRecordGroup(vi.fn()));
    act(() => result.current.recordGroup(RUN, CHANNEL));
    expect(result.current.target?.program).toBe(RUN);
  });

  it('closes the creation form', () => {
    useRecordingsByChannel.mockReturnValue(new Map());
    const { result } = renderHook(() => useRecordGroup(vi.fn()));
    act(() => result.current.recordGroup(RUN, CHANNEL));
    act(() => result.current.closeTarget());
    expect(result.current.target).toBeNull();
  });
});
