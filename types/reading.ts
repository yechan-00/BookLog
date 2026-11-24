export interface ReadingSession {
  id: string;
  /** user_books.id (route param for /book/[id]). Not books.id. */
  bookId: string;
  /** YYYY-MM-DD */
  date: string;
  startTime: string;
  endTime: string | null;
  /** Elapsed seconds. */
  duration: number;
  startPage: number;
  endPage: number | null;
  /** Stored pages_read; null when the DB value is missing (do not invent). */
  pagesRead: number | null;
  focusExitCount: number;
  oneLineReview: string | null;
}

export interface ReadingNote {
  id: string;
  bookId: string;
  sessionId: string | null;
  page: number | null;
  content: string;
  createdAt: string;
}

export interface BookIndex {
  id: string;
  bookId: string;
  sessionId: string | null;
  page: number;
  title: string;
  quote: string | null;
  /** One of INDEX_COLOR_OPTIONS, or null when the reader did not pick one. */
  color: string | null;
  tags: string[];
  createdAt: string;
}

export interface BookReview {
  id: string;
  bookId: string;
  /** YYYY-MM-DD */
  completedAt: string;
  rating: number;
  review: string;
}

/** The session being read right now. Kept on the device so it survives an app kill. */
export interface ActiveReadingSession {
  userBookId: string;
  /** ISO 8601. Elapsed time is always `now - startedAt`. */
  startedAt: string;
  startPage: number;
  focusExitCount: number;
}
