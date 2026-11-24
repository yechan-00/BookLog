import type { StoredReadingGoal } from '../types/goal.ts';
import type { GoalPeriod, ReadingActivity } from './readingPeriod.ts';
import type { TodayGoalProgress } from './readingSummary.ts';
import {
  buildGoalReachedInput,
  engagementInputFromGoal,
  listAchievedDateKeys,
  pageGoalFinishMessage,
  remainingMinutesForGoalReached,
} from './notificationGoals.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function sampleGoal(overrides: Partial<StoredReadingGoal> = {}): StoredReadingGoal {
  return {
    id: 'goal-1',
    userId: 'user-1',
    type: 'time',
    targetValue: 30,
    daysOfWeek: [1, 2, 3, 4, 5],
    reminderTime: '21:30',
    notificationsEnabled: true,
    startsOn: '2026-11-01',
    endsOn: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

function progress(overrides: Partial<TodayGoalProgress>): TodayGoalProgress {
  return {
    state: 'in_progress',
    goalType: 'time',
    readSeconds: 0,
    targetSeconds: 30 * 60,
    remainingSeconds: 30 * 60,
    readPages: null,
    targetPages: null,
    remainingPages: null,
    ratio: 0,
    percent: 0,
    ...overrides,
  };
}

function run(): void {
  const engagement = engagementInputFromGoal(sampleGoal());
  assert(engagement?.enabled === true && engagement.reminderTime === '21:30', 'engagement maps');
  assert(engagementInputFromGoal(sampleGoal({ reminderTime: null })) === null, 'missing reminder');

  const remaining = remainingMinutesForGoalReached({
    progress: progress({ readSeconds: 20 * 60 }),
    notificationsEnabled: true,
    sessionElapsedSeconds: 0,
  });
  assert(remaining === 10, 'remaining excludes prior only when session is 0');

  const midSession = remainingMinutesForGoalReached({
    progress: progress({ readSeconds: 20 * 60 }),
    notificationsEnabled: true,
    sessionElapsedSeconds: 5 * 60,
  });
  assert(midSession === 5, 'remaining subtracts current session');

  assert(
    remainingMinutesForGoalReached({
      progress: progress({ readSeconds: 20 * 60 }),
      notificationsEnabled: false,
      sessionElapsedSeconds: 0,
    }) === null,
    'disabled notifications skip',
  );

  assert(
    remainingMinutesForGoalReached({
      progress: progress({ state: 'achieved', readSeconds: 40 * 60, remainingSeconds: 0 }),
      notificationsEnabled: true,
      sessionElapsedSeconds: 0,
    }) === null,
    'already achieved skips',
  );

  assert(
    remainingMinutesForGoalReached({
      progress: progress({ state: 'rest', goalType: null, targetSeconds: null }),
      notificationsEnabled: true,
      sessionElapsedSeconds: 0,
    }) === null,
    'rest day skips',
  );

  assert(
    remainingMinutesForGoalReached({
      progress: progress({
        goalType: 'pages',
        targetSeconds: null,
        targetPages: 20,
        readPages: 5,
        remainingPages: 15,
      }),
      notificationsEnabled: true,
      sessionElapsedSeconds: 600,
    }) === null,
    'page goals are not timed',
  );

  const schedule = buildGoalReachedInput({
    goalId: 'goal-1',
    progress: progress({ readSeconds: 20 * 60 }),
    notificationsEnabled: true,
    sessionElapsedSeconds: 0,
  });
  assert(
    schedule != null && schedule.targetMinutes === 30 && schedule.elapsedMinutes === 20,
    'schedule uses prior minutes only when session is 0',
  );

  const goals: GoalPeriod[] = [
    {
      type: 'time',
      targetValue: 15,
      daysOfWeek: [2],
      startsOn: '2026-11-01',
      endsOn: null,
    },
  ];
  const activities: ReadingActivity[] = [
    { readOn: '2026-11-10', durationSeconds: 15 * 60, pagesRead: null, bookTitle: 'A' },
  ];
  const achieved = listAchievedDateKeys({
    todayKey: '2026-11-10',
    goals,
    activities,
    horizonDays: 3,
  });
  assert(achieved.includes('2026-11-10'), 'today achieved is listed');

  assert(
    pageGoalFinishMessage({
      progressBefore: progress({
        goalType: 'pages',
        targetSeconds: null,
        targetPages: 20,
        readPages: 12,
        remainingPages: 8,
        state: 'in_progress',
      }),
      pagesReadThisSession: 10,
    })?.includes('도달') === true,
    'page goal reached message',
  );

  assert(
    pageGoalFinishMessage({
      progressBefore: progress({
        goalType: 'pages',
        targetSeconds: null,
        targetPages: 20,
        readPages: 5,
        remainingPages: 15,
        state: 'in_progress',
      }),
      pagesReadThisSession: 3,
    })?.includes('12페이지') === true,
    'page goal remaining message',
  );

  assert(
    pageGoalFinishMessage({
      progressBefore: progress({ goalType: 'time' }),
      pagesReadThisSession: 5,
    }) === null,
    'time goal has no page finish message',
  );
}

run();
console.log('notificationGoals.test.ts passed');
