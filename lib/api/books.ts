import { toError } from '@/lib/api/errors';
import { fetchIndexes } from '@/lib/api/indexes';
import { isBookStatus, LIBRARY_SELECT, toLibraryBook } from '@/lib/api/mappers';
import { fetchReview } from '@/lib/api/reviews';
import { fetchSessions } from '@/lib/api/sessions';
import { supabase } from '@/lib/supabase';
import type { BookDetail, BookStatus, LibraryBook, RegisteredBook } from '@/types/book';
import { planBookStatusChange } from '@/utils/bookStatus';
import { startOfToday, toDateKey } from '@/utils/date';

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
 * Updates wishlist/reading/paused only. Does not clear sessions or pages.
 * Completing a book must use completeBook (READ-05).
 */
export async function updateUserBookStatus(
  userBookId: string,
  nextStatus: Exclude<BookStatus, 'completed'>,
): Promise<LibraryBook> {
  const current = await fetchLibraryBook(userBookId);
  const plan = planBookStatusChange(current.status, nextStatus);
  if (plan.kind !== 'update') {
    throw new Error(plan.kind === 'forbidden' ? plan.message : '완독은 완독 처리 화면에서 진행해 주세요.');
  }

  const { data, error } = await supabase
    .from('user_books')
    .update({ status: plan.next })
    .eq('id', userBookId)
    .select(LIBRARY_SELECT)
    .maybeSingle();

  if (error) {
    throw toError(error);
  }

  if (!data) {
    throw new Error('서재에서 책을 찾지 못했습니다.');
  }

  return toLibraryBook(data);
}

/** READ-05: rating + review + completed status via complete_book RPC. */
export async function completeBook(input: {
  userBookId: string;
  rating: number;
  content: string;
  completedOn?: string;
}): Promise<LibraryBook> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error('별점은 1부터 5까지의 정수여야 합니다.');
  }

  const content = input.content.trim();
  if (!content) {
    throw new Error('총평을 입력해 주세요.');
  }

  const current = await fetchLibraryBook(input.userBookId);
  const plan = planBookStatusChange(current.status, 'completed');
  if (plan.kind === 'forbidden') {
    throw new Error(plan.message);
  }

  const completedOn = input.completedOn ?? toDateKey(startOfToday());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(completedOn)) {
    throw new Error('완독일 형식이 올바르지 않습니다.');
  }

  const { error } = await supabase.rpc('complete_book', {
    p_user_book_id: input.userBookId,
    p_rating: input.rating,
    p_content: content,
    p_completed_on: completedOn,
  });

  if (error) {
    throw toError(error);
  }

  return fetchLibraryBook(input.userBookId);
}
