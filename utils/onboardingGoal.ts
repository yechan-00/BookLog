import { validateGoalDraft, type GoalDraft, type GoalDraftResult } from '@/utils/goalForm';

/** PRD default: "하루 15분" with evening reminder. */
export const ONBOARDING_DEFAULT_DRAFT: GoalDraft = {
  type: 'time',
  target: '15',
  days: [0, 1, 2, 3, 4, 5, 6],
  reminderTime: '21:00',
};

export interface OnboardingGoalDraft extends GoalDraft {
  notificationsEnabled: boolean;
}

export const ONBOARDING_INITIAL_DRAFT: OnboardingGoalDraft = {
  ...ONBOARDING_DEFAULT_DRAFT,
  notificationsEnabled: true,
};

/**
 * Validates onboarding input. Reminder time is required only when notifications are on.
 * When off, a stored default time is still produced so replace_goal receives a valid time.
 */
export function validateOnboardingGoalDraft(draft: OnboardingGoalDraft): GoalDraftResult {
  if (!draft.notificationsEnabled) {
    return validateGoalDraft({
      ...draft,
      reminderTime: draft.reminderTime.trim() ? draft.reminderTime : ONBOARDING_DEFAULT_DRAFT.reminderTime,
    });
  }

  return validateGoalDraft(draft);
}

export type GoalOnboardingDecision =
  | { action: 'wait' }
  | { action: 'block'; reason: 'auth' | 'admin' | 'suspended' | 'error' }
  | { action: 'loading_goal' }
  | { action: 'goal_error'; message: string }
  | { action: 'show_onboarding' }
  | { action: 'enter_app' };

/**
 * Pure routing decision for GOAL-01. Active goal presence (not weekday) decides onboarding.
 */
export function decideGoalOnboarding(input: {
  authStatus: 'loading' | 'ready' | 'signedOut' | 'suspended' | 'admin' | 'error';
  goalStatus: 'idle' | 'loading' | 'ready' | 'error';
  hasActiveGoal: boolean;
  goalErrorMessage?: string;
}): GoalOnboardingDecision {
  if (input.authStatus === 'loading') {
    return { action: 'wait' };
  }

  if (input.authStatus === 'admin') {
    return { action: 'block', reason: 'admin' };
  }

  if (input.authStatus === 'suspended') {
    return { action: 'block', reason: 'suspended' };
  }

  if (input.authStatus === 'signedOut' || input.authStatus === 'error') {
    return { action: 'block', reason: input.authStatus === 'error' ? 'error' : 'auth' };
  }

  if (input.goalStatus === 'idle' || input.goalStatus === 'loading') {
    return { action: 'loading_goal' };
  }

  if (input.goalStatus === 'error') {
    return {
      action: 'goal_error',
      message: input.goalErrorMessage ?? '목표를 확인하지 못했습니다.',
    };
  }

  if (!input.hasActiveGoal) {
    return { action: 'show_onboarding' };
  }

  return { action: 'enter_app' };
}
