import { toError } from '@/lib/api/errors';
import { toBookReview } from '@/lib/api/mappers';
import { supabase } from '@/lib/supabase';
import type { BookReview } from '@/types/reading';

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
