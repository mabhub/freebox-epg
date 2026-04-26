import {
  transformEpgByChannel,
  mergeChannels,
  mergeByChannelEntries,
  transformRecording,
} from './transformers';

describe('transformEpgByChannel', () => {
  it('converts dict to sorted array', () => {
    const data = {
      '2000_abc': { id: 'pluri_2', title: 'B', date: 2000 },
      '1000_def': { id: 'pluri_1', title: 'A', date: 1000 },
    };

    const result = transformEpgByChannel(data);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('A');
  });

  it('returns an empty array for an empty dict', () => {
    expect(transformEpgByChannel({})).toEqual([]);
  });
});

describe('mergeChannels', () => {
  it('merges and filters channels correctly', () => {
    const channelsMap = {
      'uuid-webtv-201': { name: 'TF1', short_name: 'TF1', logo_url: '/logo.png', available: true, has_service: true, has_abo: false },
      'uuid-webtv-202': { name: 'France 2', short_name: 'Fr2', logo_url: '/logo2.png', available: true, has_service: true, has_abo: false },
    };

    const bouquetChannels = [
      { uuid: 'uuid-webtv-201', number: 1, sub_number: 0, available: true },
      { uuid: 'uuid-webtv-201', number: 1, sub_number: 1, available: true },
      { uuid: 'uuid-webtv-202', number: 2, sub_number: 0, available: true },
      { uuid: 'uuid-webtv-999', number: 999, sub_number: 0, available: true },
      { uuid: 'uuid-webtv-203', number: 3, sub_number: 0, available: false },
    ];

    const result = mergeChannels(channelsMap, bouquetChannels);

    expect(result).toHaveLength(2);
    expect(result[0].number).toBe(1);
    expect(result[0].name).toBe('TF1');
    expect(result[1].number).toBe(2);
  });
});

describe('mergeByChannelEntries', () => {
  it('groups programs by channel uuid and sorts by date', () => {
    const entries = [
      { uuid: 'uuid-1', programs: [{ id: 'a', date: 2000 }] },
      { uuid: 'uuid-1', programs: [{ id: 'b', date: 1000 }] },
      { uuid: 'uuid-2', programs: [{ id: 'c', date: 500 }] },
    ];

    const result = mergeByChannelEntries(entries);

    expect(result.get('uuid-1')).toHaveLength(2);
    expect(result.get('uuid-1')[0].id).toBe('b');
    expect(result.get('uuid-1')[1].id).toBe('a');
    expect(result.get('uuid-2')).toHaveLength(1);
  });

  it('deduplicates programs with the same id across buckets', () => {
    const entries = [
      { uuid: 'uuid-1', programs: [{ id: 'dup', date: 1000, title: 'First' }] },
      { uuid: 'uuid-1', programs: [{ id: 'dup', date: 1000, title: 'Second' }, { id: 'unique', date: 2000 }] },
    ];

    const result = mergeByChannelEntries(entries);
    expect(result.get('uuid-1')).toHaveLength(2);
    expect(result.get('uuid-1')[0].id).toBe('dup');
    expect(result.get('uuid-1')[1].id).toBe('unique');
  });

  it('returns an empty Map when given no entries', () => {
    const result = mergeByChannelEntries([]);
    expect(result.size).toBe(0);
  });
});

describe('transformRecording', () => {
  const baseProgrammed = {
    id: 42,
    start: 1000,
    end: 2000,
    name: 'Title',
    subname: 'Sub',
    channel_uuid: 'uuid-201',
    channel_name: 'TF1',
    state: 'waiting_start_time',
    has_record_gen: false,
  };

  it('transforms a waiting programmed timer', () => {
    const result = transformRecording(baseProgrammed, 'programmed');
    expect(result).toMatchObject({
      id: 42,
      kind: 'programmed',
      channelUuid: 'uuid-201',
      channelName: 'TF1',
      name: 'Title',
      subname: 'Sub',
      start: 1000,
      end: 2000,
      state: 'waiting',
      generatorId: null,
    });
    expect(result.raw).toBe(baseProgrammed);
  });

  it('groups starting/running into "running"', () => {
    expect(transformRecording({ ...baseProgrammed, state: 'starting' }, 'programmed').state).toBe('running');
    expect(transformRecording({ ...baseProgrammed, state: 'running' }, 'programmed').state).toBe('running');
  });

  it('groups failure-like states into "failed"', () => {
    expect(transformRecording({ ...baseProgrammed, state: 'failed' }, 'programmed').state).toBe('failed');
    expect(transformRecording({ ...baseProgrammed, state: 'running_error' }, 'programmed').state).toBe('failed');
    expect(transformRecording({ ...baseProgrammed, state: 'start_error' }, 'programmed').state).toBe('failed');
  });

  it('preserves disabled and finished states', () => {
    expect(transformRecording({ ...baseProgrammed, state: 'disabled' }, 'programmed').state).toBe('disabled');
    expect(transformRecording({ ...baseProgrammed, state: 'finished' }, 'programmed').state).toBe('finished');
  });

  it('falls back to "waiting" for an unknown state', () => {
    expect(transformRecording({ ...baseProgrammed, state: 'mystery' }, 'programmed').state).toBe('waiting');
  });

  it('exposes generatorId when has_record_gen is true', () => {
    const recurring = { ...baseProgrammed, has_record_gen: true, record_gen_id: 7 };
    expect(transformRecording(recurring, 'programmed').generatorId).toBe(7);
  });

  it('forces state to "finished" for finished recordings regardless of payload', () => {
    const finished = {
      id: 99,
      start: 1000,
      end: 2000,
      name: 'Done',
      subname: '',
      channel_uuid: 'uuid-202',
      channel_name: 'France 2',
    };
    expect(transformRecording(finished, 'finished').state).toBe('finished');
  });

  it('coerces missing optional strings to empty strings', () => {
    const sparse = { id: 1, start: 0, end: 0 };
    const result = transformRecording(sparse, 'programmed');
    expect(result.channelUuid).toBe('');
    expect(result.channelName).toBe('');
    expect(result.name).toBe('');
    expect(result.subname).toBe('');
  });
});
