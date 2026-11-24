import { queueResult, recordedCalls, resetFakeSupabase } from '../../utils/testing/fakeSupabase.ts';
import { bridgeCalls, resetFakeBridge, setBridgeBehavior } from '../../utils/testing/fakeGoalReachedBridge.ts';
import { resetFakeNotifications, setSyncBehavior, syncCalls } from '../../utils/testing/fakeNotifications.ts';
import { armGoalReached } from './goalReached.ts';
import { refreshEngagementReminder } from './reminders.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function goalRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'goal-1',
    user_id: 'user-1',
    type: 'time',
    target_value: 30,
    days_of_week: [1, 3, 5],
    reminder_time: '21:30:00',
    notifications_enabled: true,
    starts_on: '2026-11-01',
    ends_on: null,
    created_at: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

function reset(): void {
  resetFakeSupabase();
  resetFakeNotifications();
  resetFakeBridge();
}

async function runReminders(): Promise<void> {
  // the saved goal is handed to the notification module
  reset();
  queueResult(goalRow());
  setSyncBehavior({ result: { status: 'synced', scheduled: [], cancelledIds: ['old'] } });
  const synced = await refreshEngagementReminder();
  assert(synced.status === 'synced' && synced.cancelledIds[0] === 'old', 'the module result is returned as is');
  assert(syncCalls.length === 1, 'the module is asked to sync once');
  const goal = syncCalls[0];
  assert(goal?.id === 'goal-1' && goal.reminderTime === '21:30' && goal.notificationsEnabled, 'it receives the mapped goal');

  // no goal yet: the module is asked to clear reminders
  reset();
  queueResult(null);
  await refreshEngagementReminder();
  assert(syncCalls.length === 1 && syncCalls[0] === null, 'without a goal the reminders are cleared');

  // a failed goal lookup never throws and never schedules
  reset();
  queueResult(null, { message: 'network down' });
  const lookupFailed = await refreshEngagementReminder();
  assert(lookupFailed.status === 'failed' && lookupFailed.reason === 'network down', 'a lookup failure becomes a failed result');
  assert(syncCalls.length === 0, 'nothing is scheduled after a failed lookup');

  // a failing notification module never throws either
  reset();
  queueResult(goalRow());
  setSyncBehavior({ error: new Error('scheduler exploded') });
  const syncFailed = await refreshEngagementReminder();
  assert(syncFailed.status === 'failed' && syncFailed.reason === 'scheduler exploded', 'a module failure becomes a failed result');
  assert(recordedCalls.length === 1, 'the goal was only fetched once');
}

async function runGoalReached(): Promise<void> {
  // elapsed time comes from the session start
  reset();
  const startedAt = new Date(Date.now() - 90_000).toISOString();
  await armGoalReached(startedAt);
  assert(bridgeCalls.length === 1, 'the bridge is called once');
  assert(bridgeCalls[0] >= 89 && bridgeCalls[0] <= 95, `elapsed seconds follow the start time (got ${bridgeCalls[0]})`);

  // a start time in the future cannot give negative time
  reset();
  await armGoalReached(new Date(Date.now() + 60_000).toISOString());
  assert(bridgeCalls[0] === 0, 'a future start counts as zero elapsed');

  // a broken start time must not reach the scheduler as NaN
  reset();
  await armGoalReached('not-a-date');
  assert(bridgeCalls.length === 1 && Number.isFinite(bridgeCalls[0]), 'an invalid start time is treated as zero, not NaN');

  // the bridge result passes through, and its failure never throws
  reset();
  setBridgeBehavior({ result: { status: 'skipped', reason: 'already_achieved' } });
  const skipped = await armGoalReached(new Date().toISOString());
  assert(skipped.status === 'skipped' && skipped.reason === 'already_achieved', 'the bridge result is returned');

  reset();
  setBridgeBehavior({ error: new Error('permission lost') });
  const failed = await armGoalReached(new Date().toISOString());
  assert(failed.status === 'failed' && failed.reason === 'permission lost', 'a bridge failure becomes a failed result');
}

await runReminders();
await runGoalReached();
console.log('reading.test.ts passed');
