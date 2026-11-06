import { toError } from '@/lib/api/errors';
import { supabase } from '@/lib/supabase';
import type { BookStatus, RegisteredBook } from '@/types/book';

const BOOK_STATUSES: readonly BookStatus[] = ['wishlist', 'reading', 'completed', 'paused'];

function isBookStatus(value: string): value is BookStatus {
  return (BOOK_STATUSES as readonly string[]).includes(value);
}

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
