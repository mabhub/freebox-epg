/**
 * Redux slice for EPG navigation and program selection state
 * @module store/epgSlice
 */

import { createSlice } from '@reduxjs/toolkit';
import { nowTimestamp } from '@/utils/time';
import { PAST_HOURS, PIXELS_PER_MINUTE } from '@/utils/constants';

const PAST_OFFSET_PX = PAST_HOURS * 60 * PIXELS_PER_MINUTE;

const initialState = {
  /** Unix timestamp of the left edge of the viewport (includes past buffer) */
  timeOrigin: nowTimestamp() - PAST_HOURS * 3600,
  /** Horizontal scroll position in pixels */
  scrollLeft: PAST_OFFSET_PX,
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
     * Jump to a specific time
     * Resets scrollLeft to the past-hours offset so the target time
     * appears at the expected viewport position after navigation
     * @param {Object} state - Current state
     * @param {{ payload: number }} action - Target Unix timestamp
     */
    setTimeOrigin (state, action) {
      state.timeOrigin = action.payload - PAST_HOURS * 3600;
      state.scrollLeft = PAST_OFFSET_PX;
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

export const { setScroll, setTimeOrigin, selectProgram, clearSelection } = epgSlice.actions;
export default epgSlice.reducer;
