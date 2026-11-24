import type { GoalPeriod, ReadingActivity } from './readingPeriod.ts';
import {
  daySessionSummary,
  formatMonthEmptyMessage,
  monthBounds,
  monthHasAnyReading,
  monthReadingStats,
  selectionForVisibleMonth,
} from './recordsMonth.ts';
import { achievementInRange } from './readingSummary.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function goal(overrides: Partial<GoalPeriod> = {}): GoalPeriod {
  return {
    type: 'time',
    targetValue: 30,
    daysOfWeek: [1, 2, 3, 4, 5],
    startsOn: '2026-01-01',
    endsOn: null,
    ...overrides,
  };
}

function activity(overrides: Partial<ReadingActivity> & Pick<ReadingActivity, 'readOn'>): ReadingActivity {
  return {
    durationSeconds: 30 * 60,
    pagesRead: 10,
    bookTitle: '책',
    sessionId: overrides.sessionId ?? `s-${overrides.readOn}`,
    startedAt: overrides.startedAt ?? `${overrides.readOn}T12:00:00.000Z`,
    ...overrides,
  };
}

function run(): void {
  const feb = monthBounds(2024, 1);
  assert(feb.startKey === '2024-02-01' && feb.endKey === '2024-02-29', 'leap February end');
  assert(monthBounds(2023, 1).endKey === '2023-02-28', 'common February end');
  assert(monthBounds(2025, 11).endKey === '2025-12-31', 'December end');

  assert(
    selectionForVisibleMonth('2026-10-15', 2026, 10, '2026-11-24') === '2026-11-24',
    'selection prefers today when navigating into current month',
  );
  assert(
    selectionForVisibleMonth('2026-10-15', 2026, 8, '2026-11-24') === '2026-09-01',
    'selection moves to first day when today is outside month',
  );
  assert(
    selectionForVisibleMonth('2026-11-05', 2026, 10, '2026-11-24') === '2026-11-05',
    'selection kept when already in month',
  );

  const activities = [
    activity({ readOn: '2026-11-03', durationSeconds: 600, pagesRead: 5, startedAt: '2026-11-03T10:00:00.000Z', sessionId: 'a' }),
    activity({ readOn: '2026-11-03', durationSeconds: 900, pagesRead: null, startedAt: '2026-11-03T18:00:00.000Z', sessionId: 'b' }),
    activity({ readOn: '2026-11-10', durationSeconds: 1800, pagesRead: 12, startedAt: '2026-11-10T09:00:00.000Z', sessionId: 'c' }),
    activity({ readOn: '2026-10-31', durationSeconds: 600, pagesRead: 3, sessionId: 'd' }),
  ];

  const stats = monthReadingStats(2026, 10, '2026-11-24', [goal()], activities, [
    { completedAt: '2026-11-10' },
    { completedAt: '2026-10-01' },
    { completedAt: null },
  ]);

  assert(stats.sessionCount === 3, 'November sessions only');
  assert(stats.readingDayCount === 2, 'distinct reading days');
  assert(stats.totalDurationSeconds === 600 + 900 + 1800, 'duration sum');
  assert(stats.knownPagesSum === 17, 'known pages only');
  assert(stats.unknownPageSessionCount === 1, 'one unknown page session');
  assert(stats.completedBookCount === 1, 'completed in November');
  assert(!monthHasAnyReading(2026, 8, activities), 'September empty');
  assert(monthHasAnyReading(2026, 10, activities), 'November has reading');

  const sameRange = achievementInRange('2026-11-24', stats.startKey, stats.endKey, [goal()], activities);
  assert(
    sameRange.rate === stats.achievement.rate &&
      sameRange.achievedCount === stats.achievement.achievedCount,
    'month achievement matches achievementInRange',
  );

  const day = daySessionSummary('2026-11-03', '2026-11-24', [goal()], activities);
  assert(day.sessions.length === 2, 'two sessions on day');
  assert(day.sessions[0]?.sessionId === 'b', 'newest session first');
  assert(day.day.durationSeconds === 1500, 'day duration summed');
  assert(day.day.pagesRead === null, 'unknown page blocks day page total');

  assert(
    formatMonthEmptyMessage(2026, 10, '2026-11-24').includes('이번 달'),
    'current month empty copy',
  );
  assert(
    formatMonthEmptyMessage(2026, 8, '2026-11-24').includes('9월'),
    'past month empty copy',
  );
}

run();
console.log('recordsMonth.test.ts passed');
