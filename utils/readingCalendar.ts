import { getMonthGrid } from '@/utils/calendar';
import { describeDay, type DayAchievement, type GoalPeriod, type ReadingActivity } from '@/utils/readingPeriod';

export interface CalendarDayMark {
  hasReading: boolean;
  achievement: DayAchievement;
}

export function buildMonthMarks(
  year: number,
  monthIndex: number,
  todayKey: string,
  goals: readonly GoalPeriod[],
  activities: readonly ReadingActivity[],
): Record<string, CalendarDayMark> {
  const marks: Record<string, CalendarDayMark> = {};

  for (const cell of getMonthGrid(year, monthIndex)) {
    if (!cell.dateKey) {
      continue;
    }

    const day = describeDay(cell.dateKey, todayKey, goals, activities);
    marks[cell.dateKey] = {
      hasReading: day.hasReading,
      achievement: day.achievement,
    };
  }

  return marks;
}
