import type { BookStatus } from '@/types/book';

export type StatusChangePlan =
  | { kind: 'update'; next: Exclude<BookStatus, 'completed'> }
  | { kind: 'complete_flow' }
  | { kind: 'forbidden'; message: string };

/**
 * BOOK-03 / READ-05 policy:
 * - wishlist/reading/paused may move among themselves via row update
 * - completed requires complete_book (rating + review)
 * - completed books cannot return to reading/wishlist in MVP
 */
export function planBookStatusChange(from: BookStatus, to: BookStatus): StatusChangePlan {
  if (from === to) {
    return { kind: 'forbidden', message: '이미 같은 상태입니다.' };
  }

  if (from === 'completed') {
    return {
      kind: 'forbidden',
      message: '완독한 책은 MVP에서 다시 읽고 싶음·읽는 중으로 바꿀 수 없습니다.',
    };
  }

  if (to === 'completed') {
    return { kind: 'complete_flow' };
  }

  if (to === 'wishlist' || to === 'reading' || to === 'paused') {
    return { kind: 'update', next: to };
  }

  return { kind: 'forbidden', message: '허용되지 않는 상태 변경입니다.' };
}

export function statusChangeOptions(from: BookStatus): BookStatus[] {
  const candidates: BookStatus[] = ['wishlist', 'reading', 'paused', 'completed'];
  return candidates.filter((status) => planBookStatusChange(from, status).kind !== 'forbidden');
}
