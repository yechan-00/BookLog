/**
 * Test-only stand-in for `@/lib/notifications` (see utils/apiTest.register.mjs).
 * The real module needs expo-notifications, which Node cannot load.
 */
import type { SyncEngagementReminderResult } from '../../lib/notifications/types.ts';
import type { StoredReadingGoal } from '../../types/goal.ts';

export const syncCalls: (StoredReadingGoal | null)[] = [];
let nextBehavior: { result?: SyncEngagementReminderResult; error?: Error } = {};

export function resetFakeNotifications(): void {
  syncCalls.length = 0;
  nextBehavior = {};
}

export function setSyncBehavior(behavior: { result?: SyncEngagementReminderResult; error?: Error }): void {
  nextBehavior = behavior;
}

export function syncEngagementFromStoredGoal(goal: StoredReadingGoal | null): Promise<SyncEngagementReminderResult> {
  syncCalls.push(goal);
  if (nextBehavior.error) {
    return Promise.reject(nextBehavior.error);
  }
  return Promise.resolve(nextBehavior.result ?? { status: 'synced', scheduled: [], cancelledIds: [] });
}
