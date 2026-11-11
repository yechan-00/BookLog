import { spinePalette, type SpinePaletteColor } from '@/constants/colors';

/** Stable unsigned hash so the same book keeps the same display traits. */
export function stableHash(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function spineHeightFor(seed: string): number {
  return 118 + (stableHash(seed) % 31);
}

export function spinePaletteColorFor(seed: string): SpinePaletteColor {
  return spinePalette[stableHash(seed) % spinePalette.length] ?? spinePalette[0];
}
