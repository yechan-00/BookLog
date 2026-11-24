import {
  readOutbox,
  removeFromOutbox,
  type LedgerEntry,
  type StorageLike,
} from '@/lib/notifications/engagementLedger';

export interface FlushResult {
  sent: number;
  /** Entries that can never be saved (for example the goal belongs to another account). */
  dropped: number;
  /** Entries kept for the next try after a temporary failure. */
  remaining: number;
}

export interface FlushDeps {
  storage: StorageLike;
  insert: (entry: LedgerEntry) => Promise<void>;
  /** True when retrying can never succeed, so the entry is dropped instead of retried forever. */
  isPermanentFailure: (error: unknown) => boolean;
}

let inFlight: Promise<FlushResult> | null = null;

async function flush({ storage, insert, isPermanentFailure }: FlushDeps): Promise<FlushResult> {
  const pending = readOutbox(storage);
  const done: LedgerEntry[] = [];
  let sent = 0;
  let dropped = 0;

  for (const entry of pending) {
    try {
      await insert(entry);
      sent += 1;
      done.push(entry);
    } catch (error) {
      if (isPermanentFailure(error)) {
        dropped += 1;
        done.push(entry);
        continue;
      }

      // A temporary failure (offline, server down) would fail for the rest too: keep them for the next open.
      break;
    }
  }

  removeFromOutbox(storage, done);
  return { sent, dropped, remaining: pending.length - done.length };
}

/**
 * Saves outbox entries to the server. Concurrent calls share one run, so the same reminder is not
 * inserted twice when the app opens and foregrounds at the same time.
 */
export function flushEngagementOutbox(deps: FlushDeps): Promise<FlushResult> {
  if (!inFlight) {
    inFlight = flush(deps).finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}
