import type { GoalDraft } from '@/utils/goalForm';

export const WEEKDAY_OPTIONS = [
  { day: 0, label: '일' },
  { day: 1, label: '월' },
  { day: 2, label: '화' },
  { day: 3, label: '수' },
  { day: 4, label: '목' },
  { day: 5, label: '금' },
  { day: 6, label: '토' },
] as const;

/** Pre-filled values for onboarding. The user still has to confirm them. */
export const DEFAULT_GOAL_DRAFT: GoalDraft = {
  type: 'time',
  target: '15',
  days: [1, 2, 3, 4, 5],
  reminderTime: '21:00',
};
