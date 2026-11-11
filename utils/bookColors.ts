import { bookCoverPalette } from '@/constants/colors';

/** Same seed always gives the same color, so a book keeps its look across sessions. */
export function pickBookColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return bookCoverPalette[hash % bookCoverPalette.length];
}
