import { DUST_LEVEL_CUTS } from '../constants/dustPolicy.ts';
import type { LibraryBook } from '../types/book.ts';
import { bookshelfDashboard, DEFAULT_SPINE_WIDTH, displaySpineWidth } from './bookshelfView.ts';
import { dustLevel } from './shelfDust.ts';
import { TEMP_SPINE_WIDTH_BANDS } from './shelfGrowth.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function book(overrides: Partial<LibraryBook> = {}): LibraryBook {
  return {
    id: 'book-1',
    userBookId: 'ub-1',
    title: '테스트 책',
    author: '작가',
    coverColor: '#7C5340',
    spineColor: '#7C5340',
    totalPages: 300,
    currentPage: 40,
    status: 'reading',
    rating: null,
    startedAt: '2026-10-01',
    completedAt: null,
    lastReadAt: '2026-11-01',
    createdAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

function run(): void {
  assert(dustLevel(0, DUST_LEVEL_CUTS) === 0, 'fresh');
  assert(dustLevel(2, DUST_LEVEL_CUTS) === 0, 'under 3 days');
  assert(dustLevel(3, DUST_LEVEL_CUTS) === 1, '3 days');
  assert(dustLevel(6, DUST_LEVEL_CUTS) === 1, '6 days');
  assert(dustLevel(7, DUST_LEVEL_CUTS) === 2, '7 days');
  assert(dustLevel(13, DUST_LEVEL_CUTS) === 2, '13 days');
  assert(dustLevel(14, DUST_LEVEL_CUTS) === 3, '14 days');
  assert(dustLevel(40, DUST_LEVEL_CUTS) === 3, 'long idle');

  assert(displaySpineWidth(null) === DEFAULT_SPINE_WIDTH, 'unknown pages use default width');
  assert(displaySpineWidth(0) === DEFAULT_SPINE_WIDTH, 'invalid pages use default width');
  assert(displaySpineWidth(120) === TEMP_SPINE_WIDTH_BANDS[0]?.width, 'small book band');

  const dashboard = bookshelfDashboard(
    [
      book({ userBookId: 'r1', status: 'reading', lastReadAt: '2026-10-01' }),
      book({
        userBookId: 'c1',
        id: 'book-2',
        status: 'completed',
        completedAt: '2026-11-01',
        lastReadAt: '2026-11-01',
        totalPages: 500,
      }),
      book({
        userBookId: 'w1',
        id: 'book-3',
        status: 'wishlist',
        lastReadAt: null,
        currentPage: 0,
      }),
    ],
    '2026-11-24',
    [],
  );

  assert(dashboard.totalCount === 3, 'total books');
  assert(dashboard.completedCount === 1, 'completed on shelf');
  assert(dashboard.completedSpines[0]?.displayWidth === 44, '500 pages band');
  assert(dashboard.dustBooks.length === 1, 'only reading/paused get dust');
  assert((dashboard.dustBooks[0]?.dustLevel ?? 0) >= 2, 'stale reading book is dusty');
  assert(dashboard.dustyCount === 1, 'dusty count');

  const wiped = bookshelfDashboard(
    [book({ userBookId: 'r1', status: 'reading', lastReadAt: '2026-10-01' })],
    '2026-11-24',
    [{ userBookId: 'r1', wipedOn: '2026-11-24', wipedAt: '2026-11-24T01:00:00.000Z', dustLevel: 2 }],
  );
  assert(wiped.dustBooks[0]?.dustLevel === 0, 'wipe today clears dust');
  assert(wiped.dustyCount === 0, 'no dusty after wipe');
}

run();
console.log('bookshelfView.test.ts passed');
