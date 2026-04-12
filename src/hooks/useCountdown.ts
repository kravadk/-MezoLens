import { useState, useEffect } from 'react';

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
}

/**
 * Countdown timer hook
 * @param targetTimestamp Unix timestamp (seconds) to count down to
 */
export function useCountdown(targetTimestamp: number): Countdown {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalSeconds = Math.max(targetTimestamp - now, 0);
  const isExpired = totalSeconds <= 0;

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
    isExpired,
  };
}

/**
 * Epoch countdown - counts to next epoch
 * @param epochStartTime Current epoch start timestamp
 * @param epochDuration Epoch duration in seconds (default 7 days)
 */
export function useEpochCountdown(epochStartTime: number, epochDuration = 604800): Countdown {
  const nextEpoch = epochStartTime + epochDuration;
  return useCountdown(nextEpoch);
}
