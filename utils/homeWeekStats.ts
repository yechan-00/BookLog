import { addDays, parseDateKey, startOfWeek, toDateKey } from '@/utils/date';
import { weekdayLabel, type ReadingActivity } from '@/utils/readingPeriod';

export type WeekDayDuration = {
  dateKey: string;
  label: string;
  durationSeconds: number;
  isToday: boolean;
  isFuture: boolean;
};

export type HomeWeekStats = {
  days: WeekDayDuration[];
  totalSeconds: number;
  previousWeekSeconds: number;
  /** Null when there is no previous-week reading to compare. */
  deltaSeconds: number | null;
};

function sumOnDay(activities: readonly ReadingActivity[], dateKey: string): number {
  return activities
    .filter((activity) => activity.readOn === dateKey)
    .reduce((sum, activity) => sum + Math.max(0, activity.durationSeconds), 0);
}

export function homeWeekStats(todayKey: string, activities: readonly ReadingActivity[]): HomeWeekStats {
  const weekStart = startOfWeek(parseDateKey(todayKey));
  const days = Array.from({ length: 7 }, (_, index) => {
    const dateKey = toDateKey(addDays(weekStart, index));
    return {
      dateKey,
      label: weekdayLabel(dateKey),
      durationSeconds: sumOnDay(activities, dateKey),
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
    };
  });

  const previousStart = addDays(weekStart, -7);
  const previousDays = Array.from({ length: 7 }, (_, index) =>
    sumOnDay(activities, toDateKey(addDays(previousStart, index))),
  );
  const totalSeconds = days.reduce((sum, day) => sum + day.durationSeconds, 0);
  const previousWeekSeconds = previousDays.reduce((sum, value) => sum + value, 0);

  return {
    days,
    totalSeconds,
    previousWeekSeconds,
    deltaSeconds: previousWeekSeconds > 0 || totalSeconds > 0 ? totalSeconds - previousWeekSeconds : null,
  };
}
