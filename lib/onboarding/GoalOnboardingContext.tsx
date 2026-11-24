import { createContext, useContext, type ReactNode } from 'react';

import { useGoalOnboardingGate } from '@/hooks/useGoalOnboardingGate';
import type { AuthStatus } from '@/lib/auth/AuthProvider';
import type { GoalOnboardingDecision } from '@/utils/onboardingGoal';

interface GoalOnboardingContextValue {
  decision: GoalOnboardingDecision;
  refresh: () => void;
  markGoalPresent: () => void;
}

const GoalOnboardingContext = createContext<GoalOnboardingContextValue | null>(null);

export function GoalOnboardingProvider({
  authStatus,
  userId,
  children,
}: {
  authStatus: AuthStatus;
  userId: string | null;
  children: ReactNode;
}) {
  const gate = useGoalOnboardingGate({ authStatus, userId });
  return <GoalOnboardingContext.Provider value={gate}>{children}</GoalOnboardingContext.Provider>;
}

export function useGoalOnboarding(): GoalOnboardingContextValue {
  const value = useContext(GoalOnboardingContext);
  if (!value) {
    throw new Error('useGoalOnboarding은 GoalOnboardingProvider 안에서만 사용할 수 있습니다.');
  }
  return value;
}
