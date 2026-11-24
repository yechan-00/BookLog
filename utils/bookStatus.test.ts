import { planBookStatusChange, statusChangeOptions } from './bookStatus.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function run(): void {
  assert(planBookStatusChange('wishlist', 'reading').kind === 'update', 'wishlist to reading');
  assert(planBookStatusChange('reading', 'wishlist').kind === 'update', 'reading to wishlist');
  assert(planBookStatusChange('reading', 'paused').kind === 'update', 'reading to paused');
  assert(planBookStatusChange('paused', 'reading').kind === 'update', 'paused to reading');
  assert(planBookStatusChange('reading', 'completed').kind === 'complete_flow', 'reading to completed uses flow');
  assert(planBookStatusChange('completed', 'reading').kind === 'forbidden', 'completed cannot reopen');
  assert(planBookStatusChange('completed', 'wishlist').kind === 'forbidden', 'completed cannot wishlist');
  assert(planBookStatusChange('wishlist', 'wishlist').kind === 'forbidden', 'same status forbidden');

  const options = statusChangeOptions('reading');
  assert(options.includes('completed') && options.includes('wishlist'), 'reading options include complete and wishlist');
  assert(!statusChangeOptions('completed').includes('reading'), 'completed has no reopen option');
}

run();
console.log('bookStatus.test.ts passed');
