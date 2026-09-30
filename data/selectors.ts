import { mockBooks, mockUserBooks } from '@/data/mockBooks';
import {
  mockGoal,
  mockGoalResults,
  mockIndexes,
  mockNotes,
  mockReviews,
  mockSessions,
} from '@/data/mockReadingData';
import type { LibraryBook } from '@/types/book';
import type { BookIndex, BookReview, ReadingNote, ReadingSession } from '@/types/reading';
import { isDateKeyWithin, isInMonth, startOfToday, startOfWeek, toDateKey } from '@/utils/date';

export interface SessionListItem {
  id: string;
  bookId: string;
  bookTitle: string;
  dateKey: string;
  durationSeconds: number;
  pagesRead: number;
  startPage: number;
  endPage: number | null;
  oneLineReview: string | null;
}

export interface HomeSnapshot {
  currentBook: LibraryBook | null;
  goalTitle: string;
  goalCurrent: number;
  goalTarget: number;
  goalAchieved: boolean;
  todayDurationSeconds: number;
  todayPages: number;
  streakDays: number;
  recentSessions: SessionListItem[];
}

export interface InsightSnapshot {
  weekDurationSeconds: number;
  weekPages: number;
  goalRate: number;
  streakDays: number;
  monthlyCompletedCount: number;
}

export interface BookSummary {
  book: LibraryBook;
  sessions: ReadingSession[];
  notes: ReadingNote[];
  indexes: BookIndex[];
  review: BookReview | null;
  totalDurationSeconds: number;
}

function joinLibraryBook(bookId: string): LibraryBook | null {
  const book = mockBooks.find((item) => item.id === bookId);
  const userBook = mockUserBooks.find((item) => item.bookId === bookId);

  if (!book || !userBook) {
    return null;
  }

  return {
    id: book.id,
    userBookId: userBook.id,
    title: book.title,
    author: book.author,
    coverColor: book.coverColor,
    coverImageUrl: book.coverImageUrl,
    spineColor: userBook.spineColor,
    totalPages: book.totalPages,
    currentPage: userBook.currentPage,
    status: userBook.status,
    rating: userBook.rating,
    startedAt: userBook.startedAt,
    completedAt: userBook.completedAt,
    lastReadAt: userBook.lastReadAt,
  };
}

export function getLibraryBooks(): LibraryBook[] {
  return mockUserBooks
    .map((userBook) => joinLibraryBook(userBook.bookId))
    .filter((book): book is LibraryBook => book !== null);
}

export function getLibraryBook(bookId: string): LibraryBook | null {
  return joinLibraryBook(bookId);
}

export function getCurrentReadingBook(): LibraryBook | null {
  return getLibraryBooks().find((book) => book.status === 'reading') ?? null;
}

export function getCompletedBooks(): LibraryBook[] {
  return getLibraryBooks().filter((book) => book.status === 'completed');
}

function bookTitle(bookId: string): string {
  return getLibraryBook(bookId)?.title ?? '책';
}

export function toSessionListItem(session: ReadingSession): SessionListItem {
  return {
    id: session.id,
    bookId: session.bookId,
    bookTitle: bookTitle(session.bookId),
    dateKey: session.date,
    durationSeconds: session.duration,
    pagesRead: session.pagesRead,
    startPage: session.startPage,
    endPage: session.endPage,
    oneLineReview: session.oneLineReview,
  };
}

export function getSessionsForDate(dateKey: string): SessionListItem[] {
  return mockSessions
    .filter((session) => session.date === dateKey)
    .sort((left, right) => right.startTime.localeCompare(left.startTime))
    .map(toSessionListItem);
}

export function getReadingDates(): Set<string> {
  return new Set(mockSessions.map((session) => session.date));
}

export function calculateStreak(dates: Iterable<string>): number {
  const dateSet = new Set(dates);
  let streak = 0;
  const cursor = startOfToday();

  while (dateSet.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getHomeSnapshot(): HomeSnapshot {
  const todayKey = toDateKey(startOfToday());
  const todaySessions = mockSessions.filter((session) => session.date === todayKey);
  const todayPages = todaySessions.reduce((sum, session) => sum + session.pagesRead, 0);
  const todayDurationSeconds = todaySessions.reduce((sum, session) => sum + session.duration, 0);
  const goalTarget = mockGoal.targetValue;
  const recentSessions = [...mockSessions]
    .sort((left, right) => right.startTime.localeCompare(left.startTime))
    .slice(0, 3)
    .map(toSessionListItem);

  return {
    currentBook: getCurrentReadingBook(),
    goalTitle: `오늘 ${goalTarget}페이지 읽기`,
    goalCurrent: todayPages,
    goalTarget,
    goalAchieved: todayPages >= goalTarget,
    todayDurationSeconds,
    todayPages,
    streakDays: calculateStreak(getReadingDates()),
    recentSessions,
  };
}

export function getInsightSnapshot(): InsightSnapshot {
  const today = startOfToday();
  const weekStart = startOfWeek(today);
  const weekSessions = mockSessions.filter((session) =>
    isDateKeyWithin(session.date, weekStart, today),
  );
  const completedResults = mockGoalResults.filter((result) => result.isCompleted).length;
  const goalRate = mockGoalResults.length === 0 ? 0 : completedResults / mockGoalResults.length;

  return {
    weekDurationSeconds: weekSessions.reduce((sum, session) => sum + session.duration, 0),
    weekPages: weekSessions.reduce((sum, session) => sum + session.pagesRead, 0),
    goalRate,
    streakDays: calculateStreak(getReadingDates()),
    monthlyCompletedCount: mockUserBooks.filter(
      (book) => book.status === 'completed' && isInMonth(book.completedAt, today),
    ).length,
  };
}

export function getBookSummary(bookId: string): BookSummary | null {
  const book = getLibraryBook(bookId);

  if (!book) {
    return null;
  }

  const sessions = mockSessions
    .filter((session) => session.bookId === bookId)
    .sort((left, right) => right.startTime.localeCompare(left.startTime));

  return {
    book,
    sessions,
    notes: mockNotes.filter((note) => note.bookId === bookId),
    indexes: mockIndexes
      .filter((index) => index.bookId === bookId)
      .sort((left, right) => left.page - right.page),
    review: mockReviews.find((review) => review.bookId === bookId) ?? null,
    totalDurationSeconds: sessions.reduce((sum, session) => sum + session.duration, 0),
  };
}
