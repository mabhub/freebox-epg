import { buildCreatePayload, buildUpdatePayload } from './recordingPayload';
import { computeFieldLocks } from '@/hooks/useRecordingForm';

const baseValues = {
  name: 'Title',
  subname: 'Sub',
  start: '2026-04-27T20:00',
  end: '2026-04-27T22:00',
  quality: 'hd',
  media: 'Disque dur',
  path: 'Films',
};

describe('buildCreatePayload', () => {
  it('builds the create body with broadcast_type tv and enabled true', () => {
    const result = buildCreatePayload({
      values: baseValues,
      channelUuid: 'uuid-201',
      channelName: 'TF1',
      startTs: 1000,
      endTs: 2000,
    });
    expect(result).toStrictEqual({
      channel_uuid: 'uuid-201',
      channel_name: 'TF1',
      channel_quality: 'hd',
      broadcast_type: 'tv',
      name: 'Title',
      subname: 'Sub',
      start: 1000,
      end: 2000,
      media: 'Disque dur',
      path: 'Films',
      enabled: true,
    });
  });
});

describe('buildUpdatePayload', () => {
  const recordingRaw = {
    id: 42,
    name: 'Old',
    subname: 'OldSub',
    start: 100,
    end: 200,
    channel_quality: 'sd',
    media: 'OldMedia',
    path: 'OldPath',
    custom_field: 'preserved',
  };

  it('overlays unlocked fields on the original raw payload and preserves unknown keys', () => {
    const recording = { id: 42, kind: 'programmed', state: 'waiting', generatorId: null, raw: recordingRaw };
    const locks = computeFieldLocks(recording);
    const result = buildUpdatePayload({ recording, values: baseValues, locks, startTs: 1000, endTs: 2000 });

    expect(result).toMatchObject({
      id: 42,
      name: 'Title',
      subname: 'Sub',
      start: 1000,
      end: 2000,
      channel_quality: 'hd',
      media: 'Disque dur',
      path: 'Films',
      custom_field: 'preserved',
    });
  });

  it('skips locked fields for an occurrence (only name+subname change)', () => {
    const recording = { id: 42, kind: 'programmed', state: 'waiting', generatorId: 7, raw: recordingRaw };
    const locks = computeFieldLocks(recording);
    const result = buildUpdatePayload({ recording, values: baseValues, locks, startTs: 1000, endTs: 2000 });

    expect(result.start).toBe(100);
    expect(result.end).toBe(200);
    expect(result.channel_quality).toBe('sd');
    expect(result.media).toBe('OldMedia');
    expect(result.path).toBe('OldPath');
    expect(result.name).toBe('Title');
    expect(result.subname).toBe('Sub');
  });

  it('only end and subname change for a running recording', () => {
    const recording = { id: 42, kind: 'programmed', state: 'running', generatorId: null, raw: recordingRaw };
    const locks = computeFieldLocks(recording);
    const result = buildUpdatePayload({ recording, values: baseValues, locks, startTs: 1000, endTs: 2000 });

    expect(result.start).toBe(100);
    expect(result.end).toBe(2000);
    expect(result.subname).toBe('Sub');
    expect(result.name).toBe('Old');
    expect(result.path).toBe('OldPath');
  });

  it('finished recording allows name/subname/path only', () => {
    const recording = { id: 42, kind: 'finished', state: 'finished', generatorId: null, raw: recordingRaw };
    const locks = computeFieldLocks(recording);
    const result = buildUpdatePayload({ recording, values: baseValues, locks, startTs: 1000, endTs: 2000 });

    expect(result.start).toBe(100);
    expect(result.end).toBe(200);
    expect(result.channel_quality).toBe('sd');
    expect(result.path).toBe('Films');
    expect(result.name).toBe('Title');
  });
});

describe('computeFieldLocks', () => {
  it('frees all fields in create mode', () => {
    expect(computeFieldLocks(null)).toMatchObject({
      name: true, subname: true, start: true, end: true, quality: true, media: true, path: true,
    });
  });

  it('locks scheduling fields for finished recordings', () => {
    const locks = computeFieldLocks({ kind: 'finished', state: 'finished', generatorId: null });
    expect(locks).toMatchObject({ name: true, path: true, start: false, end: false, quality: false, media: false });
  });

  it('locks everything but end and subname while running', () => {
    const locks = computeFieldLocks({ kind: 'programmed', state: 'running', generatorId: null });
    expect(locks).toMatchObject({ name: false, subname: true, start: false, end: true, path: false });
  });

  it('locks scheduling fields for occurrence of a generator', () => {
    const locks = computeFieldLocks({ kind: 'programmed', state: 'waiting', generatorId: 7 });
    expect(locks).toMatchObject({ name: true, subname: true, start: false, end: false, path: false });
  });

  it('keeps standalone waiting timer fully editable', () => {
    const locks = computeFieldLocks({ kind: 'programmed', state: 'waiting', generatorId: null });
    expect(locks).toMatchObject({ name: true, start: true, end: true, quality: true, media: true, path: true });
  });
});
