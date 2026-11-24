import { cancelGoalReached } from '@/lib/notifications/goalReached';
import { syncEngagementReminder } from '@/lib/notifications/engagement';

/**
 * Clears BookLog-owned local schedules. Safe on user switch / sign-out.
 * Does not touch unrelated OS notifications.
 */
export async function clearBooklogNotifications(): Promise<void> {
  await cancelGoalReached();
  await syncEngagementReminder({ goal: null, achievedDates: [] });
}
