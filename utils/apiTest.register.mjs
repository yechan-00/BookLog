import { existsSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const stubs = new Map([
  ['@/lib/supabase', 'utils/testing/fakeSupabase.ts'],
  ['@/lib/notifications', 'utils/testing/fakeNotifications.ts'],
  ['@/lib/reading/goalReachedBridge', 'utils/testing/fakeGoalReachedBridge.ts'],
]);

/**
 * Like readingStats.register.mjs, but swaps modules that need react-native or expo-notifications
 * (Supabase client, notification module, goal-reached bridge) for the fakes in utils/testing,
 * so lib/api and lib/reading modules load in plain Node.
 */
export async function resolve(specifier, context, nextResolve) {
  const stub = stubs.get(specifier);
  if (stub) {
    return nextResolve(pathToFileURL(resolvePath(root, stub)).href, context);
  }

  if (!specifier.startsWith('@/')) {
    return nextResolve(specifier, context);
  }

  const base = resolvePath(root, specifier.slice(2));
  const file = [`${base}.ts`, `${base}.tsx`, base].find((candidate) => existsSync(candidate));
  return nextResolve(pathToFileURL(file ?? base).href, context);
}
