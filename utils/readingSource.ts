import { fetchLibraryBooks } from '@/lib/api/books';
import { fetchGoalHistory, toGoalPeriod } from '@/lib/api/goals';
import { fetchSessions } from '@/lib/api/sessions';
import type { LibraryBook } from '@/types/book';
import type { ReadingActivity, ReadingHistory } from '@/utils/readingPeriod';

export type LoadStatus<T> =
  | { status: 'unavailable' }
  | { status: 'error'; message: string }
  | { status: 'ready'; value: T };

function pickCurrentBook(books: LibraryBook[]): LibraryBook | null {
  const reading = books.filter((book) => book.status === 'reading');
  if (reading.length === 0) {
    return null;
  }

  return (
    reading.slice().sort((left, right) => {
      const leftKey = left.lastReadAt ?? left.startedAt ?? '';
      const rightKey = right.lastReadAt ?? right.startedAt ?? '';
      return rightKey.localeCompare(leftKey);
    })[0] ?? null
  );
}

function compareActivitiesNewestFirst(left: ReadingActivity, right: ReadingActivity): number {
  const leftStart = left.startedAt ?? '';
  const rightStart = right.startedAt ?? '';
  if (leftStart !== rightStart) {
    return rightStart.localeCompare(leftStart);
  }
  const leftId = left.sessionId ?? '';
  const rightId = right.sessionId ?? '';
  return rightId.localeCompare(leftId);
}

/** Loads goals plus per-book sessions for home/records/insights. */
export async function loadReadingHistory(): Promise<ReadingHistory> {
  const [goalRows, books] = await Promise.all([fetchGoalHistory(), fetchLibraryBooks()]);
  const sessionGroups = await Promise.all(
    books.map(async (book) => {
      const sessions = await fetchSessions(book.userBookId);
      return sessions.map(
        (session): ReadingActivity => ({
          readOn: session.date,
          durationSeconds: session.duration,
          pagesRead: session.pagesRead,
          bookTitle: book.title,
          sessionId: session.id,
          userBookId: book.userBookId,
          author: book.author,
          coverColor: book.coverColor,
          coverImageUrl: book.coverImageUrl ?? null,
          startedAt: session.startTime,
          endedAt: session.endTime,
          startPage: session.startPage,
          endPage: session.endPage,
          focusExitCount: session.focusExitCount,
        }),
      );
    }),
  );

  return {
    goals: goalRows.map(toGoalPeriod),
    activities: sessionGroups.flat().sort(compareActivitiesNewestFirst),
  };
}

/** Ready null means the shelf loaded and no book is currently reading. */
export async function loadCurrentBook(): Promise<LibraryBook | null> {
  const books = await fetchLibraryBooks();
  return pickCurrentBook(books);
}

/** Ready empty means the shelf loaded and has no books. */
export async function loadLibraryBooks(): Promise<LibraryBook[]> {
  return fetchLibraryBooks();
}
