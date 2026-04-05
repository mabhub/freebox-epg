import { transformEpgByTime, transformEpgByChannel, mergeChannels, mergeEpgMaps } from './transformers';

describe('transformEpgByTime', () => {
  it('converts nested dict to Map of sorted arrays', () => {
    const data = {
      'uuid-webtv-201': {
        '1000_abc': { id: 'pluri_1', title: 'B', date: 2000, duration: 3600 },
        '1000_def': { id: 'pluri_2', title: 'A', date: 1000, duration: 3600 },
      },
    };

    const result = transformEpgByTime(data);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(1);

    const programs = result.get('uuid-webtv-201');
    expect(programs).toHaveLength(2);
    expect(programs[0].title).toBe('A');
    expect(programs[1].title).toBe('B');
  });

  it('handles empty data', () => {
    const result = transformEpgByTime({});
    expect(result.size).toBe(0);
  });
});

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

describe('mergeEpgMaps', () => {
  it('merges multiple maps and sorts by date', () => {
    const map1 = new Map([
      ['uuid-1', [{ id: 'a', date: 1000 }]],
    ]);
    const map2 = new Map([
      ['uuid-1', [{ id: 'b', date: 2000 }]],
      ['uuid-2', [{ id: 'c', date: 500 }]],
    ]);

    const result = mergeEpgMaps([map1, map2]);
    expect(result.get('uuid-1')).toHaveLength(2);
    expect(result.get('uuid-1')[0].id).toBe('a');
    expect(result.get('uuid-2')).toHaveLength(1);
  });
});
