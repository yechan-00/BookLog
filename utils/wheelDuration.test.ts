import { GOAL_TARGET_MAX } from './goalForm.ts';
import {
  clampDurationSelection,
  formatDurationFieldLabel,
  formatDurationPreview,
  formatPageFieldLabel,
  isValidDurationTotal,
  isValidPageTarget,
  partsToTotalMinutes,
  totalMinutesToParts,
} from './wheelDuration.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function runDurationChecks(): void {
  for (const total of [1, 20, 59, 60, 61, 90, GOAL_TARGET_MAX]) {
    const parts = totalMinutesToParts(total);
    assert(partsToTotalMinutes(parts) === total, `${total} minutes round-trip`);
  }

  assert(!isValidDurationTotal(0), '0 minutes rejected');
  assert(!isValidDurationTotal(GOAL_TARGET_MAX + 1), 'over max rejected');
  assert(isValidDurationTotal(15), '15 valid');
  assert(clampDurationSelection(0, 0) === 0, '0+0 stays 0 for picker preview');
  assert(formatDurationPreview(20) === '하루 20분 읽기', '20m preview');
  assert(formatDurationPreview(60) === '하루 1시간 읽기', '60m preview');
  assert(formatDurationPreview(90) === '하루 1시간 30분 읽기', '90m preview');
  assert(formatDurationFieldLabel(90) === '1시간 30분', 'field label');

  assert(isValidPageTarget(1), 'min page');
  assert(isValidPageTarget(100), '3-digit page');
  assert(isValidPageTarget(GOAL_TARGET_MAX), 'max page');
  assert(!isValidPageTarget(0), '0 page rejected');
  assert(!isValidPageTarget(GOAL_TARGET_MAX + 1), 'over max page rejected');
  assert(formatPageFieldLabel(30) === '30쪽', 'page field');
}

runDurationChecks();
console.log('wheelDuration.test.ts passed');
