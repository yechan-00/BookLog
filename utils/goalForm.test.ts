import type { StoredReadingGoal } from '../types/goal.ts';
import {
  draftFromStoredGoal,
  emptyGoalDraft,
  formatStoredGoalSummary,
  goalSnapshotKey,
  isSameGoalDraft,
  validateGoalDraft,
} from './goalForm.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function sampleGoal(overrides: Partial<StoredReadingGoal> = {}): StoredReadingGoal {
  return {
    id: 'goal-1',
    userId: 'user-1',
    type: 'time',
    targetValue: 30,
    daysOfWeek: [1, 3, 5],
    reminderTime: '21:30',
    notificationsEnabled: true,
    startsOn: '2026-11-01',
    endsOn: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

function runGoalFormChecks(): void {
  assert(!validateGoalDraft(emptyGoalDraft).valid, 'empty draft is invalid');
  assert(!validateGoalDraft({ ...emptyGoalDraft, target: '0', days: [1], reminderTime: '21:00' }).valid, 'zero rejected');
  assert(!validateGoalDraft({ ...emptyGoalDraft, target: '-3', days: [1], reminderTime: '21:00' }).valid, 'negative rejected');
  assert(!validateGoalDraft({ ...emptyGoalDraft, target: '1.5', days: [1], reminderTime: '21:00' }).valid, 'decimal rejected');
  assert(!validateGoalDraft({ ...emptyGoalDraft, target: '30', days: [], reminderTime: '21:00' }).valid, 'no weekdays rejected');
  assert(!validateGoalDraft({ ...emptyGoalDraft, target: '30', days: [1], reminderTime: '25:00' }).valid, 'bad time rejected');
  assert(
    !validateGoalDraft({ ...emptyGoalDraft, target: '2147483648', days: [1], reminderTime: '21:00' }).valid,
    'above postgres integer rejected',
  );

  const ok = validateGoalDraft({ type: 'pages', target: '20', days: [2, 0, 2], reminderTime: '09:05' });
  assert(ok.valid, 'valid draft accepted');
  if (ok.valid) {
    assert(ok.targetValue === 20 && ok.daysOfWeek.join(',') === '0,2', 'weekdays normalized and sorted');
    assert(ok.reminderTime === '09:05', 'reminder formatted');
  }

  const draft = draftFromStoredGoal(sampleGoal());
  assert(draft.target === '30' && draft.type === 'time', 'draft maps target and type');

  const parsed = validateGoalDraft({ type: 'time', target: '30', days: [3, 1, 5], reminderTime: '21:30' });
  assert(parsed.valid && isSameGoalDraft(parsed, sampleGoal()), 'same goal ignores weekday order');
  assert(parsed.valid && !isSameGoalDraft(parsed, sampleGoal({ targetValue: 45 })), 'different target is not same');

  assert(
    goalSnapshotKey({ type: 'time', targetValue: 30, daysOfWeek: [5, 1], reminderTime: '21:30:00' }) ===
      goalSnapshotKey({ type: 'time', targetValue: 30, daysOfWeek: [1, 5], reminderTime: '21:30' }),
    'snapshot normalizes time and days',
  );

  const summary = formatStoredGoalSummary(sampleGoal());
  assert(summary.includes('30분') && summary.includes('월') && summary.includes('21:30'), 'summary includes fields');
}

runGoalFormChecks();
console.log('goalForm.test.ts passed');
