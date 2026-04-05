/**
 * Image URL builders for channels and programs
 * @module utils/images
 */

const BASE_URL = '/api/latest';

/**
 * Build the URL for a channel logo
 * @param {string} uuid - Channel UUID (e.g., "uuid-webtv-201")
 * @returns {string} Full URL to the 68x60 PNG logo
 */
export const getLogoUrl = (uuid) =>
  `${BASE_URL}/tv/img/channels/logos68x60/${uuid}.png`;

/**
 * Build the URL for a program thumbnail (small, 100x77)
 * The API returns paths already prefixed with /api/latest, so no base URL needed
 * @param {string} picturePath - Picture path from EpgProgram.picture
 * @returns {string|null} URL to the thumbnail, or null if no picture
 */
export const getThumbnailUrl = (picturePath) => {
  if (!picturePath) {
    return null;
  }
  return picturePath;
};

/**
 * Build the URL for a program image (large, 168x130)
 * The API returns paths already prefixed with /api/latest, so no base URL needed
 * @param {string} pictureBigPath - Picture path from EpgProgram.picture_big
 * @returns {string|null} URL to the large image, or null if no picture
 */
export const getLargeImageUrl = (pictureBigPath) => {
  if (!pictureBigPath) {
    return null;
  }
  return pictureBigPath;
};
