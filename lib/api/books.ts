import { toError } from '@/lib/api/errors';
import { fetchIndexes } from '@/lib/api/indexes';
import { isBookStatus, LIBRARY_SELECT, toLibraryBook } from '@/lib/api/mappers';
import { fetchReview } from '@/lib/api/reviews';
import { fetchSessions } from '@/lib/api/sessions';
import { supabase } from '@/lib/supabase';
import type { BookDetail, BookStatus, LibraryBook, RegisteredBook } from '@/types/book';
import type { Database } from '@/types/database';
import { bookStatusLabel } from '@/utils/book';
import { canChangeStatus } from '@/utils/bookStatus';
import { toDateKey } from '@/utils/date';

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

/**
 * Moves a shelf entry to another status (BOOK-03). Completing goes through `completeBook`, which also
 * stores the review. Going from completed back to wishlist starts the book over (progress 0), while the
 * old sessions stay in the history. `from` is checked against the saved row so a stale screen cannot overwrite it.
 */
export async function updateBookStatus(userBookId: string, from: BookStatus, to: BookStatus): Promise<void> {
  if (to === 'completed') {
    throw new Error('완독은 완독 처리 화면에서만 바꿀 수 있습니다.');
  }

  if (!canChangeStatus(from, to)) {
    throw new Error(`'${bookStatusLabel[from]}' 상태에서 '${bookStatusLabel[to]}' 상태로 바꿀 수 없습니다.`);
  }

  const { data: current, error: readError } = await supabase
    .from('user_books')
    .select('status, started_on')
    .eq('id', userBookId)
    .maybeSingle();

  if (readError) {
    throw toError(readError);
  }

  if (!current) {
    throw new Error('서재에서 책을 찾지 못했습니다.');
  }

  if (current.status !== from) {
    throw new Error('책 상태가 이미 바뀌었어요. 화면을 새로 불러온 뒤 다시 시도해 주세요.');
  }

  const patch: Database['public']['Tables']['user_books']['Update'] = { status: to };
  if (to === 'reading' && !current.started_on) {
    patch.started_on = toDateKey(new Date());
  }

  if (from === 'completed') {
    patch.completed_on = null;
    patch.started_on = null;
    patch.current_page = 0;
  }

  const { data, error } = await supabase
    .from('user_books')
    .update(patch)
    .eq('id', userBookId)
    .eq('status', from)
    .select('id');

  if (error) {
    throw toError(error);
  }

  if (data.length === 0) {
    throw new Error('책 상태를 바꾸지 못했습니다.');
  }
}
