import { DUST_LEVEL_CUTS } from '@/constants/dustPolicy';
import type { BookStatus, LibraryBook } from '@/types/book';
import type { DustWipeRecord } from '@/lib/api/dust';
import {
  shelfGrowth,
  spineWidth,
  TEMP_SPINE_WIDTH_BANDS,
  type ShelfSpine,
} from '@/utils/shelfGrowth';
import { dustLevel, dustReference, type DustLevel } from '@/utils/shelfDust';

/** Neutral spine width when total pages are unknown (not treated as 0 pages). */
export const DEFAULT_SPINE_WIDTH = 32;

export interface DustBookView {
  userBookId: string;
  title: string;
  author: string;
  status: BookStatus;
  lastReadOn: string | null;
  addedOn: string | null;
  lastWipedOn: string | null;
  referenceOn: string | null;
  elapsedDays: number | null;
  dustLevel: DustLevel | null;
  currentPage: number;
  coverColor: string;
  coverImageUrl?: string;
}

export interface BookshelfDashboard {
  totalCount: number;
  readingCount: number;
  completedCount: number;
  dustyCount: number;
  completedSpines: (ShelfSpine & { displayWidth: number; author: string })[];
  dustBooks: DustBookView[];
}

function addedOnFromCreatedAt(createdAt: string | null | undefined): string | null {
  if (!createdAt) {
    return null;
  }
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDustEligibleStatus(status: BookStatus): boolean {
  return status === 'reading' || status === 'paused';
}

export function buildDustBookView(
  book: LibraryBook,
  todayKey: string,
  wipe: DustWipeRecord | undefined,
): DustBookView {
  const lastWipedOn = wipe?.wipedOn ?? null;
  const addedOn = addedOnFromCreatedAt(book.createdAt);
  const reference = dustReference({
    today: todayKey,
    lastReadOn: book.lastReadAt,
    addedOn,
    lastWipedOn,
  });
  const level =
    reference.elapsedDays === null ? null : dustLevel(reference.elapsedDays, DUST_LEVEL_CUTS);

  return {
    userBookId: book.userBookId,
    title: book.title,
    author: book.author,
    status: book.status,
    lastReadOn: book.lastReadAt,
    addedOn,
    lastWipedOn,
    referenceOn: reference.referenceOn,
    elapsedDays: reference.elapsedDays,
    dustLevel: level,
    currentPage: book.currentPage,
    coverColor: book.coverColor || book.spineColor,
    coverImageUrl: book.coverImageUrl,
  };
}

export function bookshelfDashboard(
  books: readonly LibraryBook[],
  todayKey: string,
  wipes: readonly DustWipeRecord[],
): BookshelfDashboard {
  const wipeByBook = new Map(wipes.map((wipe) => [wipe.userBookId, wipe]));
  const growth = shelfGrowth(
    books.map((book) => ({
      userBookId: book.userBookId,
      bookId: book.id,
      title: book.title,
      status: book.status,
      totalPages: book.totalPages,
      spineColor: book.spineColor || book.coverColor,
    })),
    TEMP_SPINE_WIDTH_BANDS,
  );

  const authorById = new Map(books.map((book) => [book.userBookId, book.author]));
  const completedSpines = growth.spines.map((spine) => ({
    ...spine,
    displayWidth: spine.width ?? DEFAULT_SPINE_WIDTH,
    author: authorById.get(spine.userBookId) ?? '',
  }));

  const dustBooks = books
    .filter((book) => isDustEligibleStatus(book.status))
    .map((book) => buildDustBookView(book, todayKey, wipeByBook.get(book.userBookId)))
    .sort((left, right) => {
      const leftLevel = left.dustLevel ?? -1;
      const rightLevel = right.dustLevel ?? -1;
      if (leftLevel !== rightLevel) {
        return rightLevel - leftLevel;
      }
      return left.title.localeCompare(right.title, 'ko');
    });

  const dustyCount = dustBooks.filter((book) => (book.dustLevel ?? 0) > 0).length;

  return {
    totalCount: books.length,
    readingCount: books.filter((book) => book.status === 'reading').length,
    completedCount: growth.completedCount,
    dustyCount,
    completedSpines,
    dustBooks,
  };
}

export function displaySpineWidth(totalPages: number | null): number {
  return spineWidth(totalPages, TEMP_SPINE_WIDTH_BANDS) ?? DEFAULT_SPINE_WIDTH;
}
