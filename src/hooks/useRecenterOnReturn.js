/**
 * Hook re-centring the EPG on the current time after a long absence
 * @module hooks/useRecenterOnReturn
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setTimeOrigin } from '@/store/epgSlice';
import { nowTimestamp } from '@/utils/time';

const MAX_HIDDEN_MS = 60 * 60 * 1000;

/**
 * Jump back to "now" when the tab becomes visible again after being hidden
 * for more than an hour. `timeOrigin` is otherwise only set at load time and
 * by the toolbar, so a tab left open overnight would show a stale window.
 * Never fires while the tab is visible, so it cannot move the view under a
 * user who is browsing.
 * @returns {void}
 */
const useRecenterOnReturn = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    let hiddenAt = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt > MAX_HIDDEN_MS) {
        dispatch(setTimeOrigin(nowTimestamp()));
      }
      hiddenAt = null;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [dispatch]);
};

export default useRecenterOnReturn;
