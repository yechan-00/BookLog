import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import {
  canRequestNotificationPermission,
  interpretNotificationPermissions,
} from '@/lib/notifications/permissionStatus';
import { ensureNotificationRuntime } from '@/lib/notifications/runtime';
import type { NotificationPermissionResult } from '@/lib/notifications/types';

export {
  canRequestNotificationPermission,
  interpretNotificationPermissions,
} from '@/lib/notifications/permissionStatus';

const UNAVAILABLE: NotificationPermissionResult = { state: 'denied', canAskAgain: false };
const QUERY_FAILED: NotificationPermissionResult = { state: 'error', canAskAgain: false };

function logPermissionDebug(phase: string, detail: Record<string, unknown>): void {
  if (!__DEV__) {
    return;
  }
  console.log('[booklog-notifications]', phase, {
    os: Platform.OS,
    version: String(Platform.Version),
    expoGo: Constants.appOwnership === 'expo',
    ...detail,
  });
}

export async function getNotificationPermission(): Promise<NotificationPermissionResult> {
  if (Platform.OS === 'web') {
    return UNAVAILABLE;
  }

  try {
    // Android 13+: permission prompt appears only after at least one channel exists.
    await ensureNotificationRuntime();
    const settings = await Notifications.getPermissionsAsync();
    const result = interpretNotificationPermissions(settings);
    logPermissionDebug('get', {
      status: settings.status,
      granted: settings.granted,
      canAskAgain: settings.canAskAgain,
      iosStatus: settings.ios?.status ?? null,
      mapped: result.state,
    });
    return result;
  } catch (error) {
    logPermissionDebug('get-error', {
      name: error instanceof Error ? error.name : 'unknown',
    });
    return QUERY_FAILED;
  }
}

/**
 * Asks for notification permission when the OS still allows a prompt.
 * A denial is returned as state, not thrown, and reading remains available.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionResult> {
  if (Platform.OS === 'web') {
    return UNAVAILABLE;
  }

  try {
    await ensureNotificationRuntime();
    const current = await Notifications.getPermissionsAsync();
    const currentResult = interpretNotificationPermissions(current);
    logPermissionDebug('request-before', {
      status: current.status,
      granted: current.granted,
      canAskAgain: current.canAskAgain,
      mapped: currentResult.state,
    });

    if (currentResult.state === 'granted') {
      return currentResult;
    }
    if (!canRequestNotificationPermission(currentResult)) {
      return currentResult;
    }

    const next = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });
    const mapped = interpretNotificationPermissions(next);
    logPermissionDebug('request-after', {
      status: next.status,
      granted: next.granted,
      canAskAgain: next.canAskAgain,
      mapped: mapped.state,
    });
    return mapped;
  } catch (error) {
    logPermissionDebug('request-error', {
      name: error instanceof Error ? error.name : 'unknown',
    });
    return QUERY_FAILED;
  }
}

/**
 * Ensures local-notification permission is granted when the user turns reminders on.
 * Requests again when status is undetermined, or denied but `canAskAgain` is true (common on Android).
 */
export async function ensureNotificationPermissionGranted(): Promise<NotificationPermissionResult> {
  const current = await getNotificationPermission();
  if (current.state === 'granted' || !canRequestNotificationPermission(current)) {
    return current;
  }
  return requestNotificationPermission();
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
