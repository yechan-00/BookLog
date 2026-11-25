import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

export const NOTIFICATION_CHANNEL_ID = 'booklog-reminders';

let isHandlerReady = false;
let androidChannelReady = false;

/** Prepares local notification presentation. Does not ask for permission. */
export async function ensureNotificationRuntime(): Promise<void> {
  if (!isHandlerReady) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    isHandlerReady = true;
  }

  if (Platform.OS !== 'android') {
    return;
  }

  if (androidChannelReady) {
    return;
  }

  // Android 13+: at least one channel must exist before the OS shows the permission prompt.
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: '독서 알림',
    importance: AndroidImportance.DEFAULT,
  });
  androidChannelReady = true;
  if (__DEV__) {
    console.log('[booklog-notifications]', 'android-channel-ready', {
      channelId: NOTIFICATION_CHANNEL_ID,
    });
  }
}

export function notificationFailureReason(error: unknown): string {
  if (!(error instanceof Error)) {
    return '알림을 처리하지 못했습니다.';
  }

  const message = error.message.trim();
  if (!message || /api[_ -]?key|token|password|secret|authorization/i.test(message)) {
    return '알림을 처리하지 못했습니다.';
  }

  return message;
}
