import { getMonthGrid, shiftMonth } from './calendar.ts';
import { toDateKey } from './date.ts';
import { buildMonthMarks } from './readingCalendar.ts';
import { describeDay, type GoalPeriod, type ReadingActivity } from './readingPeriod.ts';
import { readingStreak } from './readingStreak.ts';
import {
  homeReadingSummary,
  insightReadingSummary,
  periodReading,
  todayGoalProgress,
} from './readingSummary.ts';
import { weeklyAchievement } from './weeklyAchievement.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function goal(overrides: Partial<GoalPeriod> = {}): GoalPeriod {
  return {
    type: 'pages',
    targetValue: 10,
    daysOfWeek: [1, 2, 3, 4, 5],
    startsOn: '2026-01-01',
    endsOn: null,
    ...overrides,
  };
}

function read(readOn: string, pagesRead: number | null, durationSeconds = 0): ReadingActivity {
  return { readOn, durationSeconds, pagesRead, bookTitle: '책' };
}

function runCalendarChecks(): void {
  assert(toDateKey(shiftMonth(new Date(2026, 0, 31), -1)) === '2025-12-01', 'January goes to previous December');
  assert(toDateKey(shiftMonth(new Date(2026, 11, 1), 1)) === '2027-01-01', 'December goes to next January');
  assert(toDateKey(shiftMonth(new Date(2026, 2, 31), -1)) === '2026-02-01', 'day 31 does not skip February');

  const leap = getMonthGrid(2024, 1);
  const leapDays = leap.filter((cell) => cell.dateKey);
  assert(leapDays.length === 29, 'leap February has 29 days');
  assert(leapDays.some((cell) => cell.dateKey === '2024-02-29'), 'leap day exists');
  assert(leap[0]?.dateKey === null && leap[4]?.dateKey === '2024-02-01', 'February 2024 starts on Thursday');

  const common = getMonthGrid(2023, 1).filter((cell) => cell.dateKey);
  assert(common.length === 28 && !common.some((cell) => cell.dateKey === '2023-02-29'), 'common February has 28 days');

  const november = getMonthGrid(2026, 10);
  assert(november[0]?.dateKey === '2026-11-01', 'November 2026 starts on Sunday');
  assert(november.length % 7 === 0, 'month grid fills weeks');

  const future = describeDay('2026-11-12', '2026-11-10', [goal()], []);
  assert(future.isFuture && future.achievement === 'upcoming', 'future goal day is not a miss');
  const futureMonth = buildMonthMarks(2026, 11, '2026-11-10', [goal()], []);
  assert(futureMonth['2026-12-01']?.achievement === 'upcoming', 'next month is not a miss');
  assert(futureMonth['2026-12-06']?.achievement === 'off', 'Sunday stays outside the goal');
}

