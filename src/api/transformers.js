/**
 * Response transformers for normalizing Freebox API data
 * @module api/transformers
 */

/**
 * Transform EPG by_channel response into a sorted program array
 * API returns: { "ts_hash": program, ... }
 * @param {Object} data - Raw API result
 * @returns {Array} Sorted program array
 */
export const transformEpgByChannel = (data) =>
  Object.values(data).toSorted((a, b) => a.date - b.date);

/**
 * Merge channel details with bouquet channel list
 * @param {Object} channelsMap - Channels map from /tv/channels/ (keyed by UUID)
 * @param {Array} bouquetChannels - Bouquet channel list from /tv/bouquets/freeboxtv/channels/
 * @returns {Array} Merged and sorted channel list
 */
export const mergeChannels = (channelsMap, bouquetChannels) =>
  bouquetChannels
    .filter((bc) => bc.sub_number === 0 && bc.available)
    .map((bc) => {
      const channel = channelsMap[bc.uuid];
      if (!channel) {
        return null;
      }
      return {
        uuid: bc.uuid,
        number: bc.number,
        name: channel.name,
        shortName: channel.short_name,
        logoUrl: channel.logo_url,
        available: channel.available,
        hasService: channel.has_service,
        hasAbo: channel.has_abo,
        pubService: bc.pub_service,
      };
    })
    .filter(Boolean)
    .toSorted((a, b) => a.number - b.number);

/**
 * Merge per-channel/per-bucket query results into a single
 * Map<channelUuid, sortedPrograms> for the grid.
 * Adjacent 2-hour buckets can repeat the same program at the boundary,
 * so we deduplicate by program id (last entry wins).
 * @param {Array<{ uuid: string, programs: Array }>} entries - One entry per loaded query
 * @returns {Map<string, Array>} Map of channel UUID to sorted program arrays
 */
export const mergeByChannelEntries = (entries) => {
  const byUuid = new Map();

  for (const { uuid, programs } of entries) {
    let programMap = byUuid.get(uuid);
    if (!programMap) {
      programMap = new Map();
      byUuid.set(uuid, programMap);
    }
    for (const program of programs) {
      programMap.set(program.id, program);
    }
  }

  for (const [uuid, programMap] of byUuid) {
    byUuid.set(
      uuid,
      [...programMap.values()].toSorted((a, b) => a.date - b.date),
    );
  }

  return byUuid;
};
