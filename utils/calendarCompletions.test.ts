import { groupCompletionsByDate, completionsForDate } from './calendarCompletions.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function book(
  overrides: Partial<{
    userBookId: string;
    id: string;
    title: string;
    author: string;
    coverColor: string;
    coverImageUrl: string | undefined;
    completedAt: string | null;
  }> = {},
) {
  return {
    userBookId: 'ub-1',
    id: 'b-1',
    title: '책',
    author: '저자',
    coverColor: '#C4785A',
    coverImageUrl: undefined as string | undefined,
    completedAt: '2026-11-10' as string | null,
    ...overrides,
  };
}

function runCompletionsChecks(): void {
  assert(Object.keys(groupCompletionsByDate([])).length === 0, 'empty shelf');

  const none = groupCompletionsByDate([
    book({ completedAt: null }),
    book({ userBookId: 'ub-2', completedAt: null }),
  ]);
  assert(Object.keys(none).length === 0, 'null completedAt is never grouped');

  const one = groupCompletionsByDate([book({ title: '혼자' })]);
  assert(one['2026-11-10']?.length === 1, 'one completion on date');
  assert(one['2026-11-10']?.[0]?.title === '혼자', 'title preserved');

  const two = groupCompletionsByDate([
    book({ userBookId: 'ub-a', title: 'A', completedAt: '2026-11-10' }),
    book({ userBookId: 'ub-b', title: 'B', completedAt: '2026-11-10' }),
  ]);
  assert(two['2026-11-10']?.length === 2, 'two on same day');
  assert(two['2026-11-10']?.[0]?.userBookId === 'ub-b', 'stable id desc picks representative first');

  const multiDay = groupCompletionsByDate([
    book({ userBookId: 'ub-1', completedAt: '2026-11-01' }),
    book({ userBookId: 'ub-2', completedAt: '2026-11-30' }),
  ]);
  assert(multiDay['2026-11-01']?.length === 1 && multiDay['2026-11-30']?.length === 1, 'separate dates');

  const noCover = groupCompletionsByDate([
    book({ coverImageUrl: undefined, title: '표지없음' }),
  ]);
  assert(noCover['2026-11-10']?.[0]?.coverImageUrl === undefined, 'missing cover stays undefined');

  assert(completionsForDate(multiDay, '2026-11-15').length === 0, 'empty day returns []');
  assert(completionsForDate(multiDay, '2026-11-01').length === 1, 'lookup returns day list');
}

runCompletionsChecks();
console.log('calendarCompletions.test.ts passed');
