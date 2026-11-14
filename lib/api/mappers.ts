import type { BookStatus, LibraryBook } from '@/types/book';
import type { Database } from '@/types/database';
import type { BookIndex, BookReview, ReadingSession } from '@/types/reading';
import { pickBookColor } from '@/utils/bookColors';
import { parseIndexColor, parseStoredTags } from '@/utils/bookIndex';

type Tables = Database['public']['Tables'];

const BOOK_STATUSES: readonly BookStatus[] = ['wishlist', 'reading', 'completed', 'paused'];

export function isBookStatus(value: string): value is BookStatus {
  return (BOOK_STATUSES as readonly string[]).includes(value);
}

/** Columns selected from `user_books` joined with `books`. Keep in sync with LIBRARY_SELECT. */
export interface LibraryRow {
  id: string;
  book_id: string;
  status: string;
  total_pages: number;
  current_page: number;
  started_on: string | null;
  completed_on: string | null;
  last_read_on: string | null;
  books: { title: string; author: string; cover_url: string | null } | null;
}

export const LIBRARY_SELECT =
  'id, book_id, status, total_pages, current_page, started_on, completed_on, last_read_on, books(title, author, cover_url)';

export function toLibraryBook(row: LibraryRow): LibraryBook {
  if (!isBookStatus(row.status)) {
    throw new Error(`알 수 없는 독서 상태입니다: ${row.status}`);
  }

  if (!row.books) {
    throw new Error('도서 정보를 찾지 못했습니다.');
  }

  const color = pickBookColor(row.book_id);

  return {
    id: row.book_id,
    userBookId: row.id,
    title: row.books.title,
    author: row.books.author,
    coverColor: color,
    coverImageUrl: row.books.cover_url ?? undefined,
    spineColor: color,
    totalPages: row.total_pages,
    currentPage: row.current_page,
    status: row.status,
    rating: null,
    startedAt: row.started_on,
    completedAt: row.completed_on,
    lastReadAt: row.last_read_on,
  };
}

export function toReadingSession(row: Tables['reading_sessions']['Row']): ReadingSession {
  return {
    id: row.id,
    bookId: row.user_book_id,
    date: row.read_on,
    startTime: row.started_at,
    endTime: row.ended_at,
    duration: row.duration_seconds,
    startPage: row.start_page,
    endPage: row.end_page,
    // Generated column, so the generated types mark it nullable.
    pagesRead: row.pages_read ?? Math.max(row.end_page - row.start_page, 0),
    focusExitCount: row.focus_exit_count,
    oneLineReview: row.one_line_review,
  };
}

export function toBookIndex(row: Tables['book_indexes']['Row']): BookIndex {
  return {
    id: row.id,
    bookId: row.user_book_id,
    sessionId: row.session_id,
    page: row.page,
    title: row.title,
    quote: row.quote,
    color: parseIndexColor(row.color),
    tags: parseStoredTags(row.tags),
    createdAt: row.created_at,
  };
}

export function toBookReview(
  row: Tables['reviews']['Row'],
  completedAt: string,
): BookReview {
  return {
    id: row.id,
    bookId: row.user_book_id,
    completedAt,
    rating: row.rating,
    review: row.content,
  };
}
