import {
  decideGoalReached,
  engagementLogCandidates,
  formatLocalDate,
  planEngagementReminders,
} from './schedulePlan.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function runSchedulePlanChecks(): void {
  assert(decideGoalReached({ goalType: 'pages', targetMinutes: 20, elapsedMinutes: 0 }).action === 'skip', 'pages');
  const scheduled = decideGoalReached({ goalType: 'time', targetMinutes: 30, elapsedMinutes: 10 });
  assert(scheduled.action === 'schedule' && scheduled.seconds === 1200, 'remaining 20 minutes');
  assert(
    decideGoalReached({ goalType: 'time', targetMinutes: 30, elapsedMinutes: 30 }).action === 'skip',
    'already met',
  );
  assert(
    decideGoalReached({ goalType: 'time', targetMinutes: 0, elapsedMinutes: 0 }).action === 'skip',
    'invalid target',
  );
  assert(
    decideGoalReached({ goalType: 'time', targetMinutes: 30, elapsedMinutes: -1 }).action === 'skip',
    'negative elapsed',
  );

  const tuesdayMorning = new Date(2026, 10, 10, 8, 0, 0, 0);
  const laterToday = planEngagementReminders({
    daysOfWeek: [2, 2],
    reminderTime: '09:00:00',
    enabled: true,
    achievedDates: [],
    now: tuesdayMorning,
    horizonDays: 8,
  });
  assert(laterToday.length === 2, 'today and next Tuesday');
  assert(formatLocalDate(laterToday[0].fireAt) === '2026-11-10', 'local today');
  assert(laterToday[0].fireAt.getHours() === 9 && laterToday[0].fireAt.getMinutes() === 0, 'local time');
  assert(formatLocalDate(laterToday[1].fireAt) === '2026-11-17', 'next week');

  const afterReminder = planEngagementReminders({
    daysOfWeek: [2],
    reminderTime: '09:00',
    enabled: true,
    achievedDates: ['2026-11-17'],
    now: new Date(2026, 10, 10, 10, 0, 0, 0),
    horizonDays: 8,
  });
  assert(afterReminder.length === 0, 'past today and achieved next Tuesday');

  const sundayOnly = planEngagementReminders({
    daysOfWeek: [0],
    reminderTime: '21:30',
    enabled: true,
    achievedDates: [],
    now: tuesdayMorning,
    horizonDays: 7,
  });
  assert(sundayOnly.length === 1 && formatLocalDate(sundayOnly[0].fireAt) === '2026-11-15', 'Sunday only');

  const midnight = planEngagementReminders({
    daysOfWeek: [2],
    reminderTime: '00:00',
    enabled: true,
    achievedDates: [],
    now: new Date(2026, 10, 10, 0, 30, 0, 0),
    horizonDays: 14,
  });
  assert(midnight.length === 1 && formatLocalDate(midnight[0].fireAt) === '2026-11-17', 'past midnight rolls forward');

  assert(
    planEngagementReminders({
      daysOfWeek: [1, 2, 3],
      reminderTime: '09:00',
      enabled: false,
      achievedDates: [],
      now: tuesdayMorning,
    }).length === 0,
    'disabled',
  );
  assert(
    planEngagementReminders({
      daysOfWeek: [2],
      reminderTime: '9:00',
      enabled: true,
      achievedDates: [],
      now: tuesdayMorning,
    }).length === 0,
    'invalid time',
  );

  const past = new Date(2026, 10, 10, 9, 0, 0, 0);
  const candidates = engagementLogCandidates({
    goalId: 'goal-1',
    planned: [{ identifier: 'booklog.engagement.2026-11-10', localDate: '2026-11-10', fireAt: past }],
    now: new Date(2026, 10, 10, 9, 5, 0, 0),
  });
  assert(candidates.length === 1 && candidates[0].deliveryConfirmed === false, 'past time is not delivery');
}

runSchedulePlanChecks();
