import { canChangeStatus, nextStatuses, planBookStatusChange, statusChangeOptions } from './bookStatus.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function run(): void {
  assert(planBookStatusChange('wishlist', 'reading').kind === 'update', 'wishlist to reading');
  assert(planBookStatusChange('reading', 'wishlist').kind === 'forbidden', 'reading must pause before wishlist');
  assert(planBookStatusChange('reading', 'paused').kind === 'update', 'reading to paused');
  assert(planBookStatusChange('paused', 'reading').kind === 'update', 'paused to reading');
  assert(planBookStatusChange('reading', 'completed').kind === 'complete_flow', 'reading to completed uses flow');
  assert(planBookStatusChange('completed', 'reading').kind === 'forbidden', 'completed cannot reopen');
  assert(planBookStatusChange('completed', 'wishlist').kind === 'update', 'completed can return to wishlist');
  assert(planBookStatusChange('wishlist', 'wishlist').kind === 'forbidden', 'same status forbidden');

  const options = statusChangeOptions('reading');
  assert(options.includes('completed') && options.includes('paused'), 'reading options include complete and pause');
  assert(!statusChangeOptions('completed').includes('reading'), 'completed has no reopen option');
}

function runMatrix(): void {
  const all = ['wishlist', 'reading', 'paused', 'completed'] as const;
  for (const from of all) {
    for (const to of all) {
      const plan = planBookStatusChange(from, to);
      const allowed = canChangeStatus(from, to);
      assert((plan.kind !== 'forbidden') === allowed, `plan and rule agree for ${from} -> ${to}`);
      if (allowed && to === 'completed') {
        assert(plan.kind === 'complete_flow', `${from} -> completed goes through the complete flow`);
      }
      if (allowed && to !== 'completed') {
        assert(plan.kind === 'update' && plan.next === to, `${from} -> ${to} is a plain update`);
      }
    }
    assert(
      statusChangeOptions(from).join(',') === nextStatuses(from).join(','),
      `options for ${from} match the server rule`,
    );
  }
  assert(!canChangeStatus('completed', 'reading'), 'a finished book cannot jump to reading');
  assert(canChangeStatus('completed', 'wishlist'), 'a finished book can start over from wishlist');
}

run();
runMatrix();
console.log('bookStatus.test.ts passed');