function runAchievementChecks(): void {
  const today = '2026-11-15';
  const threeOfFive = weeklyAchievement(today, [goal()], [
    read('2026-11-09', 10),
    read('2026-11-10', 6),
    read('2026-11-10', 4),
    read('2026-11-11', 10),
  ]);
  assert(threeOfFive.achievedCount === 3 && threeOfFive.decidedCount === 5, 'three of five goal days');
  assert(threeOfFive.rate === 60, 'three of five is 60 percent');

  const noGoal = weeklyAchievement(today, [], [read('2026-11-10', 30)]);
  assert(noGoal.rate === null && noGoal.decidedCount === 0, 'no goal has no rate');

  const emptyWeekdays = weeklyAchievement(today, [goal({ daysOfWeek: [] })], [read('2026-11-10', 30)]);
  assert(emptyWeekdays.rate === null, 'empty weekdays are not evaluated');

  const current = weeklyAchievement('2026-11-10', [goal()], [read('2026-11-09', 10)]);
  assert(current.achievedCount === 1 && current.decidedCount === 1 && current.rate === 100, 'future days stay out');
  assert(current.days.find((day) => day.dateKey === '2026-11-10')?.achievement === 'pending', 'today is still open');
  assert(
    current.days.filter((day) => day.achievement === 'upcoming').length === 3,
    'Wednesday through Friday are upcoming',
  );

  const doubled = weeklyAchievement('2026-11-09', [goal()], [read('2026-11-09', 4), read('2026-11-09', 6)]);
  assert(doubled.achievedCount === 1 && doubled.decidedCount === 1, 'same-day sessions count once');

  const timeGoal = goal({ type: 'time', targetValue: 30, daysOfWeek: [1] });
  const timeMet = weeklyAchievement('2026-11-10', [timeGoal], [
    read('2026-11-09', null, 600),
    read('2026-11-09', null, 1200),
  ]);
  assert(timeMet.days.find((day) => day.dateKey === '2026-11-09')?.achievement === 'achieved', 'minutes are summed');

  const timeMissed = weeklyAchievement('2026-11-10', [timeGoal], [read('2026-11-09', null, 600)]);
  assert(timeMissed.days.find((day) => day.dateKey === '2026-11-09')?.achievement === 'missed', 'short time goal misses');

  const pagesUnknown = describeDay('2026-11-09', '2026-11-10', [goal()], [read('2026-11-09', null)]);
  assert(pagesUnknown.achievement === 'unknown', 'missing pages are not guessed');
}

function runStreakChecks(): void {
  const weekdayGoal = goal();
  const kept = readingStreak('2026-11-16', [weekdayGoal], [
    read('2026-11-12', 1),
    read('2026-11-13', 10),
    read('2026-11-16', 10),
  ]);
  assert(kept.days === 2, 'weekend does not break a weekday streak');

  const broken = readingStreak('2026-11-17', [weekdayGoal], [read('2026-11-13', 10)]);
  assert(broken.days === 0, 'a missed Monday ends the streak');

  const todayOpen = readingStreak('2026-11-10', [weekdayGoal], [
    read('2026-11-05', 1),
    read('2026-11-06', 10),
    read('2026-11-09', 10),
  ]);
  assert(todayOpen.days === 2, 'an unfinished today does not end the streak');

  const changed = readingStreak('2026-11-17', [
    goal({ endsOn: '2026-11-16', targetValue: 10 }),
    goal({ startsOn: '2026-11-16', targetValue: 100 }),
  ], [read('2026-11-13', 15), read('2026-11-16', 15)]);
  assert(changed.days === 0, 'the change day uses the new target');

  const changedKeepsFriday = readingStreak('2026-11-16', [
    goal({ endsOn: '2026-11-16', daysOfWeek: [1, 2, 3, 4, 5] }),
    goal({ startsOn: '2026-11-16', daysOfWeek: [1, 2, 3, 4, 5], targetValue: 10 }),
  ], [read('2026-11-13', 10), read('2026-11-16', 10)]);
  assert(changedKeepsFriday.days === 2, 'the previous goal still scores its own days');

  const year = readingStreak('2026-01-01', [goal({ daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startsOn: '2025-12-01' })], [
    read('2025-12-30', 1),
    read('2025-12-31', 10),
    read('2026-01-01', 10),
  ]);
  assert(year.days === 2, 'the streak crosses the year');

  assert(readingStreak('2026-11-10', [], []).days === 0, 'no goal means no streak');
}

