import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { CLOCK_TICK_MS } from '@/constants/focus';

/** `now - startedAt`, so the value stays right after the app was in the background. */
export function useElapsedSeconds(startedAt: string): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(Date.now());
      }
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000));
}
