import { toDateKey } from '@/utils/date';
import {
  achievementInRange,
  type RangeAchievement,
} from '@/utils/readingSummary';
import {
  describeDay,
  type GoalPeriod,
  type ReadingActivity,
} from '@/utils/readingPeriod';

export interface MonthReadingStats {
  year: number;
  monthIndex: number;
  startKey: string;
  endKey: string;
  totalDurationSeconds: number;
  readingDayCount: number;
  sessionCount: number;
  /** Sum of known pages_read only. */
  knownPagesSum: number;
  unknownPageSessionCount: number;
  achievement: RangeAchievement;
  completedBookCount: number | null;
}

export function monthBounds(year: number, monthIndex: number): { startKey: string; endKey: string } {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return { startKey: toDateKey(start), endKey: toDateKey(end) };
}

/** Keep selection inside the visible month after month navigation. */
export function selectionForVisibleMonth(
  selectedDate: string,
  year: number,
  monthIndex: number,
  todayKey: string,
): string {
  const { startKey, endKey } = monthBounds(year, monthIndex);
  if (selectedDate >= startKey && selectedDate <= endKey) {
    return selectedDate;
  }
  if (todayKey >= startKey && todayKey <= endKey) {
    return todayKey;
  }
  return startKey;
}

export function monthReadingStats(
  year: number,
  monthIndex: number,
  todayKey: string,
  goals: readonly GoalPeriod[],
  activities: readonly ReadingActivity[],
  books: readonly { completedAt: string | null }[],
): MonthReadingStats {
  const { startKey, endKey } = monthBounds(year, monthIndex);
  const monthActivities = activities.filter(
    (activity) => activity.readOn >= startKey && activity.readOn <= endKey,
  );

  const readingDays = new Set<string>();
  let totalDurationSeconds = 0;
  let knownPagesSum = 0;
  let unknownPageSessionCount = 0;

  for (const activity of monthActivities) {
    readingDays.add(activity.readOn);
    totalDurationSeconds += Number.isFinite(activity.durationSeconds)
      ? Math.max(0, Math.floor(activity.durationSeconds))
      : 0;
    if (activity.pagesRead === null || !Number.isSafeInteger(activity.pagesRead) || activity.pagesRead < 0) {
      unknownPageSessionCount += 1;
    } else {
      knownPagesSum += activity.pagesRead;
    }
  }

  let completedBookCount: number | null = 0;
  let sawCompletedDate = false;
  for (const book of books) {
    if (!book.completedAt) {
      continue;
    }
    sawCompletedDate = true;
    if (book.completedAt >= startKey && book.completedAt <= endKey) {
      completedBookCount += 1;
    }
  }
  if (books.length > 0 && !sawCompletedDate) {
    // Shelf loaded but no completed_on values → cannot attribute completions to the month.
    completedBookCount = null;
  }

  return {
    year,
    monthIndex,
    startKey,
    endKey,
    totalDurationSeconds,
    readingDayCount: readingDays.size,
    sessionCount: monthActivities.length,
    knownPagesSum,
    unknownPageSessionCount,
    achievement: achievementInRange(todayKey, startKey, endKey, goals, activities),
    completedBookCount,
  };
}

export function monthHasAnyReading(
  year: number,
  monthIndex: number,
  activities: readonly ReadingActivity[],
): boolean {
  const { startKey, endKey } = monthBounds(year, monthIndex);
  return activities.some((activity) => activity.readOn >= startKey && activity.readOn <= endKey);
}

export function formatMonthEmptyMessage(year: number, monthIndex: number, todayKey: string): string {
  const { startKey, endKey } = monthBounds(year, monthIndex);
  const [todayYear, todayMonth] = todayKey.split('-').map(Number);
  const isCurrentMonth =
    todayYear === year && (todayMonth ?? 0) - 1 === monthIndex && todayKey >= startKey && todayKey <= endKey;
  if (isCurrentMonth) {
    return '이번 달에는 아직 독서 기록이 없어요.';
  }
  return `${year}년 ${monthIndex + 1}월에는 독서 기록이 없어요.`;
}

/** Day summary for the selected calendar date (client-side filter). */
export function daySessionSummary(
  dateKey: string,
  todayKey: string,
  goals: readonly GoalPeriod[],
  activities: readonly ReadingActivity[],
) {
  const day = describeDay(dateKey, todayKey, goals, activities);
  const sessions = activities
    .filter((activity) => activity.readOn === dateKey)
    .slice()
    .sort((left, right) => {
      const leftStart = left.startedAt ?? '';
      const rightStart = right.startedAt ?? '';
      if (leftStart !== rightStart) {
        return rightStart.localeCompare(leftStart);
      }
      return (right.sessionId ?? '').localeCompare(left.sessionId ?? '');
    });

  return { day, sessions };
}
