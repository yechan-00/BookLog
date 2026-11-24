import { toDateKey } from '../../utils/date.ts';
import { queueResult, recordedCalls, resetFakeSupabase } from '../../utils/testing/fakeSupabase.ts';
import { updateBookStatus } from './books.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function messageOf(action: () => Promise<unknown>): Promise<string> {
  try {
    await action();
    return '';
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function patchOf(callIndex: number): Record<string, unknown> {
  const step = recordedCalls[callIndex]?.steps.find(([name]) => name === 'update');
  return (step?.[1][0] ?? {}) as Record<string, unknown>;
}

function guardOf(callIndex: number): string {
  return (recordedCalls[callIndex]?.steps ?? [])
    .filter(([name]) => name === 'eq')
    .map(([, args]) => args.join('='))
    .join(',');
}

async function run(): Promise<void> {
  // rules are checked before any request
  resetFakeSupabase();
  assert(
    /완독 처리 화면/.test(await messageOf(() => updateBookStatus('ub-1', 'reading', 'completed'))),
    'completing is only allowed from the complete-book screen',
  );
  assert(
    /바꿀 수 없습니다/.test(await messageOf(() => updateBookStatus('ub-1', 'reading', 'wishlist'))),
    'reading cannot go straight back to wishlist',
  );
  assert(
    /바꿀 수 없습니다/.test(await messageOf(() => updateBookStatus('ub-1', 'wishlist', 'paused'))),
    'wishlist cannot jump to paused',
  );
  assert(recordedCalls.length === 0, 'forbidden changes make no request');

  // wishlist -> reading stamps started_on and guards on the old status
  resetFakeSupabase();
  queueResult({ status: 'wishlist', started_on: null });
  queueResult([{ id: 'ub-1' }]);
  await updateBookStatus('ub-1', 'wishlist', 'reading');
  assert(recordedCalls.length === 2, 'one read, one guarded update');
  const start = patchOf(1);
  assert(start.status === 'reading' && start.started_on === toDateKey(new Date()), 'start date is stamped when missing');
  assert(guardOf(1) === 'id=ub-1,status=wishlist', 'update only applies if the status is still the old one');

  // an existing start date is kept
  resetFakeSupabase();
  queueResult({ status: 'paused', started_on: '2026-10-01' });
  queueResult([{ id: 'ub-1' }]);
  await updateBookStatus('ub-1', 'paused', 'reading');
  assert(!('started_on' in patchOf(1)), 'resuming keeps the original start date');

  // completed -> wishlist starts the book over
  resetFakeSupabase();
  queueResult({ status: 'completed', started_on: '2026-10-01' });
  queueResult([{ id: 'ub-1' }]);
  await updateBookStatus('ub-1', 'completed', 'wishlist');
  const restart = patchOf(1);
  assert(
    restart.status === 'wishlist' &&
      restart.completed_on === null &&
      restart.started_on === null &&
      restart.current_page === 0,
    'returning a finished book to wishlist clears completion, start and progress',
  );

  // stale screen
  resetFakeSupabase();
  queueResult({ status: 'paused', started_on: null });
  assert(
    /이미 바뀌었어요/.test(await messageOf(() => updateBookStatus('ub-1', 'reading', 'paused'))),
    'a stale status is reported',
  );
  assert(recordedCalls.length === 1, 'a stale status does not write');

  // book missing / lost the race
  resetFakeSupabase();
  queueResult(null);
  assert(
    /찾지 못했습니다/.test(await messageOf(() => updateBookStatus('ub-1', 'reading', 'paused'))),
    'a missing book is reported',
  );

  resetFakeSupabase();
  queueResult({ status: 'reading', started_on: '2026-10-01' });
  queueResult([]);
  assert(
    /바꾸지 못했습니다/.test(await messageOf(() => updateBookStatus('ub-1', 'reading', 'paused'))),
    'zero updated rows is an error',
  );
}

await run();
console.log('books.test.ts passed');
