import {
  shiftDateKey,
  type DayAchievement,
  type ReadingActivity,
  type ReadingHistory,
} from '@/utils/readingPeriod';
import {
  achievementInRange,
  periodReading,
  type PeriodReading,
  type RangeAchievement,
} from '@/utils/readingSummary';
import { bestReadingStreak, readingStreak, type ReadingStreak } from '@/utils/readingStreak';
import { weeklyAchievement, type WeeklyAchievement } from '@/utils/weeklyAchievement';

export type InsightRangeDays = 7 | 30;

export interface RecentReadingDay {
  dateKey: string;
  monthDay: string;
  weekday: string;
  hasReading: boolean;
  isToday: boolean;
}

export interface InsightDashboard {
  dayCount: InsightRangeDays;
  period: PeriodReading;
  achievement: RangeAchievement;
  priorAchievement: RangeAchievement;
  rateDeltaPoints: number | null;
  streak: ReadingStreak;
  bestStreak: ReadingStreak;
  week: WeeklyAchievement;
  recentDays: RecentReadingDay[];
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function insightDashboard(
  todayKey: string,
  dayCount: InsightRangeDays,
  history: ReadingHistory,
): InsightDashboard {
  const periodEnd = todayKey;
  const periodStart = shiftDateKey(todayKey, -(dayCount - 1));
  const priorEnd = shiftDateKey(periodStart, -1);
  const priorStart = shiftDateKey(priorEnd, -(dayCount - 1));

  const achievement = achievementInRange(
    todayKey,
    periodStart,
    periodEnd,
    history.goals,
    history.activities,
  );
  const priorAchievement = achievementInRange(
    todayKey,
    priorStart,
    priorEnd,
    history.goals,
    history.activities,
  );

  return {
    dayCount,
    period: periodReading(todayKey, dayCount, history.activities),
    achievement,
    priorAchievement,
    rateDeltaPoints:
      achievement.rate === null || priorAchievement.rate === null
        ? null
        : achievement.rate - priorAchievement.rate,
    streak: readingStreak(todayKey, history.goals, history.activities),
    bestStreak: bestReadingStreak(todayKey, history.goals, history.activities),
    week: weeklyAchievement(todayKey, history.goals, history.activities),
    recentDays: recentReadingDays(todayKey, 7, history.activities),
  };
}

export function recentReadingDays(
  todayKey: string,
  dayCount: number,
  activities: readonly ReadingActivity[],
): RecentReadingDay[] {
  const count = Math.max(1, dayCount);
  const days: RecentReadingDay[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const dateKey = shiftDateKey(todayKey, -offset);
    const [, month, day] = dateKey.split('-');
    const weekdayIndex = new Date(`${dateKey}T12:00:00`).getDay();
    const hasReading = activities.some((activity) => activity.readOn === dateKey);
    days.push({
      dateKey,
      monthDay: `${Number(month)}/${Number(day)}`,
      weekday: WEEKDAY_LABELS[weekdayIndex] ?? '',
      hasReading,
      isToday: dateKey === todayKey,
    });
  }
  return days;
}

export function achievementMessage(rate: number | null, hasReading: boolean): string {
  if (rate === null && !hasReading) {
    return '첫 독서 기록을 시작해 보세요.';
  }
  if (rate === null) {
    return '목표 요일의 결과가 쌓이면 달성률을 보여 드릴게요.';
  }
  if (rate >= 100) {
    return '목표를 모두 달성했어요.';
  }
  if (rate >= 60) {
    return '꾸준히 읽는 지금의 흐름이 좋아요.';
  }
  return '작은 목표부터 다시 시작해 보세요.';
}

export function formatLongDuration(totalSeconds: number): string {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

export function formatReminderDisplay(hhmm: string | null): string {
  if (!hhmm) {
    return '시간 미설정';
  }
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) {
    return hhmm;
  }
  const hour = Number(match[1]);
  const minute = match[2];
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${displayHour}:${minute}`;
}

export function weekAchievedLabel(week: WeeklyAchievement): string {
  const scheduled = week.days.filter((day) =>
    isScheduledAchievement(day.achievement),
  ).length;
  if (scheduled === 0) {
    return '이번 주 목표 요일 없음';
  }
  return `${week.achievedCount}/${scheduled}일 달성`;
}

function isScheduledAchievement(achievement: DayAchievement): boolean {
  return (
    achievement === 'achieved' ||
    achievement === 'missed' ||
    achievement === 'pending' ||
    achievement === 'upcoming' ||
    achievement === 'unknown'
  );
}

export function completedBooksInRange(
  todayKey: string,
  dayCount: number,
  books: readonly { completedAt: string | null }[],
): number | null {
  const start = shiftDateKey(todayKey, -(dayCount - 1));
  let count = 0;
  let known = false;
  for (const book of books) {
    if (!book.completedAt) {
      continue;
    }
    known = true;
    if (book.completedAt >= start && book.completedAt <= todayKey) {
      count += 1;
    }
  }
  return known || books.length === 0 ? count : null;
}
