import { transformEpgByChannel, mergeChannels, mergeByChannelEntries } from './transformers';

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
