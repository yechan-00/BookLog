import {
  decideGoalOnboarding,
  ONBOARDING_INITIAL_DRAFT,
  validateOnboardingGoalDraft,
} from './onboardingGoal.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function run(): void {
  assert(decideGoalOnboarding({
    authStatus: 'loading',
    goalStatus: 'ready',
    hasActiveGoal: false,
  }).action === 'wait', 'auth loading waits');

  assert(decideGoalOnboarding({
    authStatus: 'admin',
    goalStatus: 'idle',
    hasActiveGoal: false,
  }).action === 'block', 'admin blocked from user onboarding');

  assert(decideGoalOnboarding({
    authStatus: 'ready',
    goalStatus: 'loading',
    hasActiveGoal: false,
  }).action === 'loading_goal', 'goal loading');

  const goalError = decideGoalOnboarding({
    authStatus: 'ready',
    goalStatus: 'error',
    hasActiveGoal: false,
    goalErrorMessage: 'network',
  });
  assert(goalError.action === 'goal_error', 'query failure is not missing goal');

  assert(decideGoalOnboarding({
    authStatus: 'ready',
    goalStatus: 'ready',
    hasActiveGoal: false,
  }).action === 'show_onboarding', 'new user onboarding');

  assert(decideGoalOnboarding({
    authStatus: 'ready',
    goalStatus: 'ready',
    hasActiveGoal: true,
  }).action === 'enter_app', 'existing goal skips onboarding');

  const valid = validateOnboardingGoalDraft(ONBOARDING_INITIAL_DRAFT);
  assert(valid.valid && valid.targetValue === 15, 'default 15 minutes');

  assert(
    !validateOnboardingGoalDraft({ ...ONBOARDING_INITIAL_DRAFT, target: '0' }).valid,
    'zero blocked',
  );
  assert(
    !validateOnboardingGoalDraft({ ...ONBOARDING_INITIAL_DRAFT, days: [] }).valid,
    'no weekdays blocked',
  );
  assert(
    !validateOnboardingGoalDraft({
      ...ONBOARDING_INITIAL_DRAFT,
      notificationsEnabled: true,
      reminderTime: '99:99',
    }).valid,
    'bad reminder blocked when notifications on',
  );
  assert(
    validateOnboardingGoalDraft({
      ...ONBOARDING_INITIAL_DRAFT,
      notificationsEnabled: false,
      reminderTime: '',
    }).valid,
    'empty reminder allowed when notifications off',
  );
}

run();
console.log('onboardingGoal.test.ts passed');
