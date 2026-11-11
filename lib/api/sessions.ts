import { toError } from '@/lib/api/errors';
import { toReadingSession } from '@/lib/api/mappers';
import { supabase } from '@/lib/supabase';
import type { ReadingSession } from '@/types/reading';
import { toDateKey } from '@/utils/date';
import type { ReadingActivity } from '@/utils/readingPeriod';

interface FinishSessionInput {
  userBookId: string;
  startedAt: Date;
  endedAt: Date;
  startPage: number;
  endPage: number;
  focusExitCount: number;
  oneLineReview: string;
}

/** Saves the session and moves the book's current page and last read date in one call. */
export async function finishSession(input: FinishSessionInput): Promise<string> {
  if (!Number.isInteger(input.startPage) || !Number.isInteger(input.endPage)) {
    throw new Error('페이지는 정수여야 합니다.');
  }

  if (input.endPage < input.startPage) {
    throw new Error('끝 페이지는 시작 페이지 이상이어야 합니다.');
  }

  if (input.endedAt.getTime() < input.startedAt.getTime()) {
    throw new Error('종료 시각이 시작 시각보다 빠릅니다.');
  }

  const { data, error } = await supabase.rpc('finish_session', {
    p_user_book_id: input.userBookId,
    // The day is the device's local day, so the client decides it (see supabase-integration.md).
    p_read_on: toDateKey(input.startedAt),
    p_started_at: input.startedAt.toISOString(),
    p_ended_at: input.endedAt.toISOString(),
    p_start_page: input.startPage,
    p_end_page: input.endPage,
    p_focus_exit_count: input.focusExitCount,
    p_one_line_review: input.oneLineReview.trim(),
  });

  if (error) {
    throw toError(error);
  }

  return data;
}

/**
 * All of the user's sessions with book titles in one request (RLS limits rows to the user).
 * Newest first, so the server row limit (max_rows) drops the oldest sessions, not recent ones.
 */
export async function fetchReadingActivities(): Promise<ReadingActivity[]> {
  const { data, error } = await supabase
    .from('reading_sessions')
    .select('read_on, duration_seconds, start_page, end_page, pages_read, user_books(books(title))')
    .order('started_at', { ascending: false });

  if (error) {
    throw toError(error);
  }

  return data.map((row) => ({
    readOn: row.read_on,
    durationSeconds: row.duration_seconds,
    // Generated column, so the generated types mark it nullable.
    pagesRead: row.pages_read ?? Math.max(row.end_page - row.start_page, 0),
    bookTitle: row.user_books?.books?.title ?? null,
  }));
}

export async function fetchSessions(userBookId: string): Promise<ReadingSession[]> {
  const { data, error } = await supabase
    .from('reading_sessions')
    .select('*')
    .eq('user_book_id', userBookId)
    .order('started_at', { ascending: false });

  if (error) {
    throw toError(error);
  }

  return data.map(toReadingSession);
}
