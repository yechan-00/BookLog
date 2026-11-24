import { fetchActiveGoal } from '@/lib/api/goals';
import { syncEngagementFromStoredGoal } from '@/lib/notifications';
import type { SyncEngagementReminderResult } from '@/lib/notifications/types';

/**
 * Rebuilds the engagement reminders from the saved goal (NOTI-02).
 * Call after a goal is saved or a session is saved. It never throws: a failed reminder
 * must not undo or block the save that triggered it, so the result carries the reason.
 * The scheduling rules live in the notification module (syncEngagementFromStoredGoal).
 */
export async function refreshEngagementReminder(): Promise<SyncEngagementReminderResult> {
  try {
    return await syncEngagementFromStoredGoal(await fetchActiveGoal());
  } catch (error) {
    return {
      status: 'failed',
      scheduled: [],
      cancelledIds: [],
      reason: error instanceof Error ? error.message : '참여 유도 알림을 갱신하지 못했습니다.',
    };
  }
}
