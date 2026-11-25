/** 12-hour wheel value ↔ 24-hour HH:mm used by reminder_time. */

export type DayPeriod = 'am' | 'pm';

export type WheelClock = {
  period: DayPeriod;
  hour12: number;
  minute: number;
};

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Parses HH:mm or HH:mm:ss into a wheel clock. Invalid → null. */
export function hhmmToWheelClock(value: string | null | undefined): WheelClock | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isInteger(hour24) ||
    !Number.isInteger(minute) ||
    hour24 < 0 ||
    hour24 > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const period: DayPeriod = hour24 < 12 ? 'am' : 'pm';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { period, hour12, minute };
}

export function wheelClockToHhmm(clock: WheelClock): string {
  const { period, hour12, minute } = clock;
  if (!Number.isInteger(hour12) || hour12 < 1 || hour12 > 12) {
    throw new Error('hour12 must be 1–12');
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error('minute must be 0–59');
  }

  let hour24: number;
  if (period === 'am') {
    hour24 = hour12 === 12 ? 0 : hour12;
  } else {
    hour24 = hour12 === 12 ? 12 : hour12 + 12;
  }

  return `${pad2(hour24)}:${pad2(minute)}`;
}

export function formatWheelClockPreview(clock: WheelClock, options?: { notifyTone?: boolean }): string {
  const periodLabel = clock.period === 'am' ? '오전' : '오후';
  const minutePart = clock.minute === 0 ? '' : ` ${pad2(clock.minute)}분`;
  const core = `${periodLabel} ${clock.hour12}시${minutePart}`;
  if (options?.notifyTone === false) {
    return `선택한 알림 시간: ${core}`;
  }
  if (clock.minute === 0) {
    return `${periodLabel} ${clock.hour12}시에 알려드려요.`;
  }
  return `${periodLabel} ${clock.hour12}시 ${pad2(clock.minute)}분에 알려드려요.`;
}

export const WHEEL_HOUR12_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const WHEEL_MINUTE_VALUES = Array.from({ length: 60 }, (_, index) => index);
