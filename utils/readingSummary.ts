import { parseDateKey, toDateKey } from '@/utils/date';
import {
  describeDay,
  goalForDate,
  shiftDateKey,
  type GoalPeriod,
  type ReadingActivity,
  type ReadingHistory,
} from '@/utils/readingPeriod';
import { readingStreak, type ReadingStreak } from '@/utils/readingStreak';
import { weeklyAchievement, type WeeklyAchievement } from '@/utils/weeklyAchievement';

export interface TodayGoalProgress {
  state: 'no_goal' | 'rest' | 'unknown' | 'in_progress' | 'achieved';
  goalType: 'time' | 'pages' | null;
  readSeconds: number;
  targetSeconds: number | null;
  remainingSeconds: number | null;
  readPages: number | null;
  targetPages: number | null;
  remainingPages: number | null;
  /** Current divided by target. May be greater than 1. */
  ratio: number | null;
  /** Bar value, capped at 100. */
  percent: number | null;
}

export interface TodayReading {
  sessionCount: number;
  durationSeconds: number;
  pagesRead: number | null;
}

export interface DailyTrendPoint {
  dateKey: string;
  durationSeconds: number;
  pagesRead: number | null;
  hasReading: boolean;
}

export interface PeriodReading {
  dayCount: number;
  readingDayCount: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  totalPages: number | null;
  averagePages: number | null;
  days: DailyTrendPoint[];
}

export interface RangeAchievement {
  rate: number | null;
  achievedCount: number;
  decidedCount: number;
  scheduledCount: number;
}

export interface HomeReadingSummary {
  goal: TodayGoalProgress;
  reading: TodayReading;
  streak: ReadingStreak;
  week: WeeklyAchievement;
}

export interface InsightReadingSummary {
  period: PeriodReading;
  streak: ReadingStreak;
  week: WeeklyAchievement;
  month: RangeAchievement;
}

function activitiesOn(activities: readonly ReadingActivity[], dateKey: string): ReadingActivity[] {
  return activities.filter((activity) => activity.readOn === dateKey);
}

function cappedPercent(ratio: number): number {
  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
}

export function todayReading(todayKey: string, activities: readonly ReadingActivity[]): TodayReading {
  const day = describeDay(todayKey, todayKey, [], activities);
  return {
    sessionCount: activitiesOn(activities, todayKey).length,
    durationSeconds: day.durationSeconds,
    pagesRead: day.hasReading ? day.pagesRead : 0,
  };
}

export function todayGoalProgress(
  todayKey: string,
  goals: readonly GoalPeriod[],
  activities: readonly ReadingActivity[],
): TodayGoalProgress {
  const day = describeDay(todayKey, todayKey, goals, activities);
  const active = goalForDate(goals, todayKey);
  const readSeconds = day.durationSeconds;
  const readPages = day.hasReading ? day.pagesRead : 0;
  const empty = {
    readSeconds,
    readPages,
    targetSeconds: null,
    remainingSeconds: null,
    targetPages: null,
    remainingPages: null,
    ratio: null,
    percent: null,
    goalType: active?.type ?? null,
  };

  if (day.achievement === 'none') {
    return { ...empty, state: 'no_goal', goalType: null };
  }

  if (day.achievement === 'off') {
    return { ...empty, state: 'rest', goalType: null };
  }

  if (!active || day.achievement === 'unknown') {
    return {
      ...empty,
      state: 'unknown',
      targetPages: active?.type === 'pages' ? active.targetValue : null,
      targetSeconds: active?.type === 'time' ? active.targetValue * 60 : null,
    };
  }

  if (active.type === 'time') {
    const targetSeconds = active.targetValue * 60;
    const ratio = readSeconds / targetSeconds;
    return {
      state: day.achievement === 'achieved' ? 'achieved' : 'in_progress',
      goalType: 'time',
      readSeconds,
      targetSeconds,
      remainingSeconds: Math.max(0, targetSeconds - readSeconds),
      readPages,
      targetPages: null,
      remainingPages: null,
      ratio,
      percent: cappedPercent(ratio),
    };
  }

  if (readPages === null) {
    return { ...empty, state: 'unknown', goalType: 'pages', targetPages: active.targetValue };
  }

  const ratio = readPages / active.targetValue;
  return {
    state: day.achievement === 'achieved' ? 'achieved' : 'in_progress',
    goalType: 'pages',
    readSeconds,
    targetSeconds: null,
    remainingSeconds: null,
    readPages,
    targetPages: active.targetValue,
    remainingPages: Math.max(0, active.targetValue - readPages),
    ratio,
    percent: cappedPercent(ratio),
  };
}

