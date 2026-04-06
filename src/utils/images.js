/**
 * Image URL builders for channels and programs
 * @module utils/images
 */

import { API_BASE_URL } from './constants';

/**
 * Build the URL for a channel logo
 * @param {string} uuid - Channel UUID (e.g., "uuid-webtv-201")
 * @returns {string} Full URL to the 68x60 PNG logo
 */
export const getLogoUrl = (uuid) =>
  `${API_BASE_URL}/tv/img/channels/logos68x60/${uuid}.png`;

/**
 * Return the program thumbnail URL (100x77)
 * The API already returns full paths prefixed with /api/latest
 * @param {string|undefined} picturePath - Path from EpgProgram.picture, or falsy if absent
 * @returns {string|null} Usable URL, or null if the program has no thumbnail
 */
export const getThumbnailUrl = (picturePath) => picturePath || null;

/**
 * Return the program large image URL (168x130)
 * The API already returns full paths prefixed with /api/latest
 * @param {string|undefined} pictureBigPath - Path from EpgProgram.picture_big, or falsy if absent
 * @returns {string|null} Usable URL, or null if the program has no large image
 */
export const getLargeImageUrl = (pictureBigPath) => pictureBigPath || null;
