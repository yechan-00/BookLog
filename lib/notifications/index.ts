export { clearBooklogNotifications } from '@/lib/notifications/clearBooklog';
export {
  ENGAGEMENT_BODY,
  ENGAGEMENT_TITLE,
  listScheduledEngagementReminders,
  listUnconfirmedDueEngagementReminders,
  setEngagementRemindersEnabled,
  syncEngagementReminder,
} from '@/lib/notifications/engagement';
export { cancelGoalReached, scheduleGoalReached } from '@/lib/notifications/goalReached';
export {
  ensureNotificationPermissionGranted,
  getNotificationPermission,
  openNotificationSettings,
  requestNotificationPermission,
} from '@/lib/notifications/permissions';
export {
  canRequestNotificationPermission,
  interpretNotificationPermissions,
} from '@/lib/notifications/permissionStatus';
export {
  ENGAGEMENT_HORIZON_DAYS,
  ENGAGEMENT_ID_PREFIX,
  GOAL_REACHED_IDENTIFIER,
  decideGoalReached,
  engagementIdentifier,
  engagementLogCandidates,
  formatLocalDate,
  planEngagementReminders,
} from '@/lib/notifications/schedulePlan';
export {
  describeEngagementSync,
  syncEngagementFromStoredGoal,
} from '@/lib/notifications/syncFromGoal';
export {
  scheduleTestNotificationPreview,
  TEST_PREVIEW_IDENTIFIER,
} from '@/lib/notifications/testPreview';
export type {
  DueEngagementReminder,
  EngagementGoalInput,
  NotificationPermissionResult,
  NotificationPermissionState,
  PendingEngagementReminder,
  ScheduleGoalReachedInput,
  ScheduleGoalReachedResult,
  SyncEngagementReminderInput,
  SyncEngagementReminderResult,
} from '@/lib/notifications/types';
export type { EngagementLogCandidate, EngagementPlanItem, GoalReachedDecision } from '@/lib/notifications/schedulePlan';