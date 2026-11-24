import {
  collectFired,
  readOutbox,
  recordScheduled,
  type LedgerEntry,
  type StorageLike,
} from './engagementLedger.ts';
import { flushEngagementOutbox } from './engagementLog.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function memoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const NOW = new Date('2026-11-24T12:00:00.000Z');

function entry(day: string): LedgerEntry {
  return { identifier: `booklog.engagement.${day}`, goalId: 'goal-1', scheduledFor: `${day}T12:00:00.000Z` };
}

function storageWithOutbox(days: string[]): StorageLike {
  const storage = memoryStorage();
  recordScheduled(storage, days.map(entry));
  collectFired(storage, new Set(), NOW);
  return storage;
}

class PermanentError extends Error {}
const isPermanent = (error: unknown): boolean => error instanceof PermanentError;

async function run(): Promise<void> {
  // everything is sent and the outbox empties
  let storage = storageWithOutbox(['2026-11-20', '2026-11-21']);
  const sentEntries: string[] = [];
  let result = await flushEngagementOutbox({
    storage,
    insert: async (item) => void sentEntries.push(item.scheduledFor),
    isPermanentFailure: isPermanent,
  });
  assert(result.sent === 2 && result.dropped === 0 && result.remaining === 0, 'both entries are sent');
  assert(readOutbox(storage).length === 0, 'the outbox is empty after a full flush');
  assert(sentEntries[0] === '2026-11-20T12:00:00.000Z', 'the scheduled time is what gets recorded as sent_at');

  // offline: nothing is lost and the rest are not attempted
  storage = storageWithOutbox(['2026-11-20', '2026-11-21', '2026-11-22']);
  let attempts = 0;
  result = await flushEngagementOutbox({
    storage,
    insert: async () => {
      attempts += 1;
      throw new Error('Network request failed');
    },
    isPermanentFailure: isPermanent,
  });
  assert(result.sent === 0 && result.remaining === 3, 'a temporary failure keeps everything');
  assert(attempts === 1, 'after a temporary failure the rest are not attempted');
  assert(readOutbox(storage).length === 3, 'the outbox is untouched after a temporary failure');

  // the next open retries and succeeds
  result = await flushEngagementOutbox({ storage, insert: async () => undefined, isPermanentFailure: isPermanent });
  assert(result.sent === 3 && readOutbox(storage).length === 0, 'a later flush sends what was kept');

  // a permanent failure drops only that entry and continues
  storage = storageWithOutbox(['2026-11-20', '2026-11-21', '2026-11-22']);
  const delivered: string[] = [];
  result = await flushEngagementOutbox({
    storage,
    insert: async (item) => {
      if (item.identifier.endsWith('2026-11-21')) {
        throw new PermanentError('foreign key violation');
      }
      delivered.push(item.identifier.slice(-10));
    },
    isPermanentFailure: isPermanent,
  });
  assert(result.sent === 2 && result.dropped === 1 && result.remaining === 0, 'the bad entry is dropped, others sent');
  assert(delivered.join(',') === '2026-11-20,2026-11-22', 'entries after a dropped one are still sent');
  assert(readOutbox(storage).length === 0, 'a dropped entry is not retried forever');

  // concurrent flushes share one run: no duplicate inserts
  storage = storageWithOutbox(['2026-11-20', '2026-11-21']);
  let inserts = 0;
  const deps = {
    storage,
    insert: async () => {
      inserts += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
    },
    isPermanentFailure: isPermanent,
  };
  const [a, b] = await Promise.all([flushEngagementOutbox(deps), flushEngagementOutbox(deps)]);
  assert(inserts === 2, `two overlapping flushes insert each entry once (got ${inserts})`);
  assert(a === b, 'overlapping flushes share the same result');

  // an entry collected while a flush is running is not lost
  storage = storageWithOutbox(['2026-11-20']);
  result = await flushEngagementOutbox({
    storage,
    insert: async () => {
      recordScheduled(storage, [entry('2026-11-21')]);
      collectFired(storage, new Set(), NOW);
    },
    isPermanentFailure: isPermanent,
  });
  assert(result.sent === 1, 'the first entry was sent');
  assert(
    readOutbox(storage).length === 1 && readOutbox(storage)[0]?.identifier.endsWith('2026-11-21') === true,
    'an entry added during the flush stays in the outbox',
  );

  // an empty outbox does nothing
  result = await flushEngagementOutbox({
    storage: memoryStorage(),
    insert: async () => {
      throw new Error('should not be called');
    },
    isPermanentFailure: isPermanent,
  });
  assert(result.sent === 0 && result.remaining === 0, 'nothing to send is a no-op');
}

await run();
console.log('engagementLog.test.ts passed');
