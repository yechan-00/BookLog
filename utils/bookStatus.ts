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

export type StatusChangePlan =
  | { kind: 'update'; next: Exclude<BookStatus, 'completed'> }
  | { kind: 'complete_flow' }
  | { kind: 'forbidden'; message: string };

/**
 * Screen-side view of the BOOK-03 / READ-05 policy above:
 * - completing goes through the complete-book screen (rating + review), not a row update
 * - everything else is a plain status update
 */
export function planBookStatusChange(from: BookStatus, to: BookStatus): StatusChangePlan {
  if (from === to) {
    return { kind: 'forbidden', message: '이미 같은 상태입니다.' };
  }

  if (!canChangeStatus(from, to)) {
    return { kind: 'forbidden', message: '현재 상태에서는 바꿀 수 없는 상태입니다.' };
  }

  if (to === 'completed') {
    return { kind: 'complete_flow' };
  }

  return { kind: 'update', next: to };
}

export function statusChangeOptions(from: BookStatus): readonly BookStatus[] {
  return nextStatuses(from);
}
