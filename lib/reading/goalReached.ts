import { syncGoalReachedForSession } from '@/lib/reading/goalReachedBridge';
import type { ScheduleGoalReachedResult } from '@/lib/notifications/types';

const MILLISECONDS_PER_SECOND = 1000;

/**
 * Schedules the "goal reached" alert for a running session (READ-03).
 * Resuming after an app kill still lands on the right moment because the elapsed time
 * comes from the session start. It never throws: reading must not be blocked by a notification problem.
 * The decision rules live in the notification module (syncGoalReachedForSession).
 */
export async function armGoalReached(sessionStartedAt: string): Promise<ScheduleGoalReachedResult> {
  try {
    const startedAtMs = Date.parse(sessionStartedAt);
    // A broken start time must not reach the scheduler as NaN.
    const elapsedSeconds = Number.isNaN(startedAtMs)
      ? 0
      : Math.max(0, (Date.now() - startedAtMs) / MILLISECONDS_PER_SECOND);
    return await syncGoalReachedForSession(elapsedSeconds);
  } catch (error) {
    return {
      status: 'failed',
      reason: error instanceof Error ? error.message : '목표 도달 알림을 예약하지 못했습니다.',
    };
  }
}
