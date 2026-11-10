import { parseDateKey, toDateKey } from '@/utils/date';

export interface DustDates {
  today: string;
  lastReadOn: string | null;
  /** Day the book was added to the shelf. Used only when there is no reading day. */
  addedOn: string | null;
  lastWipedOn: string | null;
}

export interface DustReference {
  referenceOn: string | null;
  elapsedDays: number | null;
}

export type DustLevel = 0 | 1 | 2 | 3;

export type DustWipeStatus = 'idle' | 'wiping' | 'saving' | 'saved' | 'failed';

function isDateKey(value: string | null): value is string {
  if (value === null || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return toDateKey(parseDateKey(value)) === value;
}

export function daysBetween(fromKey: string, toKey: string): number | null {
  if (!isDateKey(fromKey) || !isDateKey(toKey)) {
    return null;
  }

  const milliseconds = parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime();
  return Math.round(milliseconds / 86_400_000);
}

/**
 * The dust anchor is the later of the reading anchor and the last wipe.
 * The reading anchor is the last reading day, or the added day when the book has no reading day.
 * This does not read duration, pages, goals, or streaks.
 */
export function dustReference(dates: DustDates): DustReference {
  if (!isDateKey(dates.today)) {
    return { referenceOn: null, elapsedDays: null };
  }

  const readingAnchor = isDateKey(dates.lastReadOn)
    ? dates.lastReadOn
    : isDateKey(dates.addedOn)
      ? dates.addedOn
      : null;
  const wipeAnchor = isDateKey(dates.lastWipedOn) ? dates.lastWipedOn : null;
  const candidates = [readingAnchor, wipeAnchor].filter((value): value is string => value !== null);
  if (candidates.length === 0) {
    return { referenceOn: null, elapsedDays: null };
  }

  const referenceOn = candidates.reduce((latest, value) => (value > latest ? value : latest));
  const elapsed = daysBetween(referenceOn, dates.today);
  if (elapsed === null) {
    return { referenceOn: null, elapsedDays: null };
  }

  return { referenceOn, elapsedDays: Math.max(0, elapsed) };
}

/**
 * Maps elapsed days to levels 0–3 using caller-supplied cuts.
 * Cuts must be three increasing day counts. This file does not choose the product cuts.
 */
export function dustLevel(elapsedDays: number, cuts: readonly number[]): DustLevel | null {
  if (!Number.isSafeInteger(elapsedDays) || elapsedDays < 0 || cuts.length !== 3) {
    return null;
  }

  const [first, second, third] = cuts;
  if (
    first === undefined ||
    second === undefined ||
    third === undefined ||
    !Number.isSafeInteger(first) ||
    !Number.isSafeInteger(second) ||
    !Number.isSafeInteger(third) ||
    first < 1 ||
    !(first < second && second < third)
  ) {
    return null;
  }

  if (elapsedDays < first) {
    return 0;
  }
  if (elapsedDays < second) {
    return 1;
  }
  if (elapsedDays < third) {
    return 2;
  }
  return 3;
}

/** A wipe is saved only by the dust-log API. Local display must not report success. */
export function dustWipeStatus(saved: boolean): Extract<DustWipeStatus, 'saved' | 'failed'> {
  return saved ? 'saved' : 'failed';
}
