import { CHANNEL_GROUPS, isGroupHidden, toggleGroup } from './channelGroups';

const group = (id) => CHANNEL_GROUPS.find((g) => g.id === id);

const channels = [
  { uuid: 'tf1', number: 1, hasAbo: false },
  { uuid: 'canal', number: 40, hasAbo: true },
  { uuid: 'disney', number: 337, hasAbo: true },
  { uuid: 'f3-alpes', number: 902, hasAbo: false },
  { uuid: 'f3-national', number: 927, hasAbo: false },
  { uuid: 'mytv', number: 928, hasAbo: false },
  { uuid: 'brionnais', number: 999, hasAbo: false },
  { uuid: 'al24', number: 1000, hasAbo: false },
];

const uuidsOf = (id) => channels.filter((channel) => group(id).match(channel)).map((ch) => ch.uuid);

describe('CHANNEL_GROUPS', () => {
  it('matches third-party subscription channels by hasAbo', () => {
    expect(uuidsOf('subscription')).toStrictEqual(['canal', 'disney']);
  });

  it('splits the 900s between France 3 regions and local channels', () => {
    expect(uuidsOf('regional')).toStrictEqual(['f3-alpes', 'f3-national']);
    expect(uuidsOf('local')).toStrictEqual(['mytv', 'brionnais']);
  });

  it('matches international channels from number 1000', () => {
    expect(uuidsOf('international')).toStrictEqual(['al24']);
  });
});

describe('isGroupHidden', () => {
  it('is true only when every channel of the group is hidden', () => {
    expect(isGroupHidden(channels, ['canal', 'disney', 'tf1'], group('subscription'))).toBe(true);
    expect(isGroupHidden(channels, ['canal'], group('subscription'))).toBe(false);
  });

  it('is false for a group with no channel', () => {
    expect(isGroupHidden([channels[0]], [], group('international'))).toBe(false);
  });
});

describe('toggleGroup', () => {
  it('hides the whole group when one of its channels is visible, keeping other hidden channels', () => {
    expect(toggleGroup(channels, ['tf1', 'canal'], group('subscription'))).toStrictEqual(['tf1', 'canal', 'disney']);
  });

  it('shows the whole group again when all its channels are hidden', () => {
    expect(toggleGroup(channels, ['tf1', 'canal', 'disney'], group('subscription'))).toStrictEqual(['tf1']);
  });

  it('leaves the hidden list unchanged for a group with no channel', () => {
    const hidden = ['tf1'];
    expect(toggleGroup([channels[0]], hidden, group('international'))).toStrictEqual(['tf1']);
  });
});
