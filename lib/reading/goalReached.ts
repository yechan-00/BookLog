import { fetchActiveGoal } from '@/lib/api/goals';
import { cancelGoalReached, scheduleGoalReached } from '@/lib/notifications';
import type { ScheduleGoalReachedResult } from '@/lib/notifications/types';
import { toDateKey } from '@/utils/date';
import { loadReadingHistory } from '@/utils/readingSource';

const SECONDS_PER_MINUTE = 60;

/**
 * Schedules the "goal reached" alert for a running session (READ-03).
 * The remaining time is the goal minus what was already saved today minus this session so far,
 * so resuming after an app kill still lands on the right moment. Only time goals on goal days alert.
 * It never throws: reading must not be blocked by a notification problem.
 */
export async function armGoalReached(sessionStartedAt: string): Promise<ScheduleGoalReachedResult> {
  try {
    const now = new Date();
    const [goal, history] = await Promise.all([fetchActiveGoal(), loadReadingHistory()]);

    if (!goal || !goal.daysOfWeek.includes(now.getDay())) {
      await cancelGoalReached();
      return { status: 'skipped', reason: 'not_time_goal' };
    }

    const todayKey = toDateKey(now);
    const savedSeconds = history.activities
      .filter((activity) => activity.readOn === todayKey)
      .reduce((sum, activity) => sum + activity.durationSeconds, 0);
    const sessionSeconds = Math.max(0, (now.getTime() - Date.parse(sessionStartedAt)) / 1000);

    return await scheduleGoalReached({
      goalId: goal.id,
      goalType: goal.type,
      targetMinutes: goal.targetValue,
      elapsedMinutes: (savedSeconds + sessionSeconds) / SECONDS_PER_MINUTE,
    });
  } catch (error) {
    return {
      status: 'failed',
      reason: error instanceof Error ? error.message : '목표 도달 알림을 예약하지 못했습니다.',
    };
  }
}
