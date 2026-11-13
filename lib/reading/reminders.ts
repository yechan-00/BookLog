import { fetchActiveGoal } from '@/lib/api/goals';
import { syncEngagementReminder } from '@/lib/notifications';
import type { SyncEngagementReminderResult } from '@/lib/notifications/types';
import { toDateKey } from '@/utils/date';
import { describeDay } from '@/utils/readingPeriod';
import { loadReadingHistory } from '@/utils/readingSource';

/**
 * Rebuilds the engagement reminders from the saved goal and today's sessions (NOTI-02).
 * Call after a goal is saved or a session is saved. It never throws: a failed reminder
 * must not undo or block the save that triggered it, so the result carries the reason.
 */
export async function refreshEngagementReminder(): Promise<SyncEngagementReminderResult> {
  try {
    const [goal, history] = await Promise.all([fetchActiveGoal(), loadReadingHistory()]);
    const todayKey = toDateKey(new Date());
    const isTodayAchieved =
      describeDay(todayKey, todayKey, history.goals, history.activities).achievement === 'achieved';

    return await syncEngagementReminder({
      goal:
        goal && goal.reminderTime
          ? {
              goalId: goal.id,
              daysOfWeek: goal.daysOfWeek,
              reminderTime: goal.reminderTime,
              enabled: goal.notificationsEnabled,
            }
          : null,
      achievedDates: isTodayAchieved ? [todayKey] : [],
    });
  } catch (error) {
    return {
      status: 'failed',
      scheduled: [],
      cancelledIds: [],
      reason: error instanceof Error ? error.message : '참여 유도 알림을 갱신하지 못했습니다.',
    };
  }
}
