import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { ensureNotificationRuntime } from '@/lib/notifications/runtime';
import type { NotificationPermissionResult } from '@/lib/notifications/types';

const UNAVAILABLE: NotificationPermissionResult = { state: 'denied', canAskAgain: false };
const QUERY_FAILED: NotificationPermissionResult = { state: 'error', canAskAgain: false };

export async function getNotificationPermission(): Promise<NotificationPermissionResult> {
  if (Platform.OS === 'web') {
    return UNAVAILABLE;
  }

  try {
    return toResult(await Notifications.getPermissionsAsync());
  } catch {
    return QUERY_FAILED;
  }
}

/**
 * Asks for notification permission when the user is in onboarding or opens the prompt again.
 * A denial is returned as state, not thrown, and reading remains available.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionResult> {
  if (Platform.OS === 'web') {
    return UNAVAILABLE;
  }

  try {
    await ensureNotificationRuntime();
    const current = await Notifications.getPermissionsAsync();
    const currentResult = toResult(current);
    if (currentResult.state === 'granted' || (currentResult.state === 'denied' && !current.canAskAgain)) {
      return currentResult;
    }

    const next = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });
    return toResult(next);
  } catch {
    return QUERY_FAILED;
  }
}

/** Opens the OS settings screen so a denied permission can be changed there. */
export async function openNotificationSettings(): Promise<boolean> {
  try {
    await Linking.openSettings();
    return true;
  } catch {
    return false;
  }
}

function toResult(settings: Notifications.NotificationPermissionsStatus): NotificationPermissionResult {
  const iosStatus = settings.ios?.status;
  const granted =
    settings.granted ||
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL;

  if (granted) {
    return { state: 'granted', canAskAgain: settings.canAskAgain };
  }

  if (settings.status === 'denied' || iosStatus === Notifications.IosAuthorizationStatus.DENIED) {
    return { state: 'denied', canAskAgain: settings.canAskAgain };
  }

  return { state: 'undetermined', canAskAgain: settings.canAskAgain };
}
