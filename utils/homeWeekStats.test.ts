import { homeWeekStats } from './homeWeekStats.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function runHomeWeekStatsChecks(): void {
  const stats = homeWeekStats('2026-11-11', [
    { readOn: '2026-11-10', durationSeconds: 1800, pagesRead: 10, bookTitle: 'A' },
    { readOn: '2026-11-11', durationSeconds: 2400, pagesRead: 12, bookTitle: 'A' },
    { readOn: '2026-11-03', durationSeconds: 1200, pagesRead: 8, bookTitle: 'A' },
  ]);

  assert(stats.totalSeconds === 4200, 'this week total uses Mon-Sun activities');
  assert(stats.previousWeekSeconds === 1200, 'previous week is compared separately');
  assert(stats.deltaSeconds === 3000, 'delta is this week minus previous week');
  assert(stats.days.length === 7, 'week has seven day columns');
  const friday = stats.days.find((day) => day.dateKey === '2026-11-13');
  assert(Boolean(friday?.isFuture), 'future weekdays stay marked future');
  assert(friday?.durationSeconds === 0, 'future days do not invent reading time');
}

runHomeWeekStatsChecks();
console.log('homeWeekStats.test.ts passed');
