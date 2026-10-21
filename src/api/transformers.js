/**
 * Response transformers for normalizing Freebox API data
 * @module api/transformers
 */

/**
 * Transform EPG by_channel response into a sorted program array
 * API returns: { "ts_hash": program, ... }, or no result at all when empty
 * @param {Object|undefined} data - Raw API result
 * @returns {Array} Sorted program array
 */
export const transformEpgByChannel = (data) => Object.values(data ?? {}).toSorted((a, b) => a.date - b.date);

/**
 * Merge channel details with bouquet channel list.
 * The bouquet can list the same channel under several numbers (e.g.
 * Eurosport 1 as 35 and 237); only the lowest number is kept so each
 * UUID — the React key of a grid row — appears once.
 * @param {Object} channelsMap - Channels map from /tv/channels/ (keyed by UUID)
 * @param {Array} bouquetChannels - Bouquet channel list from /tv/bouquets/freeboxtv/channels/
 * @returns {Array} Merged channel list, sorted by number, unique by UUID
 */
export const mergeChannels = (channelsMap, bouquetChannels) => {
  const seen = new Set();
  return bouquetChannels
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
    .toSorted((a, b) => a.number - b.number)
    .filter((channel) => {
      if (seen.has(channel.uuid)) {
        return false;
      }
      seen.add(channel.uuid);
      return true;
    });
};

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

/**
 * Map a raw Freebox `state` value (programmed timer) to one of the five
 * categories the overlay UI handles. The Freebox emits more granular
 * states (`waiting_start_time`, `starting`, `running_error`, `start_error`,
 * etc.) but visually we group them so users see one of: waiting, running,
 * failed, disabled, finished.
 * @param {string} state - Raw `state` from /pvr/programmed/
 * @returns {string} Normalised state
 */
const PROGRAMMED_STATE_MAP = {
  starting: 'running',
  running: 'running',
  failed: 'failed',
  start_error: 'failed',
  running_error: 'failed',
  finished: 'finished',
  disabled: 'disabled',
  waiting_start_time: 'waiting',
};

const normaliseProgrammedState = (state) => PROGRAMMED_STATE_MAP[state] ?? 'waiting';

/**
 * Normalise a raw recording (programmed timer or finished recording) into
 * the unified shape consumed by the EPG overlay.
 *
 * `start`/`end` span the window actually recorded: a programmed timer keeps
 * its margins aside (`margin_before`/`margin_after`), whereas a finished
 * recording already includes them. The timer's own bounds stay in `raw`;
 * `marginBefore`/`marginAfter` (seconds) locate them inside the window and
 * are 0 for a finished recording, the Freebox no longer reporting them.
 * @param {Object} raw - Raw API payload
 * @param {'programmed'|'finished'} kind - Which endpoint it came from
 * @returns {Object} Recording in the unified shape
 */
export const transformRecording = (raw, kind) => ({
  id: raw.id,
  kind,
  channelUuid: raw.channel_uuid ?? '',
  channelName: raw.channel_name ?? '',
  name: raw.name ?? '',
  subname: raw.subname ?? '',
  start: raw.start - (raw.margin_before ?? 0),
  end: raw.end + (raw.margin_after ?? 0),
  marginBefore: raw.margin_before ?? 0,
  marginAfter: raw.margin_after ?? 0,
  state: kind === 'finished' ? 'finished' : normaliseProgrammedState(raw.state),
  generatorId: raw.has_record_gen ? (raw.record_gen_id ?? null) : null,
  raw,
});
