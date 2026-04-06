/**
 * EPG program category colors and labels
 * @module utils/categories
 */

/**
 * Category color mapping (subtle background tints)
 * Keys are category IDs from the Freebox API
 */
const CATEGORY_COLORS = {
  1: 'rgba(233, 30, 99, 0.12)',
  2: 'rgba(233, 30, 99, 0.08)',
  3: 'rgba(63, 81, 181, 0.12)',
  4: 'rgba(63, 81, 181, 0.08)',
  5: 'rgba(0, 150, 136, 0.12)',
  6: 'rgba(156, 39, 176, 0.12)',
  7: 'rgba(156, 39, 176, 0.10)',
  8: 'rgba(156, 39, 176, 0.08)',
  9: 'rgba(255, 152, 0, 0.12)',
  10: 'rgba(33, 150, 243, 0.12)',
  11: 'rgba(76, 175, 80, 0.12)',
  12: 'rgba(255, 193, 7, 0.12)',
  13: 'rgba(233, 30, 99, 0.10)',
  14: 'rgba(255, 152, 0, 0.10)',
  16: 'rgba(76, 175, 80, 0.10)',
  19: 'rgba(244, 67, 54, 0.12)',
  20: 'rgba(96, 125, 139, 0.12)',
  22: 'rgba(121, 85, 72, 0.12)',
  24: 'rgba(255, 87, 34, 0.12)',
  31: 'rgba(158, 158, 158, 0.12)',
};

/**
 * Accent border colors for highlighted categories (Film, Téléfilm, Série)
 * Opaque versions of the background colors for a left border accent
 */
const CATEGORY_ACCENTS = {
  1: '#e91e63',
  2: '#e91e63',
  3: '#3f51b5',
  4: '#3f51b5',
};

/**
 * Get the background color for a program category
 * @param {number} categoryId - Category ID
 * @returns {string} CSS color value
 */
export const getCategoryColor = (categoryId) =>
  CATEGORY_COLORS[categoryId] ?? 'transparent';

/**
 * Get the accent border color for highlighted categories
 * @param {number} categoryId - Category ID
 * @returns {string|null} CSS color value, or null if no accent
 */
export const getCategoryAccent = (categoryId) =>
  CATEGORY_ACCENTS[categoryId] ?? null;
