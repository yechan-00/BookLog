import type { LibraryBook } from '@/types/book';
import type { ReadingHistory } from '@/utils/readingPeriod';

export type LoadStatus<T> =
  | { status: 'unavailable' }
  | { status: 'error'; message: string }
  | { status: 'ready'; value: T };

/** Session and goal history. Null is not used: unavailable, error, and ready stay separate. */
export function loadReadingHistory(): LoadStatus<ReadingHistory> {
  return { status: 'unavailable' };
}

/** The book currently in progress. Ready null means the shelf was loaded and none is in progress. */
export function loadCurrentBook(): LoadStatus<LibraryBook | null> {
  return { status: 'unavailable' };
}

/** The signed-in user's shelf. Ready empty means the shelf loaded and has no books. */
export function loadLibraryBooks(): LoadStatus<LibraryBook[]> {
  return { status: 'unavailable' };
}
