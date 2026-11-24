/**
 * Test-only stand-in for `@/lib/reading/goalReachedBridge` (see utils/apiTest.register.mjs).
 * The real bridge pulls in expo-notifications, which Node cannot load.
 */
import type { ScheduleGoalReachedResult } from '../../lib/notifications/types.ts';

export const bridgeCalls: number[] = [];
let nextBehavior: { result?: ScheduleGoalReachedResult; error?: Error } = {};

export function resetFakeBridge(): void {
  bridgeCalls.length = 0;
  nextBehavior = {};
}

export function setBridgeBehavior(behavior: { result?: ScheduleGoalReachedResult; error?: Error }): void {
  nextBehavior = behavior;
}

export function syncGoalReachedForSession(sessionElapsedSeconds: number): Promise<ScheduleGoalReachedResult> {
  bridgeCalls.push(sessionElapsedSeconds);
  if (nextBehavior.error) {
    return Promise.reject(nextBehavior.error);
  }
  return Promise.resolve(nextBehavior.result ?? { status: 'skipped', reason: 'invalid_goal' });
}
