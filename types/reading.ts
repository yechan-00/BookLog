export interface ReadingSession {
  id: string;
  bookId: string;
  /** YYYY-MM-DD */
  date: string;
  startTime: string;
  endTime: string | null;
  /** Elapsed seconds. */
  duration: number;
  startPage: number;
  endPage: number | null;
  pagesRead: number;
  /** Reserved for a later focus-leave count. Not collected in this version. */
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
  quote: string;
  memo: string | null;
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
