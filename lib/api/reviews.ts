import { toError } from '@/lib/api/errors';
import { toBookReview } from '@/lib/api/mappers';
import { supabase } from '@/lib/supabase';
import type { BookReview } from '@/types/reading';
import { toDateKey } from '@/utils/date';

/** `completedAt` comes from the shelf entry, since the review row has no date of its own. */
export async function fetchReview(userBookId: string, completedAt: string): Promise<BookReview | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_book_id', userBookId)
    .maybeSingle();

  if (error) {
    throw toError(error);
  }

  return data ? toBookReview(data, completedAt) : null;
}

interface CompleteBookInput {
  userBookId: string;
  rating: number;
  content: string;
}

/** Saves the review and marks the book completed in one call (READ-05). */
export async function completeBook(input: CompleteBookInput): Promise<void> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error('별점은 1~5 사이의 정수여야 합니다.');
  }

  const { error } = await supabase.rpc('complete_book', {
    p_user_book_id: input.userBookId,
    p_rating: input.rating,
    p_content: input.content.trim(),
    // The completion day is the device's local date, so the client decides it.
    p_completed_on: toDateKey(new Date()),
  });

  if (error) {
    throw toError(error);
  }
}
