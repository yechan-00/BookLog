import { ENGAGEMENT_HORIZON_DAYS } from '@/lib/notifications/schedulePlan';
import type { EngagementGoalInput, ScheduleGoalReachedInput } from '@/lib/notifications/types';
import type { StoredReadingGoal } from '@/types/goal';
import {
  describeDay,
  shiftDateKey,
  type GoalPeriod,
  type ReadingActivity,
} from '@/utils/readingPeriod';
import type { TodayGoalProgress } from '@/utils/readingSummary';

/** Maps a stored goal into the engagement scheduler input, or null when reminder time is missing. */
export function engagementInputFromGoal(goal: StoredReadingGoal): EngagementGoalInput | null {
  if (!goal.reminderTime) {
    return null;
  }

  return {
    goalId: goal.id,
    daysOfWeek: goal.daysOfWeek,
    reminderTime: goal.reminderTime,
    enabled: goal.notificationsEnabled,
  };
}

/** Local dates in the engagement horizon whose goal is already achieved. */
export function listAchievedDateKeys(input: {
  todayKey: string;
  goals: readonly GoalPeriod[];
  activities: readonly ReadingActivity[];
  horizonDays?: number;
}): string[] {
  const horizon = input.horizonDays ?? ENGAGEMENT_HORIZON_DAYS;
  const achieved: string[] = [];

  for (let offset = 0; offset < horizon; offset += 1) {
    const dateKey = shiftDateKey(input.todayKey, offset);
    if (describeDay(dateKey, input.todayKey, input.goals, input.activities).achievement === 'achieved') {
      achieved.push(dateKey);
    }
  }

  return achieved;
}

/**
 * Remaining minutes until a time goal is met, including the in-progress session.
 * Returns null when a goal-reached alert should not be scheduled.
 */
export function remainingMinutesForGoalReached(input: {
  progress: TodayGoalProgress;
  notificationsEnabled: boolean;
  sessionElapsedSeconds: number;
}): number | null {
  if (!input.notificationsEnabled) {
    return null;
  }

  if (input.progress.state === 'no_goal' || input.progress.state === 'rest') {
    return null;
  }

  if (input.progress.goalType !== 'time' || input.progress.targetSeconds == null) {
    return null;
  }

  if (input.progress.state === 'achieved') {
    return null;
  }

  const priorSeconds = input.progress.readSeconds;
  const totalSeconds = priorSeconds + Math.max(0, input.sessionElapsedSeconds);
  const remainingSeconds = input.progress.targetSeconds - totalSeconds;
  if (remainingSeconds < 1) {
    return null;
  }

  return remainingSeconds / 60;
}

export function buildGoalReachedInput(input: {
  goalId: string;
  progress: TodayGoalProgress;
  notificationsEnabled: boolean;
  sessionElapsedSeconds: number;
}): ScheduleGoalReachedInput | null {
  const remaining = remainingMinutesForGoalReached(input);
  if (remaining == null || input.progress.targetSeconds == null) {
    return null;
  }

  const targetMinutes = input.progress.targetSeconds / 60;
  const elapsedMinutes = targetMinutes - remaining;

  return {
    goalId: input.goalId,
    goalType: 'time',
    targetMinutes,
    elapsedMinutes,
  };
}

/** Page-goal copy for the finish summary. Time goals rely on the local alert instead. */
export function pageGoalFinishMessage(input: {
  progressBefore: TodayGoalProgress | null;
  pagesReadThisSession: number;
}): string | null {
  const progress = input.progressBefore;
  if (!progress || progress.goalType !== 'pages' || progress.targetPages == null) {
    return null;
  }

  if (progress.state === 'rest' || progress.state === 'no_goal') {
    return null;
  }

  const priorPages = progress.readPages ?? 0;
  const total = priorPages + Math.max(0, input.pagesReadThisSession);
  if (total >= progress.targetPages) {
    if (progress.state === 'achieved') {
      return '오늘 페이지 목표는 이미 달성한 상태예요.';
    }
    return `오늘 페이지 목표 ${progress.targetPages}페이지에 도달했어요.`;
  }

  const remaining = progress.targetPages - total;
  return `오늘 페이지 목표까지 ${remaining}페이지 남았어요.`;
}
