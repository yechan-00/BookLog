import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getNotificationPermission } from '@/lib/notifications/permissions';
import { ensureNotificationRuntime, NOTIFICATION_CHANNEL_ID, notificationFailureReason } from '@/lib/notifications/runtime';
import {
  ENGAGEMENT_ID_PREFIX,
  engagementLogCandidates,
  isEngagementIdentifier,
  parseReminderTime,
  planEngagementReminders,
  normalizeWeekdays,
} from '@/lib/notifications/schedulePlan';
import type {
  DueEngagementReminder,
  EngagementGoalInput,
  PendingEngagementReminder,
  SyncEngagementReminderInput,
  SyncEngagementReminderResult,
} from '@/lib/notifications/types';

export const ENGAGEMENT_TITLE = '오늘도 북로그와 함께 📚';
export const ENGAGEMENT_BODY = '오늘의 독서 목표를 시작해 볼까요?';

/**
 * Rebuilds one-shot engagement reminders for the next goal days.
 * Weekly repeats are not used, so an achieved day can be left unscheduled.
 * Cancels only identifiers that belong to this module.
 */
export async function syncEngagementReminder(
  input: SyncEngagementReminderInput,
): Promise<SyncEngagementReminderResult> {
  if (Platform.OS === 'web') {
    return {
      status: 'failed',
      scheduled: [],
      cancelledIds: [],
      reason: '이 환경에서는 알림을 예약할 수 없습니다.',
    };
  }

  try {
    if (!input.goal || !input.goal.enabled) {
      return { status: 'cleared', scheduled: [], cancelledIds: await cancelEngagementReminders() };
    }

    if (!parseReminderTime(input.goal.reminderTime) || normalizeWeekdays(input.goal.daysOfWeek).length === 0) {
      return {
        status: 'failed',
        scheduled: [],
        cancelledIds: await cancelEngagementReminders(),
        reason: '알림 요일 또는 시간이 올바르지 않습니다.',
      };
    }

    const permission = await getNotificationPermission();
    if (permission.state !== 'granted') {
      return { status: 'permission_denied', scheduled: [], cancelledIds: [] };
    }

    const now = input.now ?? new Date();
    const planned = planEngagementReminders({
      daysOfWeek: input.goal.daysOfWeek,
      reminderTime: input.goal.reminderTime,
      enabled: true,
      achievedDates: input.achievedDates,
      now,
      horizonDays: input.horizonDays,
    });
    const cancelledIds = await cancelEngagementReminders();
    await ensureNotificationRuntime();

    for (const item of planned) {
      await Notifications.scheduleNotificationAsync({
        identifier: item.identifier,
        content: {
          title: ENGAGEMENT_TITLE,
          body: ENGAGEMENT_BODY,
          data: {
            kind: 'engagement',
            goalId: input.goal.goalId,
            localDate: item.localDate,
            scheduledFor: item.fireAt.toISOString(),
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.fireAt,
          channelId: NOTIFICATION_CHANNEL_ID,
        },
      });
    }

    return { status: 'synced', scheduled: planned, cancelledIds };
  } catch (error) {
    return {
      status: 'failed',
      scheduled: [],
      cancelledIds: [],
      reason: notificationFailureReason(error),
    };
  }
}

export async function setEngagementRemindersEnabled(
  input: SyncEngagementReminderInput & { goal: EngagementGoalInput; enabled: boolean },
): Promise<SyncEngagementReminderResult> {
  return syncEngagementReminder({
    ...input,
    goal: { ...input.goal, enabled: input.enabled },
  });
}

export async function listScheduledEngagementReminders(): Promise<PendingEngagementReminder[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.filter((item) => isEngagementIdentifier(item.identifier)).map(toPendingReminder);
  } catch {
    return [];
  }
}

/**
 * Engagement reminders that are still queued after their scheduled time.
 * Delivery is not confirmed. Fired reminders leave the OS queue, so this is not a sent log.
 */
export async function listUnconfirmedDueEngagementReminders(now: Date = new Date()): Promise<DueEngagementReminder[]> {
  const pending = await listScheduledEngagementReminders();
  return pending.flatMap((item) => {
    if (!item.scheduledFor) {
      return [];
    }
    const scheduledTime = new Date(item.scheduledFor);
    if (Number.isNaN(scheduledTime.getTime()) || scheduledTime.getTime() > now.getTime()) {
      return [];
    }

    return [{ ...item, kind: 'engagement' as const, deliveryConfirmed: false as const }];
  });
}

export { engagementLogCandidates, ENGAGEMENT_ID_PREFIX };

async function cancelEngagementReminders(): Promise<string[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const identifiers = scheduled.map((item) => item.identifier).filter(isEngagementIdentifier);
  for (const identifier of identifiers) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }
  return identifiers;
}

function toPendingReminder(request: Notifications.NotificationRequest): PendingEngagementReminder {
  const data = request.content.data ?? {};
  const goalId = typeof data.goalId === 'string' ? data.goalId : null;
  const localDate = typeof data.localDate === 'string' ? data.localDate : null;
  const scheduledFor = typeof data.scheduledFor === 'string' ? data.scheduledFor : null;
  return {
    identifier: request.identifier,
    goalId,
    localDate,
    scheduledFor,
  };
}
