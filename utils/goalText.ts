import { WEEKDAY_OPTIONS } from '@/constants/goal';
import type { ActiveGoal } from '@/types/goal';

/** e.g. "하루 30분 · 월 화 수 · 21:00 알림" */
export function describeGoal(goal: ActiveGoal): string {
  const amount = goal.type === 'time' ? `${goal.targetValue}분` : `${goal.targetValue}페이지`;
  const days = WEEKDAY_OPTIONS.filter((option) => goal.daysOfWeek.includes(option.day))
    .map((option) => option.label)
    .join(' ');
  const reminder = goal.reminderTime && goal.notificationsEnabled ? ` · ${goal.reminderTime} 알림` : '';

  return `하루 ${amount} · ${days}${reminder}`;
}
