import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchActiveGoal } from '@/lib/api/goals';
import type { ActiveGoal } from '@/types/goal';

/** `needed` means the user has no goal yet, so onboarding comes before the app (GOAL-01). */
export type GoalGateStatus = 'loading' | 'needed' | 'ready' | 'error';

interface GoalContextValue {
  status: GoalGateStatus;
  goal: ActiveGoal | null;
  errorMessage: string | null;
  /** Loads the goal again, e.g. after onboarding saved one or after the user taps retry. */
  refresh: () => void;
}

const GoalContext = createContext<GoalContextValue | null>(null);

export function GoalProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GoalGateStatus>('loading');
  const [goal, setGoal] = useState<ActiveGoal | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    fetchActiveGoal().then(
      (loaded) => {
        if (isCancelled) {
          return;
        }

        setGoal(loaded);
        setErrorMessage(null);
        setStatus(loaded ? 'ready' : 'needed');
      },
      (error: unknown) => {
        if (isCancelled) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : '목표를 불러오지 못했습니다.');
        setStatus('error');
      },
    );

    return () => {
      isCancelled = true;
    };
  }, [attempt]);

  const refresh = useCallback(() => setAttempt((count) => count + 1), []);

  const value = useMemo<GoalContextValue>(
    () => ({ status, goal, errorMessage, refresh }),
    [status, goal, errorMessage, refresh],
  );

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
}

export function useGoal(): GoalContextValue {
  const value = useContext(GoalContext);
  if (!value) {
    throw new Error('useGoal은 GoalProvider 안에서만 사용할 수 있습니다.');
  }

  return value;
}
