import type { BookStatus, LibraryBook } from '@/types/book';
import { clampPercent } from '@/utils/format';

export type LibraryFilter = 'all' | 'reading' | 'completed' | 'wishlist' | 'paused';
export type LibrarySort = 'added' | 'recent' | 'title' | 'progress';
export type LibraryViewMode = 'grid' | 'list';

export type LibraryStats = {
  completed: number;
  reading: number;
  wishlist: number;
  paused: number;
};

export function libraryStats(books: readonly LibraryBook[]): LibraryStats {
  return {
    completed: books.filter((book) => book.status === 'completed').length,
    reading: books.filter((book) => book.status === 'reading').length,
    wishlist: books.filter((book) => book.status === 'wishlist').length,
    paused: books.filter((book) => book.status === 'paused').length,
  };
}

export function matchesLibraryQuery(book: LibraryBook, query: string): boolean {
  const trimmed = query.trim().toLocaleLowerCase('ko-KR');
  if (!trimmed) {
    return true;
  }

  const title = book.title.toLocaleLowerCase('ko-KR');
  const author = book.author.toLocaleLowerCase('ko-KR');
  return title.includes(trimmed) || author.includes(trimmed);
}

export function matchesLibraryFilter(book: LibraryBook, filter: LibraryFilter): boolean {
  if (filter === 'all') {
    return true;
  }

  return book.status === filter;
}

function progressOf(book: LibraryBook): number | null {
  if (!Number.isFinite(book.totalPages) || book.totalPages <= 0) {
    return null;
  }

  if (!Number.isFinite(book.currentPage) || book.currentPage < 0) {
    return null;
  }

  return clampPercent(book.currentPage, book.totalPages);
}

function compareByTitle(a: LibraryBook, b: LibraryBook): number {
  const byTitle = a.title.localeCompare(b.title, 'ko-KR');
  if (byTitle !== 0) {
    return byTitle;
  }
  return a.userBookId.localeCompare(b.userBookId);
}

function compareRecentRead(a: LibraryBook, b: LibraryBook): number {
  const aKey = a.lastReadAt ?? '';
  const bKey = b.lastReadAt ?? '';
  if (aKey === bKey) {
    return compareByTitle(a, b);
  }

  if (!aKey) {
    return 1;
  }

  if (!bKey) {
    return -1;
  }

  return bKey.localeCompare(aKey);
}

function compareAdded(a: LibraryBook, b: LibraryBook): number {
  if (a.createdAt === b.createdAt) {
    return compareByTitle(a, b);
  }

  return b.createdAt.localeCompare(a.createdAt);
}

export function sortLibraryBooks(books: readonly LibraryBook[], sort: LibrarySort): LibraryBook[] {
  const next = [...books];

  next.sort((a, b) => {
    if (sort === 'title') {
      return compareByTitle(a, b);
    }

    if (sort === 'progress') {
      const aProgress = progressOf(a);
      const bProgress = progressOf(b);
      if (aProgress === bProgress) {
        return compareByTitle(a, b);
      }

      if (aProgress == null) {
        return 1;
      }

      if (bProgress == null) {
        return -1;
      }

      return bProgress - aProgress;
    }

    if (sort === 'added') {
      return compareAdded(a, b);
    }

    return compareRecentRead(a, b);
  });

  return next;
}

export function filterLibraryBooks(
  books: readonly LibraryBook[],
  filter: LibraryFilter,
  query: string,
  sort: LibrarySort,
): LibraryBook[] {
  const filtered = books.filter(
    (book) => matchesLibraryFilter(book, filter) && matchesLibraryQuery(book, query),
  );
  return sortLibraryBooks(filtered, sort);
}

export function libraryProgressPercent(book: LibraryBook): number | null {
  if (book.status !== 'reading' && book.status !== 'paused') {
    return null;
  }

  return progressOf(book);
}

export function filterEmptyMessage(filter: LibraryFilter): string {
  switch (filter) {
    case 'reading':
      return '읽는 중인 책이 없어요.';
    case 'completed':
      return '완독한 책이 없어요.';
    case 'wishlist':
      return '읽고 싶은 책이 없어요.';
    case 'paused':
      return '임시 중단한 책이 없어요.';
    default:
      return '조건에 맞는 책이 없어요.';
  }
}

export function isStatusFilter(status: BookStatus): status is Exclude<LibraryFilter, 'all'> {
  return status === 'reading' || status === 'completed' || status === 'wishlist' || status === 'paused';
}
