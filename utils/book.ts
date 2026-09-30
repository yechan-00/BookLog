import type { BookStatus } from '@/types/book';

export const bookStatusLabel: Record<BookStatus, string> = {
  wishlist: '읽고 싶음',
  reading: '읽는 중',
  completed: '완독',
  paused: '잠시 멈춤',
};

export function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
