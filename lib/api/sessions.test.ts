import { pickBookColor } from '../../utils/bookColors.ts';
import { queueResult, recordedCalls, resetFakeSupabase } from '../../utils/testing/fakeSupabase.ts';
import { fetchReadingActivities } from './sessions.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function sessionRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'session-1',
    user_book_id: 'ub-1',
    read_on: '2026-11-20',
    started_at: '2026-11-20T12:00:00.000Z',
    ended_at: '2026-11-20T12:30:00.000Z',
    duration_seconds: 1800,
    start_page: 10,
    end_page: 40,
    pages_read: 30,
    focus_exit_count: 2,
    user_books: {
      book_id: 'book-1',
      books: { title: '데미안', author: '헤세', cover_url: 'https://img/cover.png' },
    },
    ...overrides,
  };
}

async function run(): Promise<void> {
  resetFakeSupabase();
  queueResult([sessionRow()]);
  const [activity] = await fetchReadingActivities();

  assert(recordedCalls.length === 1, 'all activities load in a single request');
  const call = recordedCalls[0];
  assert(call?.target === 'from:reading_sessions', 'reads reading_sessions');
  const orders = call.steps.filter(([name]) => name === 'order').map(([, args]) => JSON.stringify(args));
  assert(
    orders[0] === JSON.stringify(['started_at', { ascending: false }]) &&
      orders[1] === JSON.stringify(['id', { ascending: false }]),
    'newest first, id breaks ties',
  );

  assert(activity?.readOn === '2026-11-20' && activity.durationSeconds === 1800, 'date and duration are mapped');
  assert(activity.pagesRead === 30 && activity.bookTitle === '데미안', 'pages and title are mapped');
  assert(activity.sessionId === 'session-1' && activity.userBookId === 'ub-1', 'session and book ids are mapped');
  assert(activity.author === '헤세' && activity.coverImageUrl === 'https://img/cover.png', 'author and cover are mapped');
  assert(activity.coverColor === pickBookColor('book-1'), 'cover color is derived from the book id');
  assert(
    activity.startedAt === '2026-11-20T12:00:00.000Z' && activity.endedAt === '2026-11-20T12:30:00.000Z',
    'start and end timestamps are mapped',
  );
  assert(
    activity.startPage === 10 && activity.endPage === 40 && activity.focusExitCount === 2,
    'pages and exits are mapped',
  );

  // generated pages_read can be null: fall back to end - start
  resetFakeSupabase();
  queueResult([sessionRow({ pages_read: null, start_page: 5, end_page: 20 })]);
  const [fallback] = await fetchReadingActivities();
  assert(fallback?.pagesRead === 15, 'null pages_read falls back to end - start');

  // a session whose book row is not readable keeps working
  resetFakeSupabase();
  queueResult([sessionRow({ user_books: null })]);
  const [orphan] = await fetchReadingActivities();
  assert(
    orphan?.bookTitle === null && orphan.author === null && orphan.coverColor === undefined,
    'missing book info stays null',
  );
  assert(orphan.coverImageUrl === null, 'missing cover is null, not undefined');

  // server errors surface
  resetFakeSupabase();
  queueResult(null, { message: 'permission denied' });
  let message = '';
  try {
    await fetchReadingActivities();
  } catch (error) {
    message = error instanceof Error ? error.message : '';
  }
  assert(message === 'permission denied', 'query errors are thrown');
}

await run();
console.log('sessions.test.ts passed');
