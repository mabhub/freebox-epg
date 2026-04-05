/**
 * Layout constants for the EPG grid
 * @module utils/constants
 */

/** Height of a single channel row in pixels */
export const ROW_HEIGHT = 80;

/** Width of the channel sidebar in pixels (desktop) */
export const SIDEBAR_WIDTH = 120;

/** Height of the time header in pixels */
export const TIME_HEADER_HEIGHT = 48;

/** Number of extra rows to render above/below the viewport */
export const OVERSCAN_ROWS = 5;

/** Number of extra hours to prefetch before/after the viewport */
export const OVERSCAN_HOURS = 1;

/** Hours of past content available before the current time origin */
export const PAST_HOURS = 6;

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
