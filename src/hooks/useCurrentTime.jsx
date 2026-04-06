/**
 * Hook and Context for tracking the current time with periodic updates
 * @module hooks/useCurrentTime
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { nowTimestamp } from '@/utils/time';

const UPDATE_INTERVAL_MS = 60_000;

const NowContext = createContext(0);

/**
 * Provider component that updates the current timestamp every minute
 * Place once near the top of the component tree
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} Context provider
 */
export const NowProvider = ({ children }) => {
  const [now, setNow] = useState(nowTimestamp);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(nowTimestamp());
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return <NowContext value={now}>{children}</NowContext>;
};

/**
 * Return the current Unix timestamp in seconds, updating every minute
 * Must be used within a NowProvider
 * @returns {number} Current Unix timestamp
 */
const useCurrentTime = () => useContext(NowContext);

export default useCurrentTime;
