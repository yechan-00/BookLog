import type { LibraryBook } from '@/types/book';

/** One completion attributed to an explicit completed_on date. */
export type CalendarCompletedBook = {
  userBookId: string;
  bookId: string;
  title: string;
  author: string;
  coverColor: string;
  coverImageUrl?: string;
  completedDate: string;
};

/**
 * Groups shelf rows that have a real completed_on into date → books.
 * Does not invent dates from lastReadAt, createdAt, or status alone.
 * Representative order: stable userBookId descending (no completion time in schema).
 */
export function groupCompletionsByDate(
  books: readonly Pick<
    LibraryBook,
    | 'userBookId'
    | 'id'
    | 'title'
    | 'author'
    | 'coverColor'
    | 'coverImageUrl'
    | 'completedAt'
  >[],
): Record<string, CalendarCompletedBook[]> {
  const grouped: Record<string, CalendarCompletedBook[]> = {};

  for (const book of books) {
    if (!book.completedAt) {
      continue;
    }

    const entry: CalendarCompletedBook = {
      userBookId: book.userBookId,
      bookId: book.id,
      title: book.title,
      author: book.author,
      coverColor: book.coverColor,
      coverImageUrl: book.coverImageUrl,
      completedDate: book.completedAt,
    };

    const list = grouped[book.completedAt] ?? [];
    list.push(entry);
    grouped[book.completedAt] = list;
  }

  for (const dateKey of Object.keys(grouped)) {
    const list = grouped[dateKey];
    if (!list) {
      continue;
    }
    list.sort((a, b) => {
      if (a.userBookId === b.userBookId) {
        return 0;
      }
      return a.userBookId < b.userBookId ? 1 : -1;
    });
  }

  return grouped;
}

export function completionsForDate(
  byDate: Readonly<Record<string, CalendarCompletedBook[]>>,
  dateKey: string,
): CalendarCompletedBook[] {
  return byDate[dateKey] ?? [];
}
