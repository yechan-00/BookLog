import type { BookStatus } from '@/types/book';

export interface ShelfBookInput {
  userBookId: string;
  bookId: string;
  title: string;
  status: BookStatus;
  totalPages: number | null;
  spineColor: string;
}

export interface SpineWidthBand {
  maxPages: number;
  width: number;
}

/**
 * Display widths only. The page bands are not a confirmed product rule.
 * Replace this table when the shelf thickness policy is decided.
 */
export const TEMP_SPINE_WIDTH_BANDS: readonly SpineWidthBand[] = [
  { maxPages: 200, width: 28 },
  { maxPages: 400, width: 36 },
  { maxPages: 10000, width: 48 },
];

export interface ShelfSpine {
  userBookId: string;
  bookId: string;
  title: string;
  spineColor: string;
  totalPages: number | null;
  width: number | null;
}

export interface ShelfGrowth {
  completedCount: number;
  /** Sum of valid page counts. Null when no completed book has a usable page count. */
  knownPageTotal: number | null;
  missingPageCount: number;
  spines: ShelfSpine[];
}

export function usablePageCount(totalPages: number | null): number | null {
  if (totalPages === null || !Number.isSafeInteger(totalPages) || totalPages < 1) {
    return null;
  }

  return totalPages;
}

export function spineWidth(totalPages: number | null, bands: readonly SpineWidthBand[]): number | null {
  const pages = usablePageCount(totalPages);
  if (pages === null) {
    return null;
  }

  const ordered = bands
    .filter((band) => Number.isSafeInteger(band.maxPages) && band.maxPages >= 1 && Number.isFinite(band.width) && band.width > 0)
    .slice()
    .sort((left, right) => left.maxPages - right.maxPages);
  const match = ordered.find((band) => pages <= band.maxPages);
  return match?.width ?? ordered[ordered.length - 1]?.width ?? null;
}

/** Completed books only. The same user book id is kept once. */
export function shelfGrowth(books: readonly ShelfBookInput[], bands: readonly SpineWidthBand[]): ShelfGrowth {
  const seen = new Set<string>();
  const spines: ShelfSpine[] = [];
  let knownPageTotal = 0;
  let knownCount = 0;
  let missingPageCount = 0;

  for (const book of books) {
    if (book.status !== 'completed' || seen.has(book.userBookId)) {
      continue;
    }

    seen.add(book.userBookId);
    const pages = usablePageCount(book.totalPages);
    if (pages === null) {
      missingPageCount += 1;
    } else {
      knownPageTotal += pages;
      knownCount += 1;
    }

    spines.push({
      userBookId: book.userBookId,
      bookId: book.bookId,
      title: book.title,
      spineColor: book.spineColor,
      totalPages: pages,
      width: spineWidth(book.totalPages, bands),
    });
  }

  return {
    completedCount: spines.length,
    knownPageTotal: knownCount === 0 ? null : knownPageTotal,
    missingPageCount,
    spines,
  };
}
