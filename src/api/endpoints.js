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
 * Build path for EPG highlights (prime time)
 * @param {string} channelUuid - Channel UUID
 * @param {number} timestamp - Unix timestamp
 * @returns {string} API path
 */
export const epgHighlightsPath = (channelUuid, timestamp) =>
  `/tv/epg/highlights/${channelUuid}/${timestamp}/`;

/**
 * Path for listing all channels
 * @returns {string} API path
 */
export const channelsPath = () => '/tv/channels/';

/**
 * Path for listing all bouquets
 * @returns {string} API path
 */
export const bouquetsPath = () => '/tv/bouquets/';

/**
 * Path for listing Freebox TV bouquet channels
 * @returns {string} API path
 */
export const bouquetFreeboxTvChannelsPath = () => '/tv/bouquets/freeboxtv/channels/';

/**
 * Build path for bouquet channels by ID
 * @param {number} bouquetId - Bouquet ID
 * @returns {string} API path
 */
export const bouquetChannelsPath = (bouquetId) => `/tv/bouquets/${bouquetId}/channels/`;

/**
 * Path for PVR programmed recordings
 * @returns {string} API path
 */
export const pvrProgrammedPath = () => '/pvr/programmed/';

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
