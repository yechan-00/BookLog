import { toError } from '@/lib/api/errors';
import { normalizeWeekdays } from '@/lib/notifications/schedulePlan';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { GoalType, ReplaceGoalInput, StoredReadingGoal } from '@/types/goal';
import { startOfToday, toDateKey } from '@/utils/date';
import { GOAL_TARGET_MAX, normalizeReminderTime } from '@/utils/goalForm';
import type { GoalPeriod } from '@/utils/readingPeriod';

export { GOAL_TARGET_MAX, normalizeReminderTime } from '@/utils/goalForm';

type GoalRow = Database['public']['Tables']['reading_goals']['Row'];

const GOAL_SELECT =
  'id, user_id, type, target_value, days_of_week, reminder_time, notifications_enabled, starts_on, ends_on, created_at';

function isGoalType(value: string): value is GoalType {
  return value === 'time' || value === 'pages';
}

function requireAuthSession(): Promise<void> {
  return supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      throw toError(error);
    }

    if (!data.session) {
      throw new Error('로그인이 필요합니다.');
    }
  });
}

export function toStoredReadingGoal(row: GoalRow): StoredReadingGoal {
  if (!isGoalType(row.type)) {
    throw new Error(`알 수 없는 목표 유형입니다: ${row.type}`);
  }

  if (!Array.isArray(row.days_of_week) || row.days_of_week.length === 0) {
    throw new Error('목표 요일이 비어 있습니다.');
  }

  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    targetValue: row.target_value,
    daysOfWeek: normalizeWeekdays(row.days_of_week),
    reminderTime: normalizeReminderTime(row.reminder_time),
    notificationsEnabled: row.notifications_enabled,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    createdAt: row.created_at,
  };
}

export function toGoalPeriod(goal: StoredReadingGoal): GoalPeriod {
  return {
    type: goal.type,
    targetValue: goal.targetValue,
    daysOfWeek: goal.daysOfWeek,
    startsOn: goal.startsOn,
    endsOn: goal.endsOn,
  };
}

function publicGoalError(error: { message: string; code?: string }): Error {
  const message = error.message ?? '';
  const code = error.code ?? '';
  const missingRpc =
    code === 'PGRST202' ||
    /could not find the function/i.test(message) ||
    /function public\.replace_goal/i.test(message) ||
    /schema cache/i.test(message);

  if (missingRpc) {
    return new Error('목표 저장 기능을 현재 사용할 수 없습니다. 서버 목표 API가 준비되지 않았습니다.');
  }

  return toError(error);
}

/** Active goal = ends_on is null. Weekday off today does not mean no active goal. */
export async function fetchActiveGoal(): Promise<StoredReadingGoal | null> {
  await requireAuthSession();

  const { data, error } = await supabase
    .from('reading_goals')
    .select(GOAL_SELECT)
    .is('ends_on', null)
    .maybeSingle();

  if (error) {
    throw toError(error);
  }

  if (!data) {
    return null;
  }

  return toStoredReadingGoal(data);
}

/**
 * Full goal history for the signed-in user, oldest first.
 * Same ordering as the home/records calculation path.
 */
export async function fetchGoalHistory(): Promise<StoredReadingGoal[]> {
  await requireAuthSession();

  const { data, error } = await supabase
    .from('reading_goals')
    .select(GOAL_SELECT)
    .order('starts_on', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw toError(error);
  }

  return data.map((row) => toStoredReadingGoal(row));
}

function assertReplaceInput(input: ReplaceGoalInput): void {
  if (input.type !== 'time' && input.type !== 'pages') {
    throw new Error('목표 유형이 올바르지 않습니다.');
  }

  if (
    !Number.isSafeInteger(input.targetValue) ||
    input.targetValue < 1 ||
    input.targetValue > GOAL_TARGET_MAX
  ) {
    throw new Error('목표량은 1 이상의 정수여야 합니다.');
  }

  const days = normalizeWeekdays(input.daysOfWeek);
  if (days.length === 0) {
    throw new Error('목표 요일을 하루 이상 선택해 주세요.');
  }

  if (!normalizeReminderTime(input.reminderTime)) {
    throw new Error('알림 시간은 HH:mm 형식이어야 합니다.');
  }
}

/**
 * Calls replace_goal RPC. Uses device-local p_today (same policy as session read_on).
 * Does not split end/create into separate client writes.
 */
export async function replaceGoal(input: ReplaceGoalInput): Promise<StoredReadingGoal> {
  await requireAuthSession();
  assertReplaceInput(input);

  const daysOfWeek = normalizeWeekdays(input.daysOfWeek);
  const reminderTime = normalizeReminderTime(input.reminderTime);
  if (!reminderTime) {
    throw new Error('알림 시간은 HH:mm 형식이어야 합니다.');
  }

  const today = input.today ?? toDateKey(startOfToday());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    throw new Error('날짜 형식이 올바르지 않습니다.');
  }

  const { data, error } = await supabase.rpc('replace_goal', {
    p_type: input.type,
    p_target_value: input.targetValue,
    p_days_of_week: daysOfWeek,
    p_reminder_time: reminderTime,
    p_today: today,
  });

  if (error) {
    throw publicGoalError(error);
  }

  const saved = toStoredReadingGoal(data);
  if (
    typeof input.notificationsEnabled === 'boolean' &&
    input.notificationsEnabled !== saved.notificationsEnabled
  ) {
    return setGoalNotificationsEnabled(input.notificationsEnabled, saved.id);
  }

  return saved;
}

/**
 * Updates notifications_enabled on the active goal (or a specific id).
 * Used because replace_goal cannot set this field.
 */
export async function setGoalNotificationsEnabled(
  enabled: boolean,
  goalId?: string,
): Promise<StoredReadingGoal> {
  await requireAuthSession();

  let query = supabase
    .from('reading_goals')
    .update({ notifications_enabled: enabled })
    .select(GOAL_SELECT);

  if (goalId) {
    query = query.eq('id', goalId);
  } else {
    query = query.is('ends_on', null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw toError(error);
  }

  if (!data) {
    throw new Error('활성 목표가 없어 알림 설정을 바꿀 수 없습니다.');
  }

  return toStoredReadingGoal(data);
}
