/**
 * API endpoint path builders for the Freebox TV API
 * @module api/endpoints
 */

/**
 * Build path for EPG programs by channel
 * @param {string} channelUuid - Channel UUID (e.g., "uuid-webtv-201")
 * @param {number} timestamp - Unix timestamp rounded to 7200s
 * @returns {string} API path
 */
export const epgByChannelPath = (channelUuid, timestamp) =>
  `/tv/epg/by_channel/${channelUuid}/${timestamp}/`;

/**
 * Build path for EPG program detail
 * @param {string} programId - Program ID (e.g., "pluri_1682160849")
 * @returns {string} API path
 */
export const programDetailPath = (programId) => `/tv/epg/programs/${programId}`;

/**
 * Path for listing all channels
 * @returns {string} API path
 */
export const channelsPath = () => '/tv/channels/';

/**
 * Path for listing Freebox TV bouquet channels
 * @returns {string} API path
 */
export const bouquetFreeboxTvChannelsPath = () => '/tv/bouquets/freeboxtv/channels/';

/**
 * Path for PVR programmed recordings (list / create)
 * @returns {string} API path
 */
export const pvrProgrammedPath = () => '/pvr/programmed/';

/**
 * Build path for a single programmed recording (update / delete)
 * @param {number|string} recordId - Recording id
 * @returns {string} API path
 */
export const pvrProgrammedItemPath = (recordId) => `/pvr/programmed/${recordId}`;

/**
 * Path for PVR finished recordings (list)
 * @returns {string} API path
 */
export const pvrFinishedPath = () => '/pvr/finished/';

/**
 * Build path for a single finished recording (update / delete)
 * @param {number|string} recordId - Recording id
 * @returns {string} API path
 */
export const pvrFinishedItemPath = (recordId) => `/pvr/finished/${recordId}`;

/**
 * Build path for a single recording generator (lazy fetch for tooltip enrichment)
 * @param {number|string} generatorId - Generator id
 * @returns {string} API path
 */
export const pvrGeneratorItemPath = (generatorId) => `/pvr/generator/${generatorId}`;

/**
 * Path for PVR configuration (margins)
 * @returns {string} API path
 */
export const pvrConfigPath = () => '/pvr/config/';

/**
 * Path for PVR storage media list
 * @returns {string} API path
 */
export const pvrMediaPath = () => '/pvr/media/';
