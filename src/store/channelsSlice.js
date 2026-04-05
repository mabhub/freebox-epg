/**
 * Redux slice for channel filtering state
 * @module store/channelsSlice
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  /** Set of hidden channel UUIDs (stored as array for Redux serialization) */
  hiddenChannels: [],
};

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    /**
     * Toggle visibility of a channel
     * @param {Object} state - Current state
     * @param {{ payload: string }} action - Channel UUID to toggle
     */
    toggleChannel (state, action) {
      const uuid = action.payload;
      const index = state.hiddenChannels.indexOf(uuid);
      if (index === -1) {
        state.hiddenChannels.push(uuid);
      } else {
        state.hiddenChannels.splice(index, 1);
      }
    },

    /**
     * Bulk set hidden channels
     * @param {Object} state - Current state
     * @param {{ payload: Array<string> }} action - Array of UUIDs to hide
     */
    setHiddenChannels (state, action) {
      state.hiddenChannels = action.payload;
    },
  },
});

export const { toggleChannel, setHiddenChannels } = channelsSlice.actions;
export default channelsSlice.reducer;
