import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchActiveGoal } from '@/lib/api/goals';
import type { AuthStatus } from '@/lib/auth/AuthProvider';
import { decideGoalOnboarding, type GoalOnboardingDecision } from '@/utils/onboardingGoal';

type GoalQueryStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useGoalOnboardingGate(input: {
  authStatus: AuthStatus;
  userId: string | null;
}): {
  decision: GoalOnboardingDecision;
  refresh: () => void;
  markGoalPresent: () => void;
} {
  const { authStatus, userId } = input;
  const [goalStatus, setGoalStatus] = useState<GoalQueryStatus>('idle');
  const [hasActiveGoal, setHasActiveGoal] = useState(false);
  const [goalErrorMessage, setGoalErrorMessage] = useState<string | undefined>();
  const [attempt, setAttempt] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (authStatus !== 'ready' || !userId) {
      requestIdRef.current += 1;
      return;
    }

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    void (async () => {
      setGoalStatus('loading');
      setGoalErrorMessage(undefined);
      setHasActiveGoal(false);

      try {
        const goal = await fetchActiveGoal();
        if (cancelled || requestIdRef.current !== requestId) {
          return;
        }
        setHasActiveGoal(goal != null);
        setGoalStatus('ready');
      } catch (error) {
        if (cancelled || requestIdRef.current !== requestId) {
          return;
        }
        setHasActiveGoal(false);
        setGoalErrorMessage(error instanceof Error ? error.message : '목표를 확인하지 못했습니다.');
        setGoalStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, userId, attempt]);

  const refresh = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const markGoalPresent = useCallback(() => {
    requestIdRef.current += 1;
    setHasActiveGoal(true);
    setGoalStatus('ready');
    setGoalErrorMessage(undefined);
  }, []);

  const decision = decideGoalOnboarding({
    authStatus,
    goalStatus: authStatus === 'ready' && userId ? goalStatus : 'idle',
    hasActiveGoal,
    goalErrorMessage,
  });

  return { decision, refresh, markGoalPresent };
}
