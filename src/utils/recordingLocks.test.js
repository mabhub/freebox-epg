import computeFieldLocks from './recordingLocks';

describe('computeFieldLocks', () => {
  it('frees all fields in create mode', () => {
    expect(computeFieldLocks(null)).toMatchObject({
      name: true,
      subname: true,
      start: true,
      end: true,
      marginBefore: true,
      marginAfter: true,
      quality: true,
      media: true,
      path: true,
    });
  });

  it('ties each margin to the bound it extends', () => {
    const cases = [
      { kind: 'finished', state: 'finished', generatorId: null },
      { kind: 'programmed', state: 'running', generatorId: null },
      { kind: 'programmed', state: 'waiting', generatorId: 7 },
      { kind: 'programmed', state: 'waiting', generatorId: null },
    ];
    const pairs = cases.map((recording) => {
      const { start, end, marginBefore, marginAfter } = computeFieldLocks(recording);
      return { marginBefore, marginAfter, start, end };
    });
    expect(pairs.map(({ marginBefore, marginAfter }) => ({ start: marginBefore, end: marginAfter }))).toStrictEqual(
      pairs.map(({ start, end }) => ({ start, end })),
    );
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