export function periodReading(
  todayKey: string,
  dayCount: number,
  activities: readonly ReadingActivity[],
): PeriodReading {
  const count = Number.isSafeInteger(dayCount) && dayCount > 0 ? Math.min(dayCount, 366) : 0;
  const start = count === 0 ? todayKey : shiftDateKey(todayKey, -(count - 1));
  const days: DailyTrendPoint[] = [];
  let totalDurationSeconds = 0;
  let readingDayCount = 0;
  let pagesMissing = false;
  let pageTotal = 0;

  for (let index = 0; index < count; index += 1) {
    const dateKey = shiftDateKey(start, index);
    const day = describeDay(dateKey, todayKey, [], activities);
    const pagesRead = day.hasReading ? day.pagesRead : 0;
    if (day.hasReading) {
      readingDayCount += 1;
    }
    if (pagesRead === null) {
      pagesMissing = true;
    } else {
      pageTotal += pagesRead;
    }
    totalDurationSeconds += day.durationSeconds;
    days.push({
      dateKey,
      durationSeconds: day.durationSeconds,
      pagesRead,
      hasReading: day.hasReading,
    });
  }

  return {
    dayCount: count,
    readingDayCount,
    totalDurationSeconds,
    averageDurationSeconds: count === 0 ? 0 : totalDurationSeconds / count,
    totalPages: pagesMissing ? null : pageTotal,
    averagePages: pagesMissing || count === 0 ? null : pageTotal / count,
    days,
  };
}

export function achievementInRange(
  todayKey: string,
  fromKey: string,
  toKey: string,
  goals: readonly GoalPeriod[],
  activities: readonly ReadingActivity[],
): RangeAchievement {
  let achievedCount = 0;
  let decidedCount = 0;
  let scheduledCount = 0;
  let cursor = fromKey;
  let guard = 0;

  while (cursor <= toKey && guard < 400) {
    const achievement = describeDay(cursor, todayKey, goals, activities).achievement;
    if (
      achievement === 'achieved' ||
      achievement === 'missed' ||
      achievement === 'pending' ||
      achievement === 'upcoming' ||
      achievement === 'unknown'
    ) {
      scheduledCount += 1;
    }
    if (achievement === 'achieved' || achievement === 'missed') {
      decidedCount += 1;
      if (achievement === 'achieved') {
        achievedCount += 1;
      }
    }
    cursor = shiftDateKey(cursor, 1);
    guard += 1;
  }

  return {
    rate: decidedCount === 0 ? null : Math.round((achievedCount / decidedCount) * 100),
    achievedCount,
    decidedCount,
    scheduledCount,
  };
}

export function monthBounds(todayKey: string): { from: string; to: string } {
  const date = parseDateKey(todayKey);
  return {
    from: toDateKey(new Date(date.getFullYear(), date.getMonth(), 1)),
    to: toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  };
}

export function homeReadingSummary(todayKey: string, history: ReadingHistory): HomeReadingSummary {
  return {
    goal: todayGoalProgress(todayKey, history.goals, history.activities),
    reading: todayReading(todayKey, history.activities),
    streak: readingStreak(todayKey, history.goals, history.activities),
    week: weeklyAchievement(todayKey, history.goals, history.activities),
  };
}

export function insightReadingSummary(
  todayKey: string,
  dayCount: number,
  history: ReadingHistory,
): InsightReadingSummary {
  const month = monthBounds(todayKey);
  return {
    period: periodReading(todayKey, dayCount, history.activities),
    streak: readingStreak(todayKey, history.goals, history.activities),
    week: weeklyAchievement(todayKey, history.goals, history.activities),
    month: achievementInRange(todayKey, month.from, month.to, history.goals, history.activities),
  };
}
