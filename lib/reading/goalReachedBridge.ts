import { fetchActiveGoal } from '@/lib/api/goals';
import { cancelGoalReached, scheduleGoalReached } from '@/lib/notifications/goalReached';
import type { ScheduleGoalReachedResult } from '@/lib/notifications/types';
import { startOfToday, toDateKey } from '@/utils/date';
import { buildGoalReachedInput } from '@/utils/notificationGoals';
import { loadReadingHistory } from '@/utils/readingSource';
import { todayGoalProgress } from '@/utils/readingSummary';

/**
 * Schedules or skips the time-goal alert for the active reading session.
 * Uses saved today progress plus the current session elapsed time.
 */
export async function syncGoalReachedForSession(sessionElapsedSeconds: number): Promise<ScheduleGoalReachedResult> {
  const [goal, history] = await Promise.all([fetchActiveGoal(), loadReadingHistory()]);
  if (!goal || !goal.notificationsEnabled) {
    await cancelGoalReached();
    return { status: 'skipped', reason: 'invalid_goal' };
  }

  const todayKey = toDateKey(startOfToday());
  const progress = todayGoalProgress(todayKey, history.goals, history.activities);
  const input = buildGoalReachedInput({
    goalId: goal.id,
    progress,
    notificationsEnabled: goal.notificationsEnabled,
    sessionElapsedSeconds,
  });

  if (!input) {
    await cancelGoalReached();
    if (progress.goalType === 'pages') {
      return { status: 'skipped', reason: 'not_time_goal' };
    }
    if (progress.state === 'achieved') {
      return { status: 'skipped', reason: 'already_achieved' };
    }
    return { status: 'skipped', reason: 'invalid_goal' };
  }

  return scheduleGoalReached(input);
}

export async function stopGoalReachedAlert(): Promise<void> {
  await cancelGoalReached();
}
