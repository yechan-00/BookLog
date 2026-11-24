import { queueResult, recordedCalls, resetFakeSupabase } from '../../utils/testing/fakeSupabase.ts';
import {
  fetchActiveGoal,
  fetchGoalHistory,
  replaceGoal,
  setGoalNotificationsEnabled,
  toGoalPeriod,
  toStoredReadingGoal,
} from './goals.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function rejects(action: () => Promise<unknown>, pattern: RegExp, message: string): Promise<void> {
  try {
    await action();
  } catch (error) {
    assert(error instanceof Error && pattern.test(error.message), `${message} (got: ${String(error)})`);
    return;
  }
  throw new Error(`${message} (did not throw)`);
}

function goalRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'goal-1',
    user_id: 'user-1',
    type: 'time',
    target_value: 30,
    days_of_week: [5, 1, 3],
    reminder_time: '21:30:00',
    notifications_enabled: true,
    starts_on: '2026-11-01',
    ends_on: null,
    created_at: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

function stepsOf(index: number): string[] {
  return (recordedCalls[index]?.steps ?? []).map(([name]) => name);
}

async function run(): Promise<void> {
  // --- row mapping
  const goal = toStoredReadingGoal(goalRow() as never);
  assert(goal.reminderTime === '21:30', 'DB HH:mm:ss becomes HH:mm');
  assert(goal.daysOfWeek.join(',') === '1,3,5', 'weekdays are normalized and sorted');
  assert(goal.endsOn === null && goal.userId === 'user-1', 'ends_on and user id are kept');

  let threw = false;
  try {
    toStoredReadingGoal(goalRow({ type: 'chapters' }) as never);
  } catch {
    threw = true;
  }
  assert(threw, 'unknown goal type is rejected');

  threw = false;
  try {
    toStoredReadingGoal(goalRow({ days_of_week: [] }) as never);
  } catch {
    threw = true;
  }
  assert(threw, 'empty weekdays are rejected');

  const period = toGoalPeriod(goal);
  assert(
    period.type === 'time' && period.targetValue === 30 && period.startsOn === '2026-11-01' && period.endsOn === null,
    'goal period keeps type, target and dates',
  );

  // --- fetchActiveGoal / fetchGoalHistory
  resetFakeSupabase();
  queueResult(null);
  assert((await fetchActiveGoal()) === null, 'no active goal returns null (onboarding needed)');
  assert(recordedCalls[0]?.target === 'from:reading_goals', 'reads reading_goals');

  resetFakeSupabase();
  queueResult([goalRow({ id: 'a' }), goalRow({ id: 'b', ends_on: '2026-11-10' })]);
  const history = await fetchGoalHistory();
  assert(history.length === 2 && history[1]?.endsOn === '2026-11-10', 'history maps every row');

  // --- setGoalNotificationsEnabled: argument order follows main (goalId, enabled)
  resetFakeSupabase();
  queueResult(goalRow({ id: 'goal-9', notifications_enabled: false }));
  const toggled = await setGoalNotificationsEnabled('goal-9', false);
  assert(toggled.notificationsEnabled === false && toggled.id === 'goal-9', 'returns the updated goal');
  const toggleCall = recordedCalls[0];
  assert(toggleCall?.target === 'from:reading_goals', 'updates reading_goals');
  const update = toggleCall.steps.find(([name]) => name === 'update');
  assert(
    JSON.stringify(update?.[1]) === JSON.stringify([{ notifications_enabled: false }]),
    'writes notifications_enabled from the second argument',
  );
  const eq = toggleCall.steps.find(([name]) => name === 'eq');
  assert(JSON.stringify(eq?.[1]) === JSON.stringify(['id', 'goal-9']), 'targets the goal id from the first argument');

  resetFakeSupabase();
  queueResult(null);
  await rejects(() => setGoalNotificationsEnabled('missing', true), /활성 목표가 없어/, 'missing goal is reported');

  // --- replaceGoal
  resetFakeSupabase();
  queueResult(goalRow());
  const saved = await replaceGoal({
    type: 'time',
    targetValue: 30,
    daysOfWeek: [5, 1, 3, 1],
    reminderTime: '21:30',
    today: '2026-11-24',
  });
  assert(saved.id === 'goal-1', 'returns the saved goal');
  assert(recordedCalls.length === 1 && recordedCalls[0]?.target === 'rpc:replace_goal', 'one replace_goal RPC, no extra write');
  const rpcArgs = recordedCalls[0]?.steps[0]?.[1][0] as Record<string, unknown>;
  assert(rpcArgs.p_type === 'time' && rpcArgs.p_target_value === 30, 'RPC receives type and target');
  assert(JSON.stringify(rpcArgs.p_days_of_week) === JSON.stringify([1, 3, 5]), 'RPC receives normalized weekdays');
  assert(rpcArgs.p_reminder_time === '21:30' && rpcArgs.p_today === '2026-11-24', 'RPC receives reminder and device date');

  // notifications flag differs from the RPC result -> one follow-up update
  resetFakeSupabase();
  queueResult(goalRow({ notifications_enabled: true }));
  queueResult(goalRow({ notifications_enabled: false }));
  const withToggle = await replaceGoal({
    type: 'pages',
    targetValue: 20,
    daysOfWeek: [1],
    reminderTime: '07:00',
    today: '2026-11-24',
    notificationsEnabled: false,
  });
  assert(withToggle.notificationsEnabled === false, 'follow-up update result is returned');
  assert(recordedCalls.length === 2 && stepsOf(1).includes('update'), 'a second call updates notifications_enabled');
  const followUp = recordedCalls[1]?.steps ?? [];
  assert(
    JSON.stringify(followUp.find(([name]) => name === 'update')?.[1]) === JSON.stringify([{ notifications_enabled: false }]),
    'the follow-up writes the requested flag',
  );
  assert(
    JSON.stringify(followUp.find(([name]) => name === 'eq')?.[1]) === JSON.stringify(['id', 'goal-1']),
    'the follow-up targets the goal returned by replace_goal',
  );

  // same flag -> no follow-up
  resetFakeSupabase();
  queueResult(goalRow({ notifications_enabled: true }));
  await replaceGoal({
    type: 'time',
    targetValue: 30,
    daysOfWeek: [1],
    reminderTime: '21:00',
    today: '2026-11-24',
    notificationsEnabled: true,
  });
  assert(recordedCalls.length === 1, 'no follow-up update when the flag already matches');

  // invalid input never reaches the server
  resetFakeSupabase();
  await rejects(
    () => replaceGoal({ type: 'time', targetValue: 0, daysOfWeek: [1], reminderTime: '21:00' }),
    /목표량/,
    'zero target is rejected',
  );
  await rejects(
    () => replaceGoal({ type: 'time', targetValue: 10, daysOfWeek: [], reminderTime: '21:00' }),
    /요일/,
    'empty weekdays are rejected',
  );
  await rejects(
    () => replaceGoal({ type: 'time', targetValue: 10, daysOfWeek: [1], reminderTime: '25:00' }),
    /HH:mm/,
    'bad reminder time is rejected',
  );
  await rejects(
    () => replaceGoal({ type: 'time', targetValue: 10, daysOfWeek: [1], reminderTime: '21:00', today: '24-11-2026' }),
    /날짜 형식/,
    'bad date is rejected',
  );
  assert(recordedCalls.length === 0, 'invalid input makes no server call');

  // missing RPC gets a friendly message
  resetFakeSupabase();
  queueResult(null, { message: 'Could not find the function public.replace_goal', code: 'PGRST202' });
  await rejects(
    () => replaceGoal({ type: 'time', targetValue: 10, daysOfWeek: [1], reminderTime: '21:00', today: '2026-11-24' }),
    /서버 목표 API가 준비되지 않았습니다/,
    'missing RPC is reported clearly',
  );
}

await run();
console.log('goals.test.ts passed');
