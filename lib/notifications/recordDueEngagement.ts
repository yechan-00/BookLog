import 'expo-sqlite/localStorage/install';

import { Platform } from 'react-native';

import { insertEngagementLog, isPermanentNotificationLogError } from '@/lib/api/notificationLogs';
import { collectFiredEngagement } from '@/lib/notifications/engagement';
import { flushEngagementOutbox, type FlushResult } from '@/lib/notifications/engagementLog';

export type RecordDueEngagementResult =
  | { status: 'recorded'; result: FlushResult }
  | { status: 'skipped' }
  | { status: 'failed'; reason: string };

/**
 * Saves engagement reminders whose scheduled time has passed to NotificationLog (NOTI-02).
 * Run when the app opens or returns to the foreground. It never throws: a logging problem must not
 * block the app, so the result carries the reason and unsent entries stay for the next run.
 */
export async function recordDueEngagement(now: Date = new Date()): Promise<RecordDueEngagementResult> {
  if (Platform.OS === 'web') {
    return { status: 'skipped' };
  }

  try {
    await collectFiredEngagement(now);
    const result = await flushEngagementOutbox({
      storage: localStorage,
      insert: (entry) => insertEngagementLog({ goalId: entry.goalId, sentAt: entry.scheduledFor }),
      isPermanentFailure: isPermanentNotificationLogError,
    });
    return { status: 'recorded', result };
  } catch (error) {
    return {
      status: 'failed',
      reason: error instanceof Error ? error.message : '알림 기록을 저장하지 못했습니다.',
    };
  }
}
