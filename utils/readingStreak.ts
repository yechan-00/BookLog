import { describeDay, shiftDateKey, type GoalPeriod, type ReadingActivity } from '@/utils/readingPeriod';

export interface ReadingStreak {
  /** Achieved goal weekdays. Days without a goal are not counted. */
  days: number;
}

export function readingStreak(
  todayKey: string,
  goals: readonly GoalPeriod[],
  activities: readonly ReadingActivity[],
): ReadingStreak {
  if (goals.length === 0) {
    return { days: 0 };
  }

  const earliest = goals.reduce(
    (minimum, goal) => (goal.startsOn < minimum ? goal.startsOn : minimum),
    goals[0]?.startsOn ?? todayKey,
  );
  let days = 0;
  let cursor = todayKey;

  while (cursor >= earliest) {
    const achievement = describeDay(cursor, todayKey, goals, activities).achievement;
    if (achievement === 'achieved') {
      days += 1;
    } else if (achievement === 'missed' || achievement === 'unknown') {
      break;
    }

    cursor = shiftDateKey(cursor, -1);
  }

  return { days };
}

/** Longest consecutive goal-achieved streak ending on or before today. */
export function bestReadingStreak(
  todayKey: string,
  goals: readonly GoalPeriod[],
  activities: readonly ReadingActivity[],
): ReadingStreak {
  if (goals.length === 0) {
    return { days: 0 };
  }

  const earliest = goals.reduce(
    (minimum, goal) => (goal.startsOn < minimum ? goal.startsOn : minimum),
    goals[0]?.startsOn ?? todayKey,
  );

  let best = 0;
  let current = 0;
  let cursor = earliest;

  while (cursor <= todayKey) {
    const achievement = describeDay(cursor, todayKey, goals, activities).achievement;
    if (achievement === 'achieved') {
      current += 1;
      if (current > best) {
        best = current;
      }
    } else if (achievement === 'missed' || achievement === 'unknown') {
      current = 0;
    }
    cursor = shiftDateKey(cursor, 1);
  }

  return { days: best };
}
