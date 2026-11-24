export type GoalType = 'time' | 'pages';

/**
 * Domain shape used by settings and goal APIs.
 * Active goals have endsOn === null.
 */
export interface StoredReadingGoal {
  id: string;
  userId: string;
  type: GoalType;
  /** Minutes when type is time, pages when type is pages. */
  targetValue: number;
  /** 0 is Sunday, 6 is Saturday. */
  daysOfWeek: number[];
  /** Local HH:mm when present. */
  reminderTime: string | null;
  notificationsEnabled: boolean;
  /** YYYY-MM-DD */
  startsOn: string;
  /** YYYY-MM-DD. Null means the goal is still active. */
  endsOn: string | null;
  createdAt: string;
}

/** @deprecated Prefer StoredReadingGoal for API results. Kept for older call sites. */
export interface ReadingGoal {
  id: string;
  userId: string;
  type: GoalType;
  targetValue: number;
  daysOfWeek: number[];
  reminderTime: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface DailyGoalResult {
  goalId: string;
  /** YYYY-MM-DD */
  date: string;
  isCompleted: boolean;
}

export interface ReplaceGoalInput {
  type: GoalType;
  targetValue: number;
  daysOfWeek: readonly number[];
  /** Local HH:mm */
  reminderTime: string;
  /**
   * Device-local YYYY-MM-DD passed to replace_goal as p_today.
   * Defaults to startOfToday when omitted.
   */
  today?: string;
  /**
   * Persisted via a follow-up update after replace_goal (RPC has no notifications arg).
   * When omitted, the row returned by RPC is left unchanged.
   */
  notificationsEnabled?: boolean;
}
