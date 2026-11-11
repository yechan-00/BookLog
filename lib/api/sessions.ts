import { toError } from '@/lib/api/errors';
import { toReadingSession } from '@/lib/api/mappers';
import { supabase } from '@/lib/supabase';
import type { ReadingSession } from '@/types/reading';
import { toDateKey } from '@/utils/date';

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
