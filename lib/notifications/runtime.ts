import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

// Android fixes a channel's importance once it exists, so raising it to HIGH needs a new channel id.
export const NOTIFICATION_CHANNEL_ID = 'booklog-reminders-high';
const LEGACY_CHANNEL_IDS = ['booklog-reminders'] as const;

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
  // HIGH shows the heads-up banner; DEFAULT only adds the notification to the shade.
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: '독서 알림',
    importance: AndroidImportance.HIGH,
  });
  androidChannelReady = true;
  if (__DEV__) {
    console.log('[booklog-notifications]', 'android-channel-ready', {
      channelId: NOTIFICATION_CHANNEL_ID,
    });
  }
  await removeIdleLegacyChannels();
}

/**
 * Deletes old channels once no scheduled notification may still post to them.
 * A notification sent to a deleted channel is dropped, and reminders are only rescheduled
 * when the goal or a session is saved, so a channel stays while anything could still use it.
 */
async function removeIdleLegacyChannels(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const channels = scheduled.map((request) => triggerChannelId(request.trigger));
    const hasUnknownChannel = channels.includes(null);

    for (const legacyId of LEGACY_CHANNEL_IDS) {
      if (!hasUnknownChannel && !channels.includes(legacyId)) {
        await Notifications.deleteNotificationChannelAsync(legacyId);
      }
    }
  } catch (error) {
    // Cleanup only tidies the system settings list; notifications keep working without it.
    if (__DEV__) {
      console.warn('[booklog-notifications]', 'legacy-channel-cleanup-failed', notificationFailureReason(error));
    }
  }
}

function triggerChannelId(trigger: Notifications.NotificationTrigger): string | null {
  if (trigger !== null && typeof trigger === 'object' && 'channelId' in trigger) {
    const { channelId } = trigger as { channelId?: unknown };
    return typeof channelId === 'string' ? channelId : null;
  }
  return null;
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
