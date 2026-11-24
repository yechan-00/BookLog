/**
 * Temporary MVP dust cuts until product locks the values (PRD open item).
 * Levels: 0 if elapsed < 3, 1 if < 7, 2 if < 14, else 3.
 */
export const DUST_LEVEL_CUTS = [3, 7, 14] as const;

export const DUST_LEVEL_LABELS = ['깨끗함', '옅은 먼지', '먼지', '묵은 먼지'] as const;
