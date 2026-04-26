/**
 * Image URL builders for channels.
 * @module utils/images
 */

import { API_BASE_URL } from './constants';

/**
 * Build the URL for a channel logo.
 * @param {string} uuid - Channel UUID (e.g., "uuid-webtv-201")
 * @returns {string} Full URL to the 68x60 PNG logo
 */
const getLogoUrl = (uuid) =>
  `${API_BASE_URL}/tv/img/channels/logos68x60/${uuid}.png`;

export default getLogoUrl;
