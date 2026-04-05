/**
 * Hook for tracking the current time with periodic updates
 * @module hooks/useCurrentTime
 */

import { useState, useEffect } from 'react';
import { nowTimestamp } from '@/utils/time';

const UPDATE_INTERVAL_MS = 60_000;

/**
 * Return the current Unix timestamp in seconds, updating every minute
 * @returns {number} Current Unix timestamp
 */
const useCurrentTime = () => {
  const [now, setNow] = useState(nowTimestamp);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(nowTimestamp());
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return now;
};

export default useCurrentTime;
