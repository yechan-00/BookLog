import { colors } from '@/constants/colors';
import type { BookStatus } from '@/types/book';

const fallbackCoverColors = [colors.accent, colors.text, colors.positive, colors.warning] as const;

export const bookStatusLabel: Record<BookStatus, string> = {
  wishlist: '읽고 싶음',
  reading: '읽는 중',
  completed: '완독',
  paused: '임시 중단',
};

export function fallbackCoverColor(title: string): string {
  let total = 0;
  for (const char of title) {
    total += char.charCodeAt(0);
  }

  return fallbackCoverColors[total % fallbackCoverColors.length] ?? colors.accent;
}

export function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
