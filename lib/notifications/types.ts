import type { EngagementPlanItem } from '@/lib/notifications/schedulePlan';

export type NotificationPermissionState = 'undetermined' | 'granted' | 'denied' | 'error';

export interface NotificationPermissionResult {
  state: NotificationPermissionState;
  canAskAgain: boolean;
}

export interface ScheduleGoalReachedInput {
  goalId: string;
  goalType: 'time' | 'pages';
  /** Minutes required today. */
  targetMinutes: number;
  /** Minutes already read today before the current session. */
  elapsedMinutes: number;
}

export type ScheduleGoalReachedResult =
  | { status: 'scheduled'; identifier: string; fireAt: string; seconds: number }
  | { status: 'skipped'; reason: 'not_time_goal' | 'already_achieved' | 'invalid_goal' | 'permission_denied' }
  | { status: 'failed'; reason: string };

export interface EngagementGoalInput {
  goalId: string;
  /** 0 is Sunday and 6 is Saturday, matching `types/goal.ts`. */
  daysOfWeek: readonly number[];
  /** Local `HH:mm` or `HH:mm:ss`. */
  reminderTime: string;
  enabled: boolean;
}

export interface SyncEngagementReminderInput {
  goal: EngagementGoalInput | null;
  /** Local `YYYY-MM-DD` dates whose goal is already met. */
  achievedDates: readonly string[];
  now?: Date;
  horizonDays?: number;
}

export interface SyncEngagementReminderResult {
  status: 'synced' | 'cleared' | 'permission_denied' | 'failed';
  scheduled: EngagementPlanItem[];
  cancelledIds: string[];
  reason?: string;
}

export interface PendingEngagementReminder {
  identifier: string;
  goalId: string | null;
  localDate: string | null;
  scheduledFor: string | null;
}

/** A scheduled time in the past. This does not confirm the notification was delivered. */
export interface DueEngagementReminder extends PendingEngagementReminder {
  kind: 'engagement';
  deliveryConfirmed: false;
}
