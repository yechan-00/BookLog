import { shelfGrowth, spineWidth, type ShelfBookInput } from './shelfGrowth.ts';
import { daysBetween, dustLevel, dustReference, dustWipeStatus } from './shelfDust.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const bands = [
  { maxPages: 200, width: 28 },
  { maxPages: 400, width: 36 },
  { maxPages: 10000, width: 48 },
];

function book(overrides: Partial<ShelfBookInput> = {}): ShelfBookInput {
  return {
    userBookId: 'user-book-1',
    bookId: 'book-1',
    title: '책',
    status: 'completed',
    totalPages: 120,
    spineColor: '#7C5340',
    ...overrides,
  };
}

function runShelfChecks(): void {
  const empty = shelfGrowth([], bands);
  assert(empty.completedCount === 0 && empty.spines.length === 0 && empty.knownPageTotal === null, 'no completed books');

  const one = shelfGrowth([book()], bands);
  assert(one.completedCount === 1 && one.spines[0]?.width === 28 && one.knownPageTotal === 120, 'one completed book');

  const many = shelfGrowth(
    [
      book({ userBookId: 'a', totalPages: 120 }),
      book({ userBookId: 'b', bookId: 'book-2', totalPages: 350 }),
      book({ userBookId: 'c', bookId: 'book-3', status: 'reading', totalPages: 500 }),
    ],
    bands,
  );
  assert(many.completedCount === 2 && many.knownPageTotal === 470, 'only completed books are summed');

  const missing = shelfGrowth([book({ totalPages: null }), book({ userBookId: 'b', totalPages: 0 })], bands);
  assert(missing.missingPageCount === 2 && missing.knownPageTotal === null, 'missing pages are not zero');
  assert(missing.spines.every((spine) => spine.width === null), 'missing pages have no thickness');

  const thick = spineWidth(5000, bands);
  assert(thick === 48, 'a larger page count uses the last supplied band');

  const duplicate = shelfGrowth(
    [book({ userBookId: 'same', totalPages: 120 }), book({ userBookId: 'same', totalPages: 400 })],
    bands,
  );
  assert(duplicate.completedCount === 1 && duplicate.knownPageTotal === 120, 'duplicate user book is kept once');

  const changed = shelfGrowth([book({ status: 'paused', totalPages: 300 })], bands);
  assert(changed.completedCount === 0, 'a book that is no longer completed leaves the shelf');
}

function runDustChecks(): void {
  const none = dustReference({ today: '2026-11-10', lastReadOn: null, addedOn: null, lastWipedOn: null });
  assert(none.referenceOn === null && none.elapsedDays === null, 'no anchor');

  const recent = dustReference({ today: '2026-11-10', lastReadOn: '2026-11-10', addedOn: '2026-11-01', lastWipedOn: null });
  assert(recent.elapsedDays === 0 && recent.referenceOn === '2026-11-10', 'read today');

  const stale = dustReference({ today: '2026-11-10', lastReadOn: '2026-10-01', addedOn: '2026-09-01', lastWipedOn: null });
  assert(stale.referenceOn === '2026-10-01' && stale.elapsedDays === daysBetween('2026-10-01', '2026-11-10'), 'old reading day');

  const added = dustReference({ today: '2026-11-10', lastReadOn: null, addedOn: '2026-11-08', lastWipedOn: null });
  assert(added.referenceOn === '2026-11-08' && added.elapsedDays === 2, 'added day is used when unread');

  const wiped = dustReference({
    today: '2026-11-10',
    lastReadOn: '2026-10-01',
    addedOn: null,
    lastWipedOn: '2026-11-10',
  });
  assert(wiped.referenceOn === '2026-11-10' && wiped.elapsedDays === 0, 'a wipe today becomes the anchor');

  const readAfterWipe = dustReference({
    today: '2026-11-12',
    lastReadOn: '2026-11-12',
    addedOn: null,
    lastWipedOn: '2026-11-10',
  });
  assert(readAfterWipe.referenceOn === '2026-11-12' && readAfterWipe.elapsedDays === 0, 'reading after a wipe moves the anchor');

  assert(daysBetween('2025-12-31', '2026-01-01') === 1, 'the day count crosses the year');
  assert(dustLevel(0, [1, 2, 3]) === 0, 'fixture cuts keep a fresh day at zero');
  assert(dustLevel(3, [1, 2, 3]) === 3, 'fixture cuts reach the last level');
  assert(dustLevel(3, [3, 2, 1]) === null, 'unordered cuts are rejected');
  assert(dustWipeStatus(false) === 'failed', 'a wipe without the save API is not saved');
}

function runShelfTests(): void {
  runShelfChecks();
  runDustChecks();
}

runShelfTests();
