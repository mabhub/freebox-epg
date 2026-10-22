/**
 * Channel groups the filter drawer can hide or show in one click
 * @module utils/channelGroups
 */

/**
 * @typedef {Object} ChannelGroup
 * @property {string} id - Stable identifier
 * @property {string} label - Chip label
 * @property {(channel: Object) => boolean} match - Whether a channel belongs to the group
 */

/**
 * Groups shown as chips in the filter drawer.
 * `hasAbo` marks channels sold by a third party (the CANAL+ packs): the
 * Freebox cannot check that subscription, so it reports them as available
 * either way. Number ranges follow the Free numbering plan.
 * @type {ChannelGroup[]}
 */
export const CHANNEL_GROUPS = [
  { id: 'subscription', label: 'Abonnement', match: (channel) => channel.hasAbo },
  { id: 'regional', label: 'France 3 régionales', match: (channel) => channel.number >= 900 && channel.number <= 927 },
  { id: 'local', label: 'Locales', match: (channel) => channel.number >= 928 && channel.number <= 999 },
  { id: 'international', label: 'International', match: (channel) => channel.number >= 1000 },
];

/**
 * UUIDs of the channels in a group
 * @param {Array} channels - Channel list
 * @param {ChannelGroup} group - Group
 * @returns {string[]} Channel UUIDs
 */
const groupUuids = (channels, group) =>
  channels.filter((channel) => group.match(channel)).map((channel) => channel.uuid);

/**
 * Whether every channel of a group is hidden
 * @param {Array} channels - Channel list
 * @param {string[]} hiddenChannels - Hidden channel UUIDs
 * @param {ChannelGroup} group - Group
 * @returns {boolean} True when the group has channels and all are hidden
 */
export const isGroupHidden = (channels, hiddenChannels, group) => {
  const uuids = groupUuids(channels, group);
  return uuids.length > 0 && uuids.every((uuid) => hiddenChannels.includes(uuid));
};

/**
 * Hide the whole group if one of its channels is visible, show it all again otherwise.
 * Channels outside the group keep their state.
 * @param {Array} channels - Channel list
 * @param {string[]} hiddenChannels - Hidden channel UUIDs
 * @param {ChannelGroup} group - Group
 * @returns {string[]} New hidden channel UUIDs
 */
export const toggleGroup = (channels, hiddenChannels, group) => {
  const uuids = groupUuids(channels, group);
  if (isGroupHidden(channels, hiddenChannels, group)) {
    return hiddenChannels.filter((uuid) => !uuids.includes(uuid));
  }
  return [...hiddenChannels, ...uuids.filter((uuid) => !hiddenChannels.includes(uuid))];
};
