import { useEffect } from 'react';
import { AppState } from 'react-native';

import { recordDueEngagement } from '@/lib/notifications/recordDueEngagement';

/**
 * Records engagement reminders that fired while the app was closed (NOTI-02).
 * Runs when the app opens and each time it returns to the foreground. Renders nothing.
 */
export function EngagementLogSync() {
  useEffect(() => {
    void recordDueEngagement();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void recordDueEngagement();
      }
    });

    return () => subscription.remove();
  }, []);

  return null;
}
