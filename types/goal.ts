export type GoalType = 'time' | 'pages';

export interface ReadingGoal {
  id: string;
  userId: string;
  type: GoalType;
  /** Minutes when type is time, pages when type is pages. */
  targetValue: number;
  /** 0 is Sunday, 6 is Saturday. */
  daysOfWeek: number[];
  /** Local time HH:mm. Reserved for a later notification schedule. */
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
