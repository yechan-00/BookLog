import { toError } from '@/lib/api/errors';
import { supabase } from '@/lib/supabase';
import type { ActiveGoal, GoalType } from '@/types/goal';
import { toDateKey } from '@/utils/date';

interface GoalRow {
  id: string;
  type: string;
  target_value: number;
  days_of_week: number[];
  reminder_time: string | null;
  notifications_enabled: boolean;
  starts_on: string;
}

export const GOAL_SELECT = 'id, type, target_value, days_of_week, reminder_time, notifications_enabled, starts_on';

function isGoalType(value: string): value is GoalType {
  return value === 'time' || value === 'pages';
}

function toActiveGoal(row: GoalRow): ActiveGoal {
  if (!isGoalType(row.type)) {
    throw new Error(`알 수 없는 목표 단위입니다: ${row.type}`);
  }

  return {
    id: row.id,
    type: row.type,
    targetValue: row.target_value,
    daysOfWeek: row.days_of_week,
    // The DB returns HH:mm:ss; screens and reminders work with HH:mm.
    reminderTime: row.reminder_time ? row.reminder_time.slice(0, 5) : null,
    notificationsEnabled: row.notifications_enabled,
    startsOn: row.starts_on,
  };
}

/** Null means the user has not set a goal yet (shows onboarding). */
export async function fetchActiveGoal(): Promise<ActiveGoal | null> {
  const { data, error } = await supabase
    .from('reading_goals')
    .select(GOAL_SELECT)
    .is('ends_on', null)
    .maybeSingle();

  if (error) {
    throw toError(error);
  }

  return data ? toActiveGoal(data) : null;
}

interface ReplaceGoalInput {
  type: GoalType;
  targetValue: number;
  daysOfWeek: number[];
  /** Local HH:mm. */
  reminderTime: string;
}

/**
 * Ends the active goal today and starts the new one (GOAL-02).
 * Editing again on the same day overwrites that day's goal instead of keeping history.
 */
export async function replaceGoal(input: ReplaceGoalInput): Promise<ActiveGoal> {
  const { data, error } = await supabase.rpc('replace_goal', {
    p_type: input.type,
    p_target_value: input.targetValue,
    p_days_of_week: input.daysOfWeek,
    p_reminder_time: input.reminderTime,
    // "Today" is the device's local date, so the client decides it.
    p_today: toDateKey(new Date()),
  });

  if (error) {
    throw toError(error);
  }

  return toActiveGoal(data);
}

/** Turns the engagement reminder on or off for the active goal without creating a new goal period. */
export async function setGoalNotificationsEnabled(goalId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.from('reading_goals').update({ notifications_enabled: enabled }).eq('id', goalId);

  if (error) {
    throw toError(error);
  }
}
