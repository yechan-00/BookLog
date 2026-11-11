import { normalizeWeekdays, parseReminderTime } from '@/lib/notifications/schedulePlan';
import type { GoalType } from '@/types/goal';

export interface GoalDraft {
  type: GoalType;
  target: string;
  days: number[];
  reminderTime: string;
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

/** Validates a settings draft. Weekdays follow the app clock: 0 is Sunday. */
export function validateGoalDraft(draft: GoalDraft): GoalDraftResult {
  const trimmed = draft.target.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) {
    return { valid: false, message: TARGET_MESSAGE };
  }

  const targetValue = Number(trimmed);
  if (!Number.isSafeInteger(targetValue) || targetValue < 1) {
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
