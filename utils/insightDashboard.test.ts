import type { GoalPeriod, ReadingActivity, ReadingHistory } from './readingPeriod.ts';
import { bestReadingStreak } from './readingStreak.ts';
import {
  completedBooksInRange,
  formatLongDuration,
  formatReminderDisplay,
  insightDashboard,
} from './insightDashboard.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function run(): void {
  const goals: GoalPeriod[] = [
    {
      type: 'time',
      targetValue: 15,
      daysOfWeek: [1, 2, 3, 4, 5],
      startsOn: '2026-11-01',
      endsOn: null,
    },
  ];
  const activities: ReadingActivity[] = [
    { readOn: '2026-11-20', durationSeconds: 20 * 60, pagesRead: 10, bookTitle: 'A' },
    { readOn: '2026-11-21', durationSeconds: 20 * 60, pagesRead: 10, bookTitle: 'A' },
    { readOn: '2026-11-24', durationSeconds: 30 * 60, pagesRead: 12, bookTitle: 'A' },
  ];
  const history: ReadingHistory = { goals, activities };

  const dashboard = insightDashboard('2026-11-24', 7, history);
  assert(dashboard.period.readingDayCount === 3, 'period reading days');
  assert(dashboard.recentDays.length === 7, 'recent 7 days');
  assert(dashboard.recentDays[6]?.isToday === true, 'last recent day is today');
  assert(formatLongDuration(40 * 60) === '40분', 'under one hour');
  assert(formatLongDuration(12 * 3600 + 40 * 60) === '12시간 40분', 'hours and minutes');
  assert(formatReminderDisplay('21:00') === '오후 9:00', 'pm reminder');
  assert(formatReminderDisplay('09:05') === '오전 9:05', 'am reminder');
  assert(completedBooksInRange('2026-11-24', 30, [{ completedAt: '2026-11-10' }, { completedAt: null }]) === 1, 'completed in range');
  assert(bestReadingStreak('2026-11-24', goals, activities).days >= dashboard.streak.days, 'best >= current');
}

run();
console.log('insightDashboard.test.ts passed');
