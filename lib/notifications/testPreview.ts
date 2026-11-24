import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getNotificationPermission } from '@/lib/notifications/permissions';
import { ensureNotificationRuntime, NOTIFICATION_CHANNEL_ID, notificationFailureReason } from '@/lib/notifications/runtime';

export const TEST_PREVIEW_IDENTIFIER = 'booklog.test-preview';

/**
 * Fires a one-shot local preview. Uses a dedicated id so engagement schedules stay intact.
 */
export async function scheduleTestNotificationPreview(): Promise<
  { status: 'scheduled' } | { status: 'permission_denied' } | { status: 'failed'; reason: string }
> {
  if (Platform.OS === 'web') {
    return { status: 'failed', reason: '이 환경에서는 알림을 보낼 수 없습니다.' };
  }

  const permission = await getNotificationPermission();
  if (permission.state !== 'granted') {
    return { status: 'permission_denied' };
  }

  try {
    await ensureNotificationRuntime();
    await Notifications.cancelScheduledNotificationAsync(TEST_PREVIEW_IDENTIFIER);
    await Notifications.scheduleNotificationAsync({
      identifier: TEST_PREVIEW_IDENTIFIER,
      content: {
        title: '북로그 알림 미리보기',
        body: '목표 시간에 이렇게 알려드릴게요.',
        data: { kind: 'test_preview' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        repeats: false,
        channelId: NOTIFICATION_CHANNEL_ID,
      },
    });
    return { status: 'scheduled' };
  } catch (error) {
    return { status: 'failed', reason: notificationFailureReason(error) };
  }
}
