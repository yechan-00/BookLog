import type { NotificationPermissionResult } from '@/lib/notifications/types';

/**
 * Mirrors `IosAuthorizationStatus` from expo-notifications.
 * Kept as plain numbers so Node unit tests do not load the native module.
 */
export const IOS_AUTH = {
  NOT_DETERMINED: 0,
  DENIED: 1,
  AUTHORIZED: 2,
  PROVISIONAL: 3,
  EPHEMERAL: 4,
} as const;

export type NotificationPermissionStatusLike = {
  status: 'granted' | 'denied' | 'undetermined';
  granted: boolean;
  canAskAgain: boolean;
  ios?: { status?: number | null } | null;
};

/**
 * Maps expo-notifications permission payload to app state.
 * Android often reports `denied` + `canAskAgain` before the first prompt; callers must still request.
 * iOS uses granular `ios.status` (authorized / provisional / ephemeral count as granted).
 */
export function interpretNotificationPermissions(
  settings: NotificationPermissionStatusLike,
): NotificationPermissionResult {
  const iosStatus = settings.ios?.status;
  const canAskAgain = Boolean(settings.canAskAgain);

  const iosGranted =
    iosStatus === IOS_AUTH.AUTHORIZED ||
    iosStatus === IOS_AUTH.PROVISIONAL ||
    iosStatus === IOS_AUTH.EPHEMERAL;

  if (settings.granted || settings.status === 'granted' || iosGranted) {
    return { state: 'granted', canAskAgain };
  }

  if (settings.status === 'undetermined' || iosStatus === IOS_AUTH.NOT_DETERMINED) {
    return { state: 'undetermined', canAskAgain };
  }

  if (settings.status === 'denied' || iosStatus === IOS_AUTH.DENIED) {
    return { state: 'denied', canAskAgain };
  }

  return { state: 'undetermined', canAskAgain };
}

/** True when the OS may still show a permission prompt. */
export function canRequestNotificationPermission(result: NotificationPermissionResult): boolean {
  if (result.state === 'granted' || result.state === 'error') {
    return false;
  }
  if (result.state === 'undetermined') {
    return true;
  }
  return result.canAskAgain;
}
