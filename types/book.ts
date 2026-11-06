export type BookStatus = 'wishlist' | 'reading' | 'completed' | 'paused';

export interface Book {
  id: string;
  title: string;
  author: string;
  /** Solid cover used until a book search API provides an image. */
  coverColor: string;
  coverImageUrl?: string;
  totalPages: number;
}

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: BookStatus;
  currentPage: number;
  rating: number | null;
  /** YYYY-MM-DD */
  startedAt: string | null;
  /** YYYY-MM-DD */
  completedAt: string | null;
  /**
   * YYYY-MM-DD. Kept so a later dust cue can tell how long a book has been unread.
   */
  lastReadAt: string | null;
  spineColor: string;
}

/** Book joined with the current user's shelf state for screens. */
export interface LibraryBook {
  id: string;
  userBookId: string;
  title: string;
  author: string;
  coverColor: string;
  coverImageUrl?: string;
  spineColor: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  rating: number | null;
  startedAt: string | null;
  completedAt: string | null;
  lastReadAt: string | null;
}

/** One row of a Kakao book search, before the user adds it to the shelf. */
export interface BookSearchResult {
  /** Raw Kakao value: "ISBN10 ISBN13", either part may be missing. Empty when unknown. */
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  coverImageUrl: string | null;
}

export interface RegisteredBook {
  userBookId: string;
  bookId: string;
  status: BookStatus;
  totalPages: number;
}