function runHomeInsightChecks(): void {
  const tuesday = '2026-11-10';
  const timeGoal = goal({ type: 'time', targetValue: 30, daysOfWeek: [2] });
  const halfway = todayGoalProgress(tuesday, [timeGoal], [read(tuesday, null, 15 * 60)]);
  assert(halfway.state === 'in_progress' && halfway.percent === 50, '15 of 30 minutes');
  assert(halfway.remainingSeconds === 15 * 60 && halfway.readSeconds === 15 * 60, 'remaining time stays in seconds');

  const pageGoal = goal({ type: 'pages', targetValue: 20, daysOfWeek: [2] });
  const pages = todayGoalProgress(tuesday, [pageGoal], [read(tuesday, 8, 60)]);
  assert(pages.state === 'in_progress' && pages.readPages === 8 && pages.remainingPages === 12, '8 of 20 pages');

  const extra = todayGoalProgress(tuesday, [pageGoal], [read(tuesday, 25, 60)]);
  assert(extra.state === 'achieved' && extra.readPages === 25 && extra.percent === 100, 'extra pages stay visible');
  assert(extra.remainingPages === 0 && extra.ratio === 1.25, 'progress bar caps while the ratio does not');

  const noGoal = todayGoalProgress(tuesday, [], [read(tuesday, 8, 60)]);
  assert(noGoal.state === 'no_goal', 'reading without a goal is not a miss');

  const rest = todayGoalProgress('2026-11-15', [pageGoal], [read('2026-11-15', 8, 60)]);
  assert(rest.state === 'rest', 'Sunday is a rest day');

  const split = todayGoalProgress(tuesday, [timeGoal], [read(tuesday, null, 300), read(tuesday, null, 600)]);
  assert(split.state === 'in_progress' && split.readSeconds === 900, 'sessions on the same day are summed');

  const missing = todayGoalProgress(tuesday, [pageGoal], [read(tuesday, null, 60)]);
  assert(missing.state === 'unknown' && missing.readPages === null, 'missing pages are not zero');
  const invalid = todayGoalProgress(tuesday, [pageGoal], [read(tuesday, -1, 60)]);
  assert(invalid.state === 'unknown', 'invalid page counts are not zero');

  const changed = todayGoalProgress(tuesday, [
    goal({ type: 'pages', targetValue: 5, daysOfWeek: [2], endsOn: tuesday }),
    goal({ type: 'pages', targetValue: 20, daysOfWeek: [2], startsOn: tuesday }),
  ], [read(tuesday, 8, 60)]);
  assert(changed.state === 'in_progress' && changed.targetPages === 20, 'the change day uses the new target');

  const week = periodReading('2026-03-01', 7, [read('2026-02-23', 7, 70 * 60)]);
  assert(week.dayCount === 7 && week.days[0]?.dateKey === '2026-02-23', 'seven days cross into February');
  assert(week.readingDayCount === 1 && week.averageDurationSeconds === 600, 'average uses every day in the range');

  const month = periodReading('2026-01-15', 30, [read('2025-12-17', 3, 30 * 60)]);
  assert(month.dayCount === 30 && month.days[0]?.dateKey === '2025-12-17', 'thirty days cross the year');
  assert(month.totalPages === 3, 'stored pages are summed');

  const empty = periodReading(tuesday, 7, []);
  assert(empty.readingDayCount === 0 && empty.totalDurationSeconds === 0 && empty.totalPages === 0, 'no sessions stay empty');

  const gap = periodReading(tuesday, 7, [read('2026-11-09', null, 60), read(tuesday, 4, 60)]);
  assert(gap.totalPages === null && gap.days.some((day) => day.pagesRead === null), 'one missing page blocks the total');

  const history = {
    goals: [goal({ daysOfWeek: [1, 2, 3, 4, 5] })],
    activities: [read('2026-11-13', 10, 60), read('2026-11-16', 10, 60)],
  };
  const home = homeReadingSummary('2026-11-16', history);
  const insight = insightReadingSummary('2026-11-16', 7, history);
  const streak = readingStreak('2026-11-16', history.goals, history.activities).days;
  assert(home.streak.days === streak && insight.streak.days === streak, 'home and insights reuse the streak');
}

function runReadingStatsChecks(): void {
  runCalendarChecks();
  runAchievementChecks();
  runStreakChecks();
  runHomeInsightChecks();
}

runReadingStatsChecks();
