/**
 * Redux store configuration
 * @module store
 */

import { configureStore } from '@reduxjs/toolkit';
import epgReducer from './epgSlice';
import channelsReducer from './channelsSlice';

const store = configureStore({
  reducer: {
    epg: epgReducer,
    channels: channelsReducer,
  },
});

export default store;
