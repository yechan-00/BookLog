import { GOAL_TARGET_MAX } from '@/utils/goalForm';

/** Practical picker ceiling; validation still uses GOAL_TARGET_MAX. */
export const DURATION_PICKER_MAX_HOURS = 23;
export const DURATION_PICKER_MAX_MINUTES = DURATION_PICKER_MAX_HOURS * 60 + 59;
export const PAGE_PICKER_MAX = 999;

export type DurationParts = {
  hours: number;
  minutes: number;
};

export function totalMinutesToParts(totalMinutes: number): DurationParts {
  if (!Number.isSafeInteger(totalMinutes) || totalMinutes < 0) {
    return { hours: 0, minutes: 0 };
  }
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

export function partsToTotalMinutes(parts: DurationParts): number {
  return parts.hours * 60 + parts.minutes;
}

export function isValidDurationTotal(totalMinutes: number): boolean {
  return (
    Number.isSafeInteger(totalMinutes) &&
    totalMinutes >= 1 &&
    totalMinutes <= GOAL_TARGET_MAX
  );
}

export function isValidPageTarget(pages: number): boolean {
  return Number.isSafeInteger(pages) && pages >= 1 && pages <= GOAL_TARGET_MAX;
}

/** Hours list for the wheel, expanded if a saved value exceeds the usual max. */
export function durationHourOptions(currentTotalMinutes: number): number[] {
  const needed = Math.floor(Math.max(0, currentTotalMinutes) / 60);
  const maxHour = Math.min(
    Math.floor(GOAL_TARGET_MAX / 60),
    Math.max(DURATION_PICKER_MAX_HOURS, needed),
  );
  return Array.from({ length: maxHour + 1 }, (_, index) => index);
}

export function pageOptions(currentPages: number): number[] {
  const upper = Math.min(GOAL_TARGET_MAX, Math.max(PAGE_PICKER_MAX, Math.max(1, currentPages)));
  return Array.from({ length: upper }, (_, index) => index + 1);
}

export function formatDurationPreview(totalMinutes: number): string {
  if (!isValidDurationTotal(totalMinutes)) {
    return '시간을 선택해 주세요';
  }
  const { hours, minutes } = totalMinutesToParts(totalMinutes);
  if (hours === 0) {
    return `하루 ${minutes}분 읽기`;
  }
  if (minutes === 0) {
    return `하루 ${hours}시간 읽기`;
  }
  return `하루 ${hours}시간 ${minutes}분 읽기`;
}

export function formatDurationFieldLabel(totalMinutes: number): string {
  if (!Number.isSafeInteger(totalMinutes) || totalMinutes < 1) {
    return '시간 선택';
  }
  const { hours, minutes } = totalMinutesToParts(totalMinutes);
  if (hours === 0) {
    return `${minutes}분`;
  }
  if (minutes === 0) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${minutes}분`;
}

export function formatPagePreview(pages: number): string {
  if (!isValidPageTarget(pages)) {
    return '페이지를 선택해 주세요';
  }
  return `하루 ${pages}쪽 읽기`;
}

export function formatPageFieldLabel(pages: number): string {
  if (!Number.isSafeInteger(pages) || pages < 1) {
    return '페이지 선택';
  }
  return `${pages}쪽`;
}

export function clampDurationSelection(hours: number, minutes: number): number {
  const total = partsToTotalMinutes({ hours, minutes });
  if (total > GOAL_TARGET_MAX) {
    return GOAL_TARGET_MAX;
  }
  return total;
}
