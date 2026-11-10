import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getNotificationPermission } from '@/lib/notifications/permissions';
import { ensureNotificationRuntime, NOTIFICATION_CHANNEL_ID, notificationFailureReason } from '@/lib/notifications/runtime';
import { decideGoalReached, GOAL_REACHED_IDENTIFIER } from '@/lib/notifications/schedulePlan';
import type { ScheduleGoalReachedInput, ScheduleGoalReachedResult } from '@/lib/notifications/types';

const GOAL_REACHED_TITLE = '오늘의 독서 목표에 도달했어요';
const GOAL_REACHED_BODY = '지금까지의 독서 시간을 확인하고 기록을 마무리해 보세요.';

/**
 * Schedules one local alert for the remaining minutes of a time goal.
 * Page goals and an already met goal are skipped. Replaces only this alert.
 */
export async function scheduleGoalReached(input: ScheduleGoalReachedInput): Promise<ScheduleGoalReachedResult> {
  const decision = decideGoalReached(input);
  if (decision.action === 'skip') {
    if (decision.reason === 'already_achieved') {
      await cancelGoalReached();
    }
    return { status: 'skipped', reason: decision.reason };
  }

  if (Platform.OS === 'web') {
    return { status: 'failed', reason: '이 환경에서는 알림을 예약할 수 없습니다.' };
  }

  const permission = await getNotificationPermission();
  if (permission.state !== 'granted') {
    return { status: 'skipped', reason: 'permission_denied' };
  }

  try {
    await ensureNotificationRuntime();
    await Notifications.cancelScheduledNotificationAsync(GOAL_REACHED_IDENTIFIER);
    const fireAt = new Date(Date.now() + decision.seconds * 1000);
    await Notifications.scheduleNotificationAsync({
      identifier: GOAL_REACHED_IDENTIFIER,
      content: {
        title: GOAL_REACHED_TITLE,
        body: GOAL_REACHED_BODY,
        data: {
          kind: 'goal_reached',
          goalId: input.goalId,
          scheduledFor: fireAt.toISOString(),
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: decision.seconds,
        repeats: false,
        channelId: NOTIFICATION_CHANNEL_ID,
      },
    });

    return {
      status: 'scheduled',
      identifier: GOAL_REACHED_IDENTIFIER,
      fireAt: fireAt.toISOString(),
      seconds: decision.seconds,
    };
  } catch (error) {
    return { status: 'failed', reason: notificationFailureReason(error) };
  }
}

/** Cancels the goal-reached alert only. Engagement reminders stay scheduled. */
export async function cancelGoalReached(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(GOAL_REACHED_IDENTIFIER);
  } catch {
    // Missing identifiers are already a no-op. A platform failure should not interrupt reading.
  }
}
