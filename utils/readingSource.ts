import { fetchLibraryBooks } from '@/lib/api/books';
import { toError } from '@/lib/api/errors';
import { fetchReadingActivities } from '@/lib/api/sessions';
import { supabase } from '@/lib/supabase';
import type { LibraryBook } from '@/types/book';
import type { GoalPeriod, ReadingHistory } from '@/utils/readingPeriod';

export type LoadStatus<T> =
  | { status: 'unavailable' }
  | { status: 'error'; message: string }
  | { status: 'ready'; value: T };

function isGoalType(value: string): value is GoalPeriod['type'] {
  return value === 'time' || value === 'pages';
}

async function fetchGoalPeriods(): Promise<GoalPeriod[]> {
  const { data, error } = await supabase
    .from('reading_goals')
    .select('type, target_value, days_of_week, starts_on, ends_on')
    .order('starts_on', { ascending: true });

  if (error) {
    throw toError(error);
  }

  return data.flatMap((row) => {
    if (!isGoalType(row.type)) {
      return [];
    }

    if (!Array.isArray(row.days_of_week) || row.days_of_week.length === 0) {
      return [];
    }

    return [
      {
        type: row.type,
        targetValue: row.target_value,
        daysOfWeek: row.days_of_week,
        startsOn: row.starts_on,
        endsOn: row.ends_on,
      },
    ];
  });
}

function pickCurrentBook(books: LibraryBook[]): LibraryBook | null {
  const reading = books.filter((book) => book.status === 'reading');
  if (reading.length === 0) {
    return null;
  }

  return reading.slice().sort((left, right) => {
    const leftKey = left.lastReadAt ?? left.startedAt ?? '';
    const rightKey = right.lastReadAt ?? right.startedAt ?? '';
    return rightKey.localeCompare(leftKey);
  })[0] ?? null;
}

/** Loads goals plus all sessions for home/records/insights in two requests. */
export async function loadReadingHistory(): Promise<ReadingHistory> {
  const [goals, activities] = await Promise.all([fetchGoalPeriods(), fetchReadingActivities()]);
  return { goals, activities };
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
