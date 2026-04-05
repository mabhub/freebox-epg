/**
 * Response transformers for normalizing Freebox API data
 * @module api/transformers
 */

/**
 * Transform EPG by_time response into a Map of channel UUID → sorted programs
 * API returns: { uuid: { "ts_hash": program, ... }, ... }
 * @param {Object} data - Raw API result
 * @returns {Map<string, Array>} Map of channel UUID to sorted program arrays
 */
export const transformEpgByTime = (data) => {
  const result = new Map();

  for (const [uuid, programs] of Object.entries(data)) {
    const programList = Object.values(programs).toSorted(
      (a, b) => a.date - b.date,
    );
    result.set(uuid, programList);
  }

  return result;
};

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
      };
    })
    .filter(Boolean)
    .toSorted((a, b) => a.number - b.number);

/**
 * Merge multiple EPG by_time Maps into a single Map
 * Programs from later buckets are appended (no deduplication needed since buckets are disjoint)
 * @param {Array<Map<string, Array>>} maps - Array of Maps from transformEpgByTime
 * @returns {Map<string, Array>} Merged Map of channel UUID to sorted programs
 */
export const mergeEpgMaps = (maps) => {
  const result = new Map();

  for (const map of maps) {
    for (const [uuid, programs] of map) {
      const existing = result.get(uuid);
      if (existing) {
        existing.push(...programs);
      } else {
        result.set(uuid, [...programs]);
      }
    }
  }

  // Sort merged arrays by date
  for (const [uuid, programs] of result) {
    result.set(uuid, programs.toSorted((a, b) => a.date - b.date));
  }

  return result;
};
