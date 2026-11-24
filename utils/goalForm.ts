import { normalizeWeekdays, parseReminderTime } from '@/lib/notifications/schedulePlan';
import type { GoalType, StoredReadingGoal } from '@/types/goal';

/** PostgreSQL integer upper bound for reading_goals.target_value. */
export const GOAL_TARGET_MAX = 2_147_483_647;

export interface GoalDraft {
  type: GoalType;
  target: string;
  days: number[];
  reminderTime: string;
}

/** Normalizes DB time (`21:30:00`) or draft time (`21:30`) to HH:mm. */
export function normalizeReminderTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) {
    return null;
  }

  return `${match[1]}:${match[2]}`;
}

export type GoalDraftResult =
  | {
      valid: true;
      type: GoalType;
      targetValue: number;
      daysOfWeek: number[];
      reminderTime: string;
    }
  | { valid: false; message: string };

const TARGET_MESSAGE = '목표량은 1 이상의 정수여야 합니다.';

export const emptyGoalDraft: GoalDraft = {
  type: 'time',
  target: '',
  days: [],
  reminderTime: '',
};

/** Validates a settings draft. Weekdays follow the app clock: 0 is Sunday. */
export function validateGoalDraft(draft: GoalDraft): GoalDraftResult {
  const trimmed = draft.target.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) {
    return { valid: false, message: TARGET_MESSAGE };
  }

  const targetValue = Number(trimmed);
  if (!Number.isSafeInteger(targetValue) || targetValue < 1 || targetValue > GOAL_TARGET_MAX) {
    return { valid: false, message: TARGET_MESSAGE };
  }

  const daysOfWeek = normalizeWeekdays(draft.days);
  if (daysOfWeek.length === 0) {
    return { valid: false, message: '목표 요일을 하루 이상 선택해 주세요.' };
  }

  const reminder = parseReminderTime(draft.reminderTime);
  if (!reminder) {
    return { valid: false, message: '알림 시간은 HH:mm 형식이어야 합니다.' };
  }

  return {
    valid: true,
    type: draft.type,
    targetValue,
    daysOfWeek,
    reminderTime: `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`,
  };
}

export function draftFromStoredGoal(goal: StoredReadingGoal): GoalDraft {
  return {
    type: goal.type,
    target: String(goal.targetValue),
    days: [...goal.daysOfWeek],
    reminderTime: goal.reminderTime ?? '',
  };
}

export function goalSnapshotKey(input: {
  type: GoalType;
  targetValue: number;
  daysOfWeek: readonly number[];
  reminderTime: string | null;
}): string {
  const days = normalizeWeekdays(input.daysOfWeek).join(',');
  const reminder = normalizeReminderTime(input.reminderTime) ?? '';
  return `${input.type}|${input.targetValue}|${days}|${reminder}`;
}

export function isSameGoalDraft(
  draft: GoalDraftResult & { valid: true },
  goal: StoredReadingGoal | null,
): boolean {
  if (!goal) {
    return false;
  }

  return (
    goalSnapshotKey({
      type: draft.type,
      targetValue: draft.targetValue,
      daysOfWeek: draft.daysOfWeek,
      reminderTime: draft.reminderTime,
    }) ===
    goalSnapshotKey({
      type: goal.type,
      targetValue: goal.targetValue,
      daysOfWeek: goal.daysOfWeek,
      reminderTime: goal.reminderTime,
    })
  );
}

export function formatStoredGoalSummary(goal: StoredReadingGoal): string {
  const unit = goal.type === 'time' ? '분' : '쪽';
  const days = normalizeWeekdays(goal.daysOfWeek)
    .map((day) => ['일', '월', '화', '수', '목', '금', '토'][day] ?? '')
    .filter(Boolean)
    .join('');
  const reminder = goal.reminderTime ? ` · 알림 ${goal.reminderTime}` : '';
  return `하루 ${goal.targetValue}${unit} · ${days || '요일 없음'}${reminder}`;
}
