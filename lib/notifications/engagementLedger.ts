/**
 * Local bookkeeping for engagement reminders (NOTI-02).
 *
 * The OS removes a notification from its schedule once it fires, so "fired" cannot be read back.
 * Instead every scheduled reminder is remembered here, and a reminder whose time has passed while
 * it is no longer queued counts as sent. This is inferred from the schedule, not proof of delivery
 * (PRD: the log records reminders whose scheduled time has passed).
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LedgerEntry {
  identifier: string;
  goalId: string;
  /** ISO timestamp the reminder was scheduled to fire. */
  scheduledFor: string;
}

export const LEDGER_STORAGE_KEY = 'booklog.engagement.ledger';
export const OUTBOX_STORAGE_KEY = 'booklog.engagement.outbox';

function isLedgerEntry(value: unknown): value is LedgerEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entry = value as Partial<LedgerEntry>;
  return (
    typeof entry.identifier === 'string' &&
    typeof entry.goalId === 'string' &&
    typeof entry.scheduledFor === 'string' &&
    !Number.isNaN(Date.parse(entry.scheduledFor))
  );
}

/** Stored data is untrusted: anything unreadable becomes an empty list instead of crashing app start. */
function readEntries(storage: StorageLike, key: string): LedgerEntry[] {
  const raw = storage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isLedgerEntry) : [];
  } catch {
    return [];
  }
}

function writeEntries(storage: StorageLike, key: string, entries: readonly LedgerEntry[]): void {
  if (entries.length === 0) {
    storage.removeItem(key);
    return;
  }

  storage.setItem(key, JSON.stringify(entries));
}

export function entryKey(entry: LedgerEntry): string {
  return `${entry.identifier}|${entry.scheduledFor}`;
}

export function readLedger(storage: StorageLike): LedgerEntry[] {
  return readEntries(storage, LEDGER_STORAGE_KEY);
}

export function readOutbox(storage: StorageLike): LedgerEntry[] {
  return readEntries(storage, OUTBOX_STORAGE_KEY);
}

/** Replaces the ledger with what was just scheduled. Pass an empty list after cancelling everything. */
export function recordScheduled(storage: StorageLike, entries: readonly LedgerEntry[]): void {
  writeEntries(storage, LEDGER_STORAGE_KEY, entries);
}

export function clearEngagementLedger(storage: StorageLike): void {
  storage.removeItem(LEDGER_STORAGE_KEY);
  storage.removeItem(OUTBOX_STORAGE_KEY);
}

/**
 * Sorts ledger entries by what happened to them.
 * - past and no longer queued: it fired, so it goes to the log
 * - past but still queued: it never fired (device off, etc.), so it is not logged
 * - future and still queued: still pending, kept
 * - future but not queued: it was cancelled, dropped
 */
export function splitLedger(
  ledger: readonly LedgerEntry[],
  queuedIds: ReadonlySet<string>,
  now: Date,
): { fired: LedgerEntry[]; keep: LedgerEntry[] } {
  const fired: LedgerEntry[] = [];
  const keep: LedgerEntry[] = [];

  for (const entry of ledger) {
    const isPast = Date.parse(entry.scheduledFor) <= now.getTime();
    const isQueued = queuedIds.has(entry.identifier);

    if (isPast && !isQueued) {
      fired.push(entry);
    } else if (!isPast && isQueued) {
      keep.push(entry);
    }
  }

  return { fired, keep };
}

/**
 * Moves reminders that fired since the last check from the ledger to the outbox.
 * Run it before anything cancels or reschedules reminders, or fired ones are lost.
 */
export function collectFired(storage: StorageLike, queuedIds: ReadonlySet<string>, now: Date): LedgerEntry[] {
  const ledger = readLedger(storage);
  const { fired, keep } = splitLedger(ledger, queuedIds, now);
  if (fired.length === 0 && keep.length === ledger.length) {
    return [];
  }

  const outbox = readOutbox(storage);
  const known = new Set(outbox.map(entryKey));
  const added = fired.filter((entry) => !known.has(entryKey(entry)));

  writeEntries(storage, OUTBOX_STORAGE_KEY, [...outbox, ...added]);
  writeEntries(storage, LEDGER_STORAGE_KEY, keep);
  return added;
}

/** Removes sent or dropped entries from the current outbox, so entries added meanwhile are kept. */
export function removeFromOutbox(storage: StorageLike, done: readonly LedgerEntry[]): void {
  const doneKeys = new Set(done.map(entryKey));
  writeEntries(
    storage,
    OUTBOX_STORAGE_KEY,
    readOutbox(storage).filter((entry) => !doneKeys.has(entryKey(entry))),
  );
}
