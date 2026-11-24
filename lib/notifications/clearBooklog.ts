import 'expo-sqlite/localStorage/install';

import { cancelGoalReached } from '@/lib/notifications/goalReached';
import { syncEngagementReminder } from '@/lib/notifications/engagement';
import { clearEngagementLedger } from '@/lib/notifications/engagementLedger';

/**
 * Clears BookLog-owned local schedules. Safe on user switch / sign-out.
 * Does not touch unrelated OS notifications.
 */
export async function clearBooklogNotifications(): Promise<void> {
  await cancelGoalReached();
  await syncEngagementReminder({ goal: null, achievedDates: [] });
  // The previous account's unsent logs would fail the goal foreign key under the new account.
  clearEngagementLedger(localStorage);
}
