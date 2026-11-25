import { addDays, parseDateKey, toDateKey } from '@/utils/date';

/** One saved reading session. pagesRead is the stored page delta, not an estimate. */
export interface ReadingActivity {
  readOn: string;
  durationSeconds: number;
  pagesRead: number | null;
  bookTitle: string | null;
  /** Present when loaded from reading_sessions; optional for summary-only fixtures. */
  sessionId?: string;
  userBookId?: string;
  author?: string | null;
  coverColor?: string;
  coverImageUrl?: string | null;
  startedAt?: string;
  endedAt?: string | null;
  startPage?: number;
  endPage?: number | null;
  focusExitCount?: number;
}

/**
 * One reading_goals period.
 * endsOn is the change day: that date belongs to the newer goal.
 */
export interface GoalPeriod {
  type: 'time' | 'pages';
  targetValue: number;
  /** 0 is Sunday, 6 is Saturday. */
  daysOfWeek: number[];
  startsOn: string;
  endsOn: string | null;
}

export interface ReadingHistory {
  goals: GoalPeriod[];
  activities: ReadingActivity[];
}

export type DayAchievement =
  | 'none'
  | 'off'
  | 'achieved'
  | 'exceeded'
  | 'missed'
  | 'pending'
  | 'upcoming'
  | 'unknown';

/** Calendar/visual: exact target. Insights/rates treat exceeded as achieved too. */
export function isAchievementCounted(achievement: DayAchievement): boolean {
  return achievement === 'achieved' || achievement === 'exceeded';
}

export type GoalAmountProgress = 'under' | 'met' | 'over' | null;

export interface DayReadingState {
  dateKey: string;
  isToday: boolean;
  isFuture: boolean;
  hasReading: boolean;
  achievement: DayAchievement;
  durationSeconds: number;
  pagesRead: number | null;
}

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function shiftDateKey(dateKey: string, amount: number): string {
  return toDateKey(addDays(parseDateKey(dateKey), amount));
}

export function weekdayOf(dateKey: string): number {
  return parseDateKey(dateKey).getDay();
}

export function weekdayLabel(dateKey: string): string {
  return weekdayLabels[weekdayOf(dateKey)] ?? '';
}

export function achievementLabel(achievement: DayAchievement): string {
  switch (achievement) {
    case 'achieved':
      return '달성';
    case 'exceeded':
      return '과달성';
    case 'missed':
      return '미달';
    case 'pending':
      return '진행';
    case 'upcoming':
      return '예정';
    case 'off':
      return '휴식';
    case 'unknown':
      return '미확인';
    default:
      return '기록 없음';
  }
}

export function goalForDate(goals: readonly GoalPeriod[], dateKey: string): GoalPeriod | null {
  let match: GoalPeriod | null = null;

  for (const goal of goals) {
    const covers = goal.startsOn <= dateKey && (goal.endsOn === null || dateKey <= goal.endsOn);
    if (!covers) {
      continue;
    }

    if (!match || goal.startsOn >= match.startsOn) {
      match = goal;
    }
  }

  return match;
}

function safeDuration(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

function safePages(value: number | null): number | null {
  if (value === null || !Number.isSafeInteger(value) || value < 0) {
    return null;
  }

  return value;
}

function activitiesOn(activities: readonly ReadingActivity[], dateKey: string): ReadingActivity[] {
  return activities.filter((activity) => activity.readOn === dateKey);
}

/**
 * Compares raw totals to the goal without display rounding.
 * Time uses seconds vs target minutes * 60. Pages use stored pagesRead only.
 */
export function goalAmountProgress(
  goal: GoalPeriod,
  activities: readonly ReadingActivity[],
): GoalAmountProgress {
  if (!Number.isSafeInteger(goal.targetValue) || goal.targetValue < 1) {
    return null;
  }

  if (goal.type === 'time') {
    const seconds = activities.reduce((sum, activity) => sum + safeDuration(activity.durationSeconds), 0);
    const targetSeconds = goal.targetValue * 60;
    if (seconds < targetSeconds) {
      return 'under';
    }
    if (seconds === targetSeconds) {
      return 'met';
    }
    return 'over';
  }

  let pageTotal = 0;
  for (const activity of activities) {
    const pages = safePages(activity.pagesRead);
    if (pages === null) {
      return null;
    }
    pageTotal += pages;
  }

  if (pageTotal < goal.targetValue) {
    return 'under';
  }
  if (pageTotal === goal.targetValue) {
    return 'met';
  }
  return 'over';
}

/** True when the day's total meets or exceeds the goal. Null when page data is missing. */
export function isGoalMet(goal: GoalPeriod, activities: readonly ReadingActivity[]): boolean | null {
  const progress = goalAmountProgress(goal, activities);
  if (progress === null) {
    return null;
  }
  return progress === 'met' || progress === 'over';
}

export function describeDay(
  dateKey: string,
  todayKey: string,
  goals: readonly GoalPeriod[],
  activities: readonly ReadingActivity[],
): DayReadingState {
  const rows = activitiesOn(activities, dateKey);
  const durationSeconds = rows.reduce((sum, activity) => sum + safeDuration(activity.durationSeconds), 0);
  let pagesRead = 0;
  for (const activity of rows) {
    const pages = safePages(activity.pagesRead);
    if (pages === null) {
      pagesRead = -1;
      break;
    }
    pagesRead += pages;
  }
  const knownPages = pagesRead < 0 ? null : pagesRead;
  const goal = goalForDate(goals, dateKey);
  const isFuture = dateKey > todayKey;
  const isScheduled = goal !== null && goal.daysOfWeek.includes(weekdayOf(dateKey));

  let achievement: DayAchievement = 'none';
  if (!goal) {
    achievement = 'none';
  } else if (!isScheduled) {
    achievement = 'off';
  } else if (isFuture) {
    achievement = 'upcoming';
  } else {
    const progress = goalAmountProgress(goal, rows);
    if (progress === null) {
      achievement = 'unknown';
    } else if (progress === 'over') {
      achievement = 'exceeded';
    } else if (progress === 'met') {
      achievement = 'achieved';
    } else if (dateKey === todayKey) {
      achievement = 'pending';
    } else {
      achievement = 'missed';
    }
  }

  return {
    dateKey,
    isToday: dateKey === todayKey,
    isFuture,
    hasReading: rows.length > 0,
    achievement,
    durationSeconds,
    pagesRead: knownPages,
  };
}
