import {
  LEDGER_STORAGE_KEY,
  OUTBOX_STORAGE_KEY,
  clearEngagementLedger,
  collectFired,
  readLedger,
  readOutbox,
  recordScheduled,
  removeFromOutbox,
  splitLedger,
  type LedgerEntry,
  type StorageLike,
} from './engagementLedger.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const NOW = new Date('2026-11-24T12:00:00.000Z');

function entry(day: string, goalId = 'goal-1'): LedgerEntry {
  return {
    identifier: `booklog.engagement.${day}`,
    goalId,
    scheduledFor: `${day}T12:00:00.000Z`,
  };
}

function ids(entries: readonly LedgerEntry[]): string {
  return entries.map((item) => item.identifier.slice(-10)).join(',');
}

function run(): void {
  // --- splitLedger: what happened to each reminder
  const past = entry('2026-11-22');
  const pastStillQueued = entry('2026-11-23');
  const future = entry('2026-11-25');
  const futureCancelled = entry('2026-11-26');
  const queued = new Set([pastStillQueued.identifier, future.identifier]);
  const split = splitLedger([past, pastStillQueued, future, futureCancelled], queued, NOW);
  assert(ids(split.fired) === '2026-11-22', 'past and no longer queued counts as sent');
  assert(ids(split.keep) === '2026-11-25', 'future and still queued stays in the ledger');
  assert(
    !split.fired.some((item) => item.identifier === pastStillQueued.identifier),
    'past but still queued was never delivered, so it is not logged',
  );
  assert(
    !split.keep.some((item) => item.identifier === futureCancelled.identifier),
    'a cancelled future reminder is dropped',
  );

  const exactlyNow: LedgerEntry = { identifier: 'booklog.engagement.now', goalId: 'g', scheduledFor: NOW.toISOString() };
  assert(splitLedger([exactlyNow], new Set(), NOW).fired.length === 1, 'a reminder due exactly now counts as sent');

  // --- collectFired moves sent reminders to the outbox and keeps pending ones
  const storage = memoryStorage();
  recordScheduled(storage, [past, future]);
  const first = collectFired(storage, new Set([future.identifier]), NOW);
  assert(ids(first) === '2026-11-22', 'the fired reminder is collected');
  assert(ids(readOutbox(storage)) === '2026-11-22', 'the outbox holds the fired reminder');
  assert(ids(readLedger(storage)) === '2026-11-25', 'the ledger keeps only the pending reminder');

  // collecting again must not add it a second time
  const second = collectFired(storage, new Set([future.identifier]), NOW);
  assert(second.length === 0 && readOutbox(storage).length === 1, 'collecting twice does not duplicate');

  // the same reminder re-added to the ledger (a reschedule bug) is still deduplicated in the outbox
  recordScheduled(storage, [past]);
  assert(collectFired(storage, new Set(), NOW).length === 0, 'an already collected reminder is not collected again');
  assert(readOutbox(storage).length === 1, 'the outbox still has one entry');

  // --- removeFromOutbox only removes what was handled
  const outboxStorage = memoryStorage();
  recordScheduled(outboxStorage, [entry('2026-11-20'), entry('2026-11-21')]);
  collectFired(outboxStorage, new Set(), NOW);
  assert(readOutbox(outboxStorage).length === 2, 'two reminders are waiting');
  removeFromOutbox(outboxStorage, [entry('2026-11-20')]);
  assert(ids(readOutbox(outboxStorage)) === '2026-11-21', 'only the handled entry is removed');
  removeFromOutbox(outboxStorage, [entry('2026-11-21')]);
  assert(!outboxStorage.data.has(OUTBOX_STORAGE_KEY), 'an empty outbox removes its key');

  // --- recordScheduled replaces, and an empty list clears
  const replaced = memoryStorage();
  recordScheduled(replaced, [future]);
  recordScheduled(replaced, [entry('2026-11-27')]);
  assert(ids(readLedger(replaced)) === '2026-11-27', 'recording replaces the previous schedule');
  recordScheduled(replaced, []);
  assert(!replaced.data.has(LEDGER_STORAGE_KEY), 'an empty schedule clears the ledger');

  // --- clearEngagementLedger (account switch) clears both
  const cleared = memoryStorage();
  recordScheduled(cleared, [past]);
  collectFired(cleared, new Set(), NOW);
  recordScheduled(cleared, [future]);
  clearEngagementLedger(cleared);
  assert(readLedger(cleared).length === 0 && readOutbox(cleared).length === 0, 'clearing removes ledger and outbox');

  // --- stored data is untrusted
  const broken = memoryStorage();
  broken.setItem(LEDGER_STORAGE_KEY, '{not json');
  assert(readLedger(broken).length === 0, 'unreadable JSON becomes an empty ledger');
  broken.setItem(LEDGER_STORAGE_KEY, JSON.stringify({ not: 'a list' }));
  assert(readLedger(broken).length === 0, 'a non-list value becomes an empty ledger');
  broken.setItem(
    LEDGER_STORAGE_KEY,
    JSON.stringify([
      { identifier: 'a', goalId: 'g', scheduledFor: 'not-a-date' },
      { identifier: 5, goalId: 'g', scheduledFor: '2026-11-22T00:00:00.000Z' },
      past,
    ]),
  );
  assert(ids(readLedger(broken)) === '2026-11-22', 'invalid entries are skipped, valid ones kept');
}

run();
console.log('engagementLedger.test.ts passed');
