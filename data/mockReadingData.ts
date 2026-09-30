import { BOOK_IDS, mockUser } from '@/data/mockBooks';
import type { DailyGoalResult, ReadingGoal } from '@/types/goal';
import type { BookIndex, BookReview, ReadingNote, ReadingSession } from '@/types/reading';
import { atTime, dateInPreviousMonth, dateKeyOffset } from '@/utils/date';

export const mockGoal: ReadingGoal = {
  id: 'goal-daily-pages',
  userId: mockUser.id,
  type: 'pages',
  targetValue: 10,
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  reminderTime: '21:30',
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
};

const goalPattern = [true, true, true, true, true, false, true, true, true, false];

export const mockGoalResults: DailyGoalResult[] = goalPattern.map((isCompleted, index) => ({
  goalId: mockGoal.id,
  date: dateKeyOffset(index - 9),
  isCompleted,
}));

/** Shown on the session screen until a real timer is added. */
export const previewElapsedSeconds = 23 * 60 + 41;

function createSession(
  id: string,
  bookId: string,
  dayOffset: number,
  hours: number,
  minutes: number,
  durationMinutes: number,
  startPage: number,
  endPage: number,
  oneLineReview: string | null = null,
): ReadingSession {
  const date = dateKeyOffset(dayOffset);
  const start = new Date(atTime(date, hours, minutes));
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  return {
    id,
    bookId,
    date,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    duration: durationMinutes * 60,
    startPage,
    endPage,
    pagesRead: endPage - startPage,
    focusExitCount: 0,
    oneLineReview,
  };
}

export const mockSessions: ReadingSession[] = [
  createSession('session-demian-1', BOOK_IDS.demian, -9, 21, 0, 18, 20, 32),
  createSession('session-demian-2', BOOK_IDS.demian, -8, 21, 10, 16, 32, 44),
  createSession('session-demian-3', BOOK_IDS.demian, -7, 20, 40, 22, 44, 60),
  createSession('session-demian-4', BOOK_IDS.demian, -6, 21, 5, 15, 60, 72),
  createSession('session-demian-5', BOOK_IDS.demian, -5, 21, 20, 20, 72, 88),
  createSession('session-almond-1', BOOK_IDS.almond, -3, 21, 0, 30, 2, 14),
  createSession('session-almond-2', BOOK_IDS.almond, -2, 19, 0, 40, 14, 40),
  createSession('session-vegetarian', BOOK_IDS.vegetarian, -2, 20, 0, 70, 195, 263, '마지막 장이 오래 남았다.'),
  createSession(
    'session-almond-3',
    BOOK_IDS.almond,
    -1,
    21,
    10,
    24,
    40,
    66,
    '생각보다 몰입해서 읽었다.',
  ),
  createSession('session-almond-today', BOOK_IDS.almond, 0, 21, 0, 20, 66, 72),
];

export const mockNotes: ReadingNote[] = [
  {
    id: 'note-almond-1',
    bookId: BOOK_IDS.almond,
    sessionId: 'session-almond-3',
    page: 58,
    content: '주인공의 감정 변화가 조용하게 쌓인다.',
    createdAt: atTime(dateKeyOffset(-1), 21, 30),
  },
  {
    id: 'note-demian-1',
    bookId: BOOK_IDS.demian,
    sessionId: 'session-demian-5',
    page: 80,
    content: '혼자 서는 장면에서 잠시 멈췄다.',
    createdAt: atTime(dateKeyOffset(-5), 21, 40),
  },
];

export const mockIndexes: BookIndex[] = [
  {
    id: 'index-almond-1',
    bookId: BOOK_IDS.almond,
    sessionId: 'session-almond-3',
    page: 54,
    quote: '중요한 것은 속도가 아니라 방향이다.',
    memo: '나중에 다시 보고 싶은 부분',
    createdAt: atTime(dateKeyOffset(-1), 21, 28),
  },
  {
    id: 'index-almond-2',
    bookId: BOOK_IDS.almond,
    sessionId: 'session-almond-1',
    page: 11,
    quote: '오늘은 여기까지 읽어도 충분하다.',
    memo: null,
    createdAt: atTime(dateKeyOffset(-3), 21, 20),
  },
  {
    id: 'index-demian-1',
    bookId: BOOK_IDS.demian,
    sessionId: 'session-demian-3',
    page: 52,
    quote: '혼자 서는 일이 이렇게 조용한 줄 몰랐다.',
    memo: '책의 중심 문장',
    createdAt: atTime(dateKeyOffset(-7), 21, 0),
  },
];

export const mockReviews: BookReview[] = [
  {
    id: 'review-demian',
    bookId: BOOK_IDS.demian,
    completedAt: dateKeyOffset(-5),
    rating: 5,
    review: '혼자 서는 법을 다시 생각하게 한 책.',
  },
  {
    id: 'review-vegetarian',
    bookId: BOOK_IDS.vegetarian,
    completedAt: dateKeyOffset(-2),
    rating: 4,
    review: '불편하지만 오래 남는 문장들이 있었다.',
  },
  {
    id: 'review-dollargut',
    bookId: BOOK_IDS.dollargut,
    completedAt: dateInPreviousMonth(18),
    rating: 4,
    review: '잠들기 전에 읽기 좋은 이야기.',
  },
];
