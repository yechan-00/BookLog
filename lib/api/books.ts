import { toError } from '@/lib/api/errors';
import { fetchIndexes } from '@/lib/api/indexes';
import { isBookStatus, LIBRARY_SELECT, toLibraryBook } from '@/lib/api/mappers';
import { fetchReview } from '@/lib/api/reviews';
import { fetchSessions } from '@/lib/api/sessions';
import { supabase } from '@/lib/supabase';
import type { BookDetail, LibraryBook, RegisteredBook } from '@/types/book';

interface RegisterBookInput {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  coverImageUrl: string | null;
  totalPages: number;
}

/** Saves the book (reusing an existing ISBN row) and puts it on the user's shelf. */
export async function registerBook(input: RegisterBookInput): Promise<RegisteredBook> {
  if (!Number.isInteger(input.totalPages) || input.totalPages < 1) {
    throw new Error('총 페이지는 1 이상의 정수여야 합니다.');
  }

  const { data, error } = await supabase.rpc('register_book', {
    p_isbn: input.isbn,
    p_title: input.title,
    p_author: input.author,
    p_publisher: input.publisher,
    p_cover_url: input.coverImageUrl ?? '',
    p_total_pages: input.totalPages,
  });

  if (error) {
    throw toError(error);
  }

  if (!isBookStatus(data.status)) {
    throw new Error(`알 수 없는 독서 상태입니다: ${data.status}`);
  }

  return {
    userBookId: data.id,
    bookId: data.book_id,
    status: data.status,
    totalPages: data.total_pages,
  };
}

export async function fetchLibraryBooks(): Promise<LibraryBook[]> {
  const { data, error } = await supabase
    .from('user_books')
    .select(LIBRARY_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    throw toError(error);
  }

  return data.map(toLibraryBook);
}

export async function fetchLibraryBook(userBookId: string): Promise<LibraryBook> {
  const { data, error } = await supabase
    .from('user_books')
    .select(LIBRARY_SELECT)
    .eq('id', userBookId)
    .maybeSingle();

  if (error) {
    throw toError(error);
  }

  if (!data) {
    throw new Error('서재에서 책을 찾지 못했습니다.');
  }

  return toLibraryBook(data);
}

export async function fetchBookDetail(userBookId: string): Promise<BookDetail> {
  const [book, sessions, indexes] = await Promise.all([
    fetchLibraryBook(userBookId),
    fetchSessions(userBookId),
    fetchIndexes(userBookId),
  ]);
  const review =
    book.status === 'completed' && book.completedAt
      ? await fetchReview(userBookId, book.completedAt)
      : null;

  return {
    book,
    sessions,
    indexes,
    review,
    totalDurationSeconds: sessions.reduce((sum, session) => sum + session.duration, 0),
  };
}

/**
 * Removes the book from the user's shelf. Its sessions, indexes, review and dust-wipe logs go with it
 * (cascade); the shared `books` catalog row stays for other users.
 */
export async function deleteUserBook(userBookId: string): Promise<void> {
  const { data, error } = await supabase.from('user_books').delete().eq('id', userBookId).select('id');

  if (error) {
    throw toError(error);
  }

  if (data.length === 0) {
    throw new Error('삭제할 책을 찾지 못했습니다.');
  }
}
