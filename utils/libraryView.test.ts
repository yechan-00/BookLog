import type { LibraryBook } from '../types/book.ts';
import {
  filterLibraryBooks,
  libraryProgressPercent,
  libraryStats,
  sortLibraryBooks,
} from './libraryView.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function book(overrides: Partial<LibraryBook> & Pick<LibraryBook, 'userBookId' | 'title'>): LibraryBook {
  return {
    id: overrides.userBookId,
    userBookId: overrides.userBookId,
    title: overrides.title,
    author: overrides.author ?? '작가',
    coverColor: '#79543F',
    spineColor: '#79543F',
    totalPages: overrides.totalPages ?? 100,
    currentPage: overrides.currentPage ?? 0,
    status: overrides.status ?? 'wishlist',
    rating: null,
    startedAt: overrides.startedAt ?? null,
    completedAt: overrides.completedAt ?? null,
    lastReadAt: overrides.lastReadAt ?? null,
    createdAt: overrides.createdAt ?? '2026-11-01T00:00:00.000Z',
    coverImageUrl: overrides.coverImageUrl,
  };
}

function runLibraryViewChecks(): void {
  const books = [
    book({
      userBookId: '1',
      title: '아몬드',
      author: '손원평',
      status: 'reading',
      currentPage: 40,
      lastReadAt: '2026-11-10',
      createdAt: '2026-10-01T00:00:00.000Z',
    }),
    book({
      userBookId: '2',
      title: '데미안',
      status: 'completed',
      currentPage: 100,
      lastReadAt: '2026-11-01',
      createdAt: '2026-11-05T00:00:00.000Z',
    }),
    book({ userBookId: '3', title: '채식주의자', author: '한강', status: 'wishlist', createdAt: '2026-11-08T00:00:00.000Z' }),
    book({
      userBookId: '4',
      title: '코스모스',
      status: 'reading',
      currentPage: 80,
      lastReadAt: '2026-11-11',
      createdAt: '2026-09-01T00:00:00.000Z',
    }),
    book({
      userBookId: '5',
      title: '페이지미상',
      status: 'reading',
      totalPages: 0,
      currentPage: 10,
      lastReadAt: '2026-11-12',
      createdAt: '2026-08-01T00:00:00.000Z',
    }),
  ];

  const stats = libraryStats(books);
  assert(stats.completed === 1 && stats.reading === 3 && stats.wishlist === 1, 'stats count each status once');

  const reading = filterLibraryBooks(books, 'reading', '', 'recent');
  assert(reading[0]?.title === '페이지미상', 'recent sort prefers latest lastReadAt');
  assert(reading.some((item) => item.title === '아몬드'), 'reading filter keeps reading books');

  const searched = filterLibraryBooks(books, 'all', ' 아몬 ', 'title');
  assert(searched.length === 1 && searched[0]?.title === '아몬드', 'trimmed case-insensitive title search');

  const byAuthor = filterLibraryBooks(books, 'all', '한강', 'title');
  assert(byAuthor.length === 1 && byAuthor[0]?.title === '채식주의자', 'author search');

  const filteredSearch = filterLibraryBooks(books, 'reading', '코스', 'title');
  assert(filteredSearch.length === 1 && filteredSearch[0]?.title === '코스모스', 'filter + search');

  const byProgress = sortLibraryBooks(
    books.filter((item) => item.status === 'reading'),
    'progress',
  );
  assert(byProgress[0]?.title === '코스모스', 'progress sort is descending');
  assert(byProgress[byProgress.length - 1]?.title === '페이지미상', 'unknown progress sorts last');

  const byAdded = sortLibraryBooks(books, 'added');
  assert(byAdded[0]?.title === '채식주의자', 'added sort uses createdAt desc');

  const emptyProgress = libraryProgressPercent(
    book({ userBookId: 'x', title: 'x', status: 'reading', totalPages: 200, currentPage: 50 }),
  );
  assert(emptyProgress === 25, '50/200 is 25 percent');
  assert(libraryProgressPercent(books[2]!) === null, 'wishlist has no progress badge');
  assert(
    libraryProgressPercent(book({ userBookId: 'y', title: 'y', status: 'reading', totalPages: 0, currentPage: 1 })) ===
      null,
    'unknown total pages has no percent',
  );

  assert(filterLibraryBooks(books, 'wishlist', '없는책', 'title').length === 0, 'empty search result');
}

runLibraryViewChecks();
console.log('libraryView.test.ts passed');
