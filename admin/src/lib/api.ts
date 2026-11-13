import { supabase } from './supabase';

export interface DashboardMetrics {
  memberCount: number;
  activeUserCount: number;
  sessionCount: number;
  scheduledDayCount: number;
  achievedDayCount: number;
  achievementRate: number | null;
  engagementEventCount: number;
  resumedEventCount: number;
  resumeRate: number | null;
  convertedUserCount: number;
  conversionRate: number | null;
}

export interface MemberRow {
  id: string;
  nickname: string;
  email: string | null;
  isSuspended: boolean;
  createdAt: string;
  sessionCount: number;
  lastReadOn: string | null;
}

export interface BookRow {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string;
  totalPages: number | null;
}

export interface BookPatch {
  title: string;
  author: string;
  publisher: string;
  totalPages: number | null;
}

export interface Page<T> {
  rows: T[];
  total: number;
}

export const PAGE_SIZE = 20;

export type AdminRoleCheck = { ok: true } | { ok: false; message: string };

/** 로그인한 계정이 admin인지 DB의 profiles.role로 확인한다. 화면 분기는 편의일 뿐이고 최종 방어선은 RLS·RPC다. */
export async function checkAdminRole(userId: string): Promise<AdminRoleCheck> {
  const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (error) {
    return { ok: false, message: `계정 정보를 확인하지 못했습니다: ${error.message}` };
  }
  if (!data || data.role !== 'admin') {
    return { ok: false, message: '관리자 계정이 아닙니다.' };
  }
  return { ok: true };
}

export async function fetchMetrics(today: string, days: number): Promise<DashboardMetrics> {
  const { data, error } = await supabase.rpc('admin_dashboard_metrics', { p_today: today, p_days: days });
  if (error) {
    throw new Error(error.message);
  }
  const row = data?.[0];
  if (!row) {
    throw new Error('지표 응답이 비어 있습니다.');
  }
  return {
    memberCount: row.member_count,
    activeUserCount: row.active_user_count,
    sessionCount: row.session_count,
    scheduledDayCount: row.scheduled_day_count,
    achievedDayCount: row.achieved_day_count,
    achievementRate: row.achievement_rate,
    engagementEventCount: row.engagement_event_count,
    resumedEventCount: row.resumed_event_count,
    resumeRate: row.resume_rate,
    convertedUserCount: row.converted_user_count,
    conversionRate: row.conversion_rate,
  };
}

export async function fetchMembers(search: string, pageIndex: number): Promise<Page<MemberRow>> {
  const { data, error } = await supabase.rpc('admin_list_members', {
    p_search: search,
    p_limit: PAGE_SIZE,
    p_offset: pageIndex * PAGE_SIZE,
  });
  if (error) {
    throw new Error(error.message);
  }
  const rows = (data ?? []).map((row) => ({
    id: row.id,
    nickname: row.nickname,
    email: row.email,
    isSuspended: row.is_suspended,
    createdAt: row.created_at,
    sessionCount: row.session_count,
    lastReadOn: row.last_read_on,
  }));
  return { rows, total: data?.[0]?.total_count ?? 0 };
}

export async function setSuspended(userId: string, isSuspended: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_suspended', { p_user_id: userId, p_suspended: isSuspended });
  if (error) {
    throw new Error(error.message);
  }
}

/** PostgREST or() 필터에서 쉼표·괄호·와일드카드가 구문으로 해석되지 않게 막는다. */
function sanitizeSearch(value: string): string {
  return value.replace(/[,()*%_\\]/g, ' ').trim();
}

export async function fetchBooks(
  search: string,
  missingPagesOnly: boolean,
  pageIndex: number,
): Promise<Page<BookRow>> {
  let query = supabase
    .from('books')
    .select('id, isbn, title, author, publisher, total_pages', { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id')
    .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE - 1);

  const keyword = sanitizeSearch(search);
  if (keyword) {
    query = query.or(`title.ilike.*${keyword}*,author.ilike.*${keyword}*,isbn.ilike.*${keyword}*`);
  }
  if (missingPagesOnly) {
    query = query.is('total_pages', null);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }
  const rows = (data ?? []).map((row) => ({
    id: row.id,
    isbn: row.isbn,
    title: row.title,
    author: row.author,
    publisher: row.publisher,
    totalPages: row.total_pages,
  }));
  return { rows, total: count ?? 0 };
}

export async function updateBook(bookId: string, patch: BookPatch): Promise<void> {
  const { data, error } = await supabase
    .from('books')
    .update({
      title: patch.title,
      author: patch.author,
      publisher: patch.publisher,
      total_pages: patch.totalPages,
    })
    .eq('id', bookId)
    .select('id');
  if (error) {
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    throw new Error('수정되지 않았습니다. 관리자 권한을 확인하세요.');
  }
}
