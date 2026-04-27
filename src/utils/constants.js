/**
 * Layout constants for the EPG grid
 * @module utils/constants
 */

/** Base URL path for the Freebox API (relative, proxied by Vite in dev) */
export const API_BASE_URL = '/api/latest';

/** Height of a single channel row in pixels */
export const ROW_HEIGHT = 80;

/** Width of the channel sidebar in pixels (desktop) */
export const SIDEBAR_WIDTH = 120;

/** Height of the time header in pixels */
export const TIME_HEADER_HEIGHT = 48;

/** Number of extra channel rows to render above/below the viewport.
 *  Drives both rendering AND fetching: each extra row triggers
 *  `nb_buckets` extra by_channel requests up front, so increasing this
 *  value multiplies network traffic linearly. Profile before changing. */
export const OVERSCAN_ROWS = 10;

/** Number of extra hours to prefetch before/after the viewport */
export const OVERSCAN_HOURS = 1;

/** Hours of past content available before the current time origin */
export const PAST_HOURS = 6;

/**
 * Pixels between the grid's left edge and the time origin, given the
 * current responsive scale factor. Centralised so that anything wanting
 * to position relative to the origin uses the runtime `pixelsPerMinute`
 * instead of the desktop default.
 * @param {number} pixelsPerMinute - Current responsive scale factor
 * @returns {number} Past offset in pixels
 */
export const pastOffsetPx = (pixelsPerMinute) => PAST_HOURS * 60 * pixelsPerMinute;

/** Hours of future content rendered after the current time origin */
export const FUTURE_HOURS = 24;

/** Pixels per minute (desktop) */
export const PIXELS_PER_MINUTE = 4;

/** Pixels per second (derived from PIXELS_PER_MINUTE) */
export const PIXELS_PER_SECOND = PIXELS_PER_MINUTE / 60;

/** Default prime time hour (20:30) */
export const PRIME_TIME_HOUR = 20;
export const PRIME_TIME_MINUTE = 30;

/** Responsive breakpoint values */
export const BREAKPOINTS = {
  mobile: 600,
  tablet: 900,
};

/** Fraction of a row's height occupied by the recordings overlay strip */
export const OVERLAY_HEIGHT_RATIO = 0.18;

/** Minimum width in pixels for an overlay cell so the state icon stays readable */
export const OVERLAY_MIN_WIDTH_PX = 24;

/** Width of the coloured state border on the left of an overlay cell */
export const OVERLAY_BORDER_LEFT_PX = 3;

/** Responsive layout constants per breakpoint */
export const RESPONSIVE_CONSTANTS = {
  desktop: {
    sidebarWidth: 120,
    pixelsPerMinute: 4,
  },
  tablet: {
    sidebarWidth: 80,
    pixelsPerMinute: 3,
  },
  mobile: {
    sidebarWidth: 60,
    pixelsPerMinute: 2,
  },
};
