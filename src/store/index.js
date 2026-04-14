/**
 * Redux store configuration
 * @module store
 */

import { configureStore } from '@reduxjs/toolkit';
import epgReducer from './epgSlice';
import channelsReducer from './channelsSlice';

const HIDDEN_CHANNELS_KEY = 'freebox-epg:hiddenChannels';

function loadHiddenChannels () {
  try {
    const raw = localStorage.getItem(HIDDEN_CHANNELS_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(item => typeof item === 'string')) {
      return undefined;
    }
    return { channels: { hiddenChannels: parsed } };
  } catch {
    return undefined;
  }
}

const store = configureStore({
  reducer: {
    epg: epgReducer,
    channels: channelsReducer,
  },
  preloadedState: loadHiddenChannels(),
});

let lastHidden = store.getState().channels.hiddenChannels;
store.subscribe(() => {
  const current = store.getState().channels.hiddenChannels;
  if (current === lastHidden) return;
  lastHidden = current;
  try {
    localStorage.setItem(HIDDEN_CHANNELS_KEY, JSON.stringify(current));
  } catch {
    // Quota exceeded or storage unavailable — ignore
  }
});

export default store;
