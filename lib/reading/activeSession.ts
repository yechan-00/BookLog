import 'expo-sqlite/localStorage/install';

import type { ActiveReadingSession } from '@/types/reading';

const STORAGE_KEY = 'booklog.activeReadingSession';

export type BeginSessionResult =
  | { kind: 'started' | 'resumed' }
  | { kind: 'busy'; userBookId: string };

function isActiveSession(value: unknown): value is ActiveReadingSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.userBookId === 'string' &&
    typeof candidate.startedAt === 'string' &&
    !Number.isNaN(Date.parse(candidate.startedAt)) &&
    typeof candidate.startPage === 'number' &&
    Number.isInteger(candidate.startPage) &&
    typeof candidate.focusExitCount === 'number' &&
    Number.isInteger(candidate.focusExitCount)
  );
}

function write(session: ActiveReadingSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearActiveSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Returns null when nothing is stored. Unreadable data is dropped so it cannot block a new session. */
export function loadActiveSession(): ActiveReadingSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearActiveSession();
    return null;
  }

  if (!isActiveSession(parsed)) {
    clearActiveSession();
    return null;
  }

  return parsed;
}

/** Only one session may run at a time (READ-01). */
export function beginReadingSession(userBookId: string, startPage: number): BeginSessionResult {
  const existing = loadActiveSession();
  if (existing) {
    return existing.userBookId === userBookId
      ? { kind: 'resumed' }
      : { kind: 'busy', userBookId: existing.userBookId };
  }

  write({
    userBookId,
    startedAt: new Date().toISOString(),
    startPage,
    focusExitCount: 0,
  });
  return { kind: 'started' };
}

/** Called when the app returns from the background (READ-02). Storage stays the source of truth. */
export function registerFocusExit(): ActiveReadingSession | null {
  const existing = loadActiveSession();
  if (!existing) {
    return null;
  }

  const next = { ...existing, focusExitCount: existing.focusExitCount + 1 };
  write(next);
  return next;
}
