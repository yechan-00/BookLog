import { addDays, parseDateKey, startOfWeek, toDateKey } from '@/utils/date';
import {
  describeDay,
  weekdayLabel,
  type DayAchievement,
  type GoalPeriod,
  type ReadingActivity,
} from '@/utils/readingPeriod';

export interface WeekDayState {
  dateKey: string;
  label: string;
  achievement: DayAchievement;
}

export interface WeeklyAchievement {
  /** Null when no goal day in this week has a decided result. */
  rate: number | null;
  achievedCount: number;
  decidedCount: number;
  days: WeekDayState[];
}

function isDecided(achievement: DayAchievement): boolean {
  return achievement === 'achieved' || achievement === 'missed';
}

/** Current week starts on Monday. Future days and an unfinished today are not failures. */
export function weeklyAchievement(
  todayKey: string,
  goals: readonly GoalPeriod[],
  activities: readonly ReadingActivity[],
): WeeklyAchievement {
  const weekStart = startOfWeek(parseDateKey(todayKey));
  const days = Array.from({ length: 7 }, (_, index) => {
    const dateKey = toDateKey(addDays(weekStart, index));
    return {
      dateKey,
      label: weekdayLabel(dateKey),
      achievement: describeDay(dateKey, todayKey, goals, activities).achievement,
    };
  });
  const decided = days.filter((day) => isDecided(day.achievement));
  const achievedCount = decided.filter((day) => day.achievement === 'achieved').length;

  return {
    rate: decided.length === 0 ? null : Math.round((achievedCount / decided.length) * 100),
    achievedCount,
    decidedCount: decided.length,
    days,
  };
}
