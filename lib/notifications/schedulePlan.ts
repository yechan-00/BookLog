/** Local calendar helpers for notification scheduling. Weekdays match `types/goal.ts`: 0 is Sunday. */

export const GOAL_REACHED_IDENTIFIER = 'booklog.goal-reached';
export const ENGAGEMENT_ID_PREFIX = 'booklog.engagement.';
export const ENGAGEMENT_HORIZON_DAYS = 14;

const WEEKDAY_COUNT = 7;

export function engagementIdentifier(localDate: string): string {
  return `${ENGAGEMENT_ID_PREFIX}${localDate}`;
}

export function isEngagementIdentifier(identifier: string): boolean {
  return identifier.startsWith(ENGAGEMENT_ID_PREFIX);
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseReminderTime(value: string): { hour: number; minute: number } | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(value.trim());
  if (!match) {
    return null;
  }

  return { hour: Number(match[1]), minute: Number(match[2]) };
}

export function normalizeWeekdays(days: readonly number[]): number[] {
  const unique = new Set<number>();
  for (const day of days) {
    if (Number.isInteger(day) && day >= 0 && day < WEEKDAY_COUNT) {
      unique.add(day);
    }
  }

  return [...unique].sort((left, right) => left - right);
}

export type GoalReachedDecision =
  | { action: 'schedule'; seconds: number }
  | { action: 'skip'; reason: 'not_time_goal' | 'already_achieved' | 'invalid_goal' };

export function decideGoalReached(input: {
  goalType: 'time' | 'pages';
  targetMinutes: number;
  elapsedMinutes: number;
}): GoalReachedDecision {
  if (input.goalType !== 'time') {
    return { action: 'skip', reason: 'not_time_goal' };
  }

  if (!isPositiveFinite(input.targetMinutes) || !isNonNegativeFinite(input.elapsedMinutes)) {
    return { action: 'skip', reason: 'invalid_goal' };
  }

  const seconds = Math.round((input.targetMinutes - input.elapsedMinutes) * 60);
  if (!Number.isSafeInteger(seconds) || seconds < 1) {
    return { action: 'skip', reason: 'already_achieved' };
  }

  return { action: 'schedule', seconds };
}

export interface EngagementPlanItem {
  identifier: string;
  localDate: string;
  fireAt: Date;
}

export function planEngagementReminders(input: {
  daysOfWeek: readonly number[];
  reminderTime: string;
  enabled: boolean;
  achievedDates: readonly string[];
  now: Date;
  horizonDays?: number;
}): EngagementPlanItem[] {
  if (!input.enabled) {
    return [];
  }

  const reminder = parseReminderTime(input.reminderTime);
  const weekdays = normalizeWeekdays(input.daysOfWeek);
  if (!reminder || weekdays.length === 0) {
    return [];
  }

  const horizon = input.horizonDays ?? ENGAGEMENT_HORIZON_DAYS;
  if (!Number.isInteger(horizon) || horizon < 1) {
    return [];
  }

  const achieved = new Set(input.achievedDates);
  const planned: EngagementPlanItem[] = [];

  for (let offset = 0; offset < horizon; offset += 1) {
    const fireAt = new Date(
      input.now.getFullYear(),
      input.now.getMonth(),
      input.now.getDate() + offset,
      reminder.hour,
      reminder.minute,
      0,
      0,
    );
    if (fireAt.getTime() <= input.now.getTime()) {
      continue;
    }
    if (!weekdays.includes(fireAt.getDay())) {
      continue;
    }

    const localDate = formatLocalDate(fireAt);
    if (achieved.has(localDate)) {
      continue;
    }

    planned.push({
      identifier: engagementIdentifier(localDate),
      localDate,
      fireAt,
    });
  }

  return planned;
}

export interface EngagementLogCandidate {
  kind: 'engagement';
  goalId: string;
  localDate: string;
  scheduledFor: string;
  /** A past schedule time is not proof that the device delivered the notification. */
  deliveryConfirmed: false;
}

export function engagementLogCandidates(input: {
  goalId: string;
  planned: readonly EngagementPlanItem[];
  now: Date;
}): EngagementLogCandidate[] {
  return input.planned
    .filter((item) => item.fireAt.getTime() <= input.now.getTime())
    .map((item) => ({
      kind: 'engagement' as const,
      goalId: input.goalId,
      localDate: item.localDate,
      scheduledFor: item.fireAt.toISOString(),
      deliveryConfirmed: false as const,
    }));
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
