import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import epgReducer from '@/store/epgSlice';
import { PAST_HOURS } from '@/utils/constants';
import useRecenterOnReturn from './useRecenterOnReturn';

const HOUR_MS = 3_600_000;

const setVisibility = (state) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
};

const renderWithStore = () => {
  const store = configureStore({ reducer: { epg: epgReducer } });
  const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
  renderHook(() => useRecenterOnReturn(), { wrapper });
  return store;
};

describe('useRecenterOnReturn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-10T20:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    setVisibility('visible');
  });

  it('recentres on now after the tab was hidden for more than an hour', () => {
    const store = renderWithStore();

    setVisibility('hidden');
    vi.advanceTimersByTime(2 * HOUR_MS);
    setVisibility('visible');

    const now = Math.floor(Date.now() / 1000);
    expect(store.getState().epg.timeOrigin).toBe(now - PAST_HOURS * 3600);
  });

  it('keeps the current origin after a short absence', () => {
    const store = renderWithStore();
    const { timeOrigin } = store.getState().epg;

    setVisibility('hidden');
    vi.advanceTimersByTime(10 * 60 * 1000);
    setVisibility('visible');

    expect(store.getState().epg.timeOrigin).toBe(timeOrigin);
  });
});
