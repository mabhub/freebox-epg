/**
 * Redux slice for EPG navigation and program selection state
 * @module store/epgSlice
 */

import { createSlice } from '@reduxjs/toolkit';
import { nowTimestamp } from '@/utils/time';

const initialState = {
  /** Unix timestamp of the left edge of the viewport */
  timeOrigin: nowTimestamp(),
  /** Horizontal scroll position in pixels */
  scrollLeft: 0,
  /** Vertical scroll position in pixels */
  scrollTop: 0,
  /** Selected program ID for the detail modal (null = closed) */
  selectedProgramId: null,
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
     * @param {Object} state - Current state
     * @param {{ payload: number }} action - Unix timestamp
     */
    setTimeOrigin (state, action) {
      state.timeOrigin = action.payload;
      state.scrollLeft = 0;
    },

    /**
     * Select a program to show in the detail modal
     * @param {Object} state - Current state
     * @param {{ payload: string }} action - Program ID
     */
    selectProgram (state, action) {
      state.selectedProgramId = action.payload;
    },

    /**
     * Close the detail modal
     * @param {Object} state - Current state
     */
    clearSelection (state) {
      state.selectedProgramId = null;
    },
  },
});

export const { setScroll, setTimeOrigin, selectProgram, clearSelection } = epgSlice.actions;
export default epgSlice.reducer;
