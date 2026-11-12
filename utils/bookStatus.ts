import type { BookStatus } from '@/types/book';

/**
 * Which status a book can move to from its current one (BOOK-03).
 * A book being read cannot go straight back to wishlist: pause it (or finish it) first.
 */
const NEXT_STATUSES: Record<BookStatus, readonly BookStatus[]> = {
  wishlist: ['reading'],
  reading: ['paused', 'completed'],
  paused: ['reading', 'wishlist', 'completed'],
  completed: ['wishlist'],
};

export function nextStatuses(from: BookStatus): readonly BookStatus[] {
  return NEXT_STATUSES[from];
}

export function canChangeStatus(from: BookStatus, to: BookStatus): boolean {
  return NEXT_STATUSES[from].includes(to);
}
