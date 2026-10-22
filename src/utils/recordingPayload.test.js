import { buildCreatePayload, buildUpdatePayload } from './recordingPayload';
import computeFieldLocks from './recordingLocks';

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
      marginBefore: 300,
      marginAfter: 900,
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
      margin_before: 300,
      margin_after: 900,
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
    margin_before: 60,
    margin_after: 120,
  };
  const margins = { marginBefore: 300, marginAfter: 900 };

  it('overlays unlocked fields on the original raw payload and preserves unknown keys', () => {
    const recording = { id: 42, kind: 'programmed', state: 'waiting', generatorId: null, raw: recordingRaw };
    const locks = computeFieldLocks(recording);
    const result = buildUpdatePayload({ recording, values: baseValues, locks, startTs: 1000, endTs: 2000, ...margins });

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
      margin_before: 300,
      margin_after: 900,
    });
  });

  it('skips locked fields for an occurrence (only name+subname change)', () => {
    const recording = { id: 42, kind: 'programmed', state: 'waiting', generatorId: 7, raw: recordingRaw };
    const locks = computeFieldLocks(recording);
    const result = buildUpdatePayload({ recording, values: baseValues, locks, startTs: 1000, endTs: 2000, ...margins });

    expect(result).toMatchObject({
      start: 100,
      end: 200,
      channel_quality: 'sd',
      media: 'OldMedia',
      path: 'OldPath',
      name: 'Title',
      subname: 'Sub',
      margin_before: 60,
      margin_after: 120,
    });
  });

  it('only end and subname change for a running recording', () => {
    const recording = { id: 42, kind: 'programmed', state: 'running', generatorId: null, raw: recordingRaw };
    const locks = computeFieldLocks(recording);
    const result = buildUpdatePayload({ recording, values: baseValues, locks, startTs: 1000, endTs: 2000, ...margins });

    expect(result).toMatchObject({
      start: 100,
      end: 2000,
      margin_before: 60,
      margin_after: 900,
      subname: 'Sub',
      name: 'Old',
      path: 'OldPath',
    });
  });

  it('finished recording allows name/subname/path only', () => {
    const recording = { id: 42, kind: 'finished', state: 'finished', generatorId: null, raw: recordingRaw };
    const locks = computeFieldLocks(recording);
    const result = buildUpdatePayload({ recording, values: baseValues, locks, startTs: 1000, endTs: 2000, ...margins });

    expect(result).toMatchObject({
      start: 100,
      end: 200,
      margin_before: 60,
      margin_after: 120,
      channel_quality: 'sd',
      path: 'Films',
      name: 'Title',
    });
  });
});
