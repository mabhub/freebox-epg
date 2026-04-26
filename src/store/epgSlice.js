/**
 * Redux slice for EPG navigation and program selection state
 * @module store/epgSlice
 */

import { createSlice } from '@reduxjs/toolkit';
import { nowTimestamp } from '@/utils/time';
import { PAST_HOURS, pastOffsetPx } from '@/utils/constants';

const initialState = {
  /** Unix timestamp of the left edge of the viewport (includes past buffer) */
  timeOrigin: nowTimestamp() - PAST_HOURS * 3600,
  /**
   * Horizontal scroll position in pixels. The desktop-default offset is a
   * placeholder: EpgGrid dispatches `centerOnTimeOrigin` with the actual
   * viewport size on mount and after every `setTimeOrigin`, which
   * overrides this value before the first fetch batch is computed.
   */
  scrollLeft: 0,
  /** Vertical scroll position in pixels */
  scrollTop: 0,
  /** Selected program ID for the detail modal (null = closed) */
  selectedProgramId: null,
  /** Channel UUID of the selected program (for prev/next navigation) */
  selectedChannelUuid: null,
};

const epgSlice = createSlice({
  name: 'epg',
  initialState,
  reducers: {
    /**
     * Update scroll position
     * @param {Object} state - Current state
     * @param {{ payload: { scrollLeft?: number, scrollTop?: number } }} action - Scroll values
     */
    setScroll (state, action) {
      const { scrollLeft, scrollTop } = action.payload;
      if (scrollLeft !== undefined) {
        state.scrollLeft = scrollLeft;
      }
      if (scrollTop !== undefined) {
        state.scrollTop = scrollTop;
      }
    },

    /**
     * Jump to a specific time. EpgGrid observes `timeOrigin` and
     * dispatches `centerOnTimeOrigin` with the runtime viewport size,
     * which sets the correct `scrollLeft` for the new origin.
     * @param {Object} state - Current state
     * @param {{ payload: number }} action - Target Unix timestamp
     */
    setTimeOrigin (state, action) {
      state.timeOrigin = action.payload - PAST_HOURS * 3600;
    },

    /**
     * Centre the current time origin at ~1/3 of the viewport width.
     * Needs the runtime viewport dimensions in the payload because they
     * live in the DOM, not in Redux state.
     * @param {Object} state - Current state
     * @param {{ payload: { viewportWidth: number, pixelsPerMinute: number } }} action - Viewport dimensions
     */
    centerOnTimeOrigin (state, action) {
      const { viewportWidth, pixelsPerMinute } = action.payload;
      state.scrollLeft = Math.max(0, pastOffsetPx(pixelsPerMinute) - viewportWidth / 3);
    },

    /**
     * Select a program to show in the detail modal
     * @param {Object} state - Current state
     * @param {{ payload: { programId: string, channelUuid: string } }} action - Program and channel IDs
     */
    selectProgram (state, action) {
      state.selectedProgramId = action.payload.programId;
      state.selectedChannelUuid = action.payload.channelUuid;
    },

    /**
     * Close the detail modal
     * @param {Object} state - Current state
     */
    clearSelection (state) {
      state.selectedProgramId = null;
      state.selectedChannelUuid = null;
    },
  },
});

export const {
  setScroll,
  setTimeOrigin,
  centerOnTimeOrigin,
  selectProgram,
  clearSelection,
} = epgSlice.actions;
export default epgSlice.reducer;
