-- BookLog 초기 스키마. 설계: docs/specs/supabase-integration.md, 결정: docs/decisions/001-supabase-backend.md
-- 2026-10-30부터 새 테이블은 Data API에 자동 노출되지 않으므로 테이블마다 grant를 명시한다.

------------------------------------------------------------------------------
-- 0. 보조 스키마 (Data API에 노출하지 않음)
------------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;

------------------------------------------------------------------------------
-- 1. 테이블
------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null default '',
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  isbn text unique,
  title text not null check (length(btrim(title)) > 0),
  author text not null default '',
  publisher text not null default '',
  cover_url text,
  total_pages integer check (total_pages is null or total_pages >= 1),
  created_at timestamptz not null default now()
);

create table public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id),
  status text not null default 'wishlist' check (status in ('wishlist', 'reading', 'completed', 'paused')),
  total_pages integer not null check (total_pages >= 1),
  current_page integer not null default 0 check (current_page >= 0),
  started_on date,
  completed_on date,
  last_read_on date,
  created_at timestamptz not null default now(),
  unique (user_id, book_id),
  -- 자식 테이블의 복합 FK 대상. 남의 책에 행을 붙이는 것을 DB가 막는다.
  unique (id, user_id)
);

-- 날짜 범위는 [starts_on, ends_on) 이다. ends_on은 새 목표가 시작된 날이고 그날부터 새 목표가 적용된다.
create table public.reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  type text not null check (type in ('time', 'pages')),
  target_value integer not null check (target_value > 0),
  -- 0 = 일요일 ... 6 = 토요일 (types/goal.ts와 동일)
  days_of_week smallint[] not null check (
    cardinality(days_of_week) > 0 and days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  ),
  reminder_time time,
  notifications_enabled boolean not null default true,
  starts_on date not null,
  ends_on date,
  created_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on),
  unique (id, user_id)
);
create unique index reading_goals_one_active_per_user on public.reading_goals (user_id) where ends_on is null;

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  user_book_id uuid not null,
  -- 기기 로컬 날짜. UTC 경계 문제를 피하려고 클라이언트가 계산해 보낸다.
  read_on date not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  start_page integer not null check (start_page >= 0),
  end_page integer not null check (end_page >= 0),
  pages_read integer generated always as (greatest(end_page - start_page, 0)) stored,
  focus_exit_count integer not null default 0 check (focus_exit_count >= 0),
  one_line_review text,
  created_at timestamptz not null default now(),
  check (ended_at >= started_at),
  unique (id, user_id),
  foreign key (user_book_id, user_id) references public.user_books (id, user_id) on delete cascade
);
create index reading_sessions_user_read_on on public.reading_sessions (user_id, read_on);

-- PRD의 Index. SQL 예약어라 book_indexes로 이름을 바꿨다.
create table public.book_indexes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  user_book_id uuid not null,
  session_id uuid,
  page integer not null check (page >= 0),
  title text not null check (length(btrim(title)) > 0),
  quote text,
  color text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  foreign key (user_book_id, user_id) references public.user_books (id, user_id) on delete cascade,
  foreign key (session_id, user_id) references public.reading_sessions (id, user_id) on delete set null (session_id)
);
create index book_indexes_user_book_page on public.book_indexes (user_book_id, page);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  user_book_id uuid not null unique,
  rating smallint not null check (rating between 1 and 5),
  content text not null default '',
  created_at timestamptz not null default now(),
  foreign key (user_book_id, user_id) references public.user_books (id, user_id) on delete cascade
);

create table public.dust_wipe_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  user_book_id uuid not null,
  wiped_at timestamptz not null default now(),
  dust_level smallint not null check (dust_level between 0 and 3),
  foreign key (user_book_id, user_id) references public.user_books (id, user_id) on delete cascade
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  goal_id uuid not null,
  kind text not null check (kind in ('engagement', 'goal_reached')),
  sent_at timestamptz not null default now(),
  read_after boolean,
  foreign key (goal_id, user_id) references public.reading_goals (id, user_id) on delete cascade
);

------------------------------------------------------------------------------
-- 2. 보조 함수·트리거
------------------------------------------------------------------------------
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- auth.users 가입 시 프로필 자동 생성. 역할은 항상 user이고 admin은 SQL로 지정한다.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, nickname)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nickname', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

------------------------------------------------------------------------------
-- 3. 권한(grant)과 RLS
-- anon에는 아무것도 주지 않는다. 관리자는 사용자 데이터 테이블에 정책이 없다(원문 비노출).
------------------------------------------------------------------------------
-- 프로젝트의 default privileges가 새 테이블을 anon·authenticated에 전체 권한으로 자동 grant할 수 있다.
-- 그대로 두면 아래의 좁은 grant가 의미 없어지므로(예: profiles.role 직접 수정) 먼저 모두 회수한다.
revoke all on all tables in schema public from anon, authenticated;

-- profiles: 본인 조회, nickname만 수정. 관리자는 전체 조회.
grant select on public.profiles to authenticated;
grant update (nickname) on public.profiles to authenticated;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);
create policy "admin profile select" on public.profiles
  for select to authenticated
  using ((select private.is_admin()));
create policy "own profile update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- books: 모두 조회. 쓰기는 register_book RPC와 관리자만.
grant select, update on public.books to authenticated;
alter table public.books enable row level security;
create policy "books select" on public.books
  for select to authenticated
  using (true);
create policy "admin books update" on public.books
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- 사용자 데이터 테이블: 본인 행 CRUD
do $$
declare
  t text;
begin
  foreach t in array array[
    'user_books', 'reading_goals', 'reading_sessions', 'book_indexes',
    'reviews', 'dust_wipe_logs', 'notification_logs'
  ]
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated '
      || 'using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t
    );
  end loop;
end;
$$;

------------------------------------------------------------------------------
-- 4. RPC (여러 테이블을 한 번에 바꾸는 동작)
-- user_id는 인자로 받지 않고 auth.uid()를 쓴다.
------------------------------------------------------------------------------

-- BOOK-02: books upsert + user_books 생성. books 쓰기 때문에 security definer.
create function public.register_book(
  p_isbn text,
  p_title text,
  p_author text,
  p_publisher text,
  p_cover_url text,
  p_total_pages integer
)
returns public.user_books
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_isbn text;
  v_book_id uuid;
  v_row public.user_books;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.' using errcode = '28000';
  end if;
  if p_title is null or length(btrim(p_title)) = 0 then
    raise exception '제목이 비어 있습니다.' using errcode = '22023';
  end if;
  if p_total_pages is null or p_total_pages < 1 then
    raise exception '총 페이지는 1 이상의 정수여야 합니다.' using errcode = '22023';
  end if;

  -- 카카오 isbn은 "ISBN10 ISBN13" 형태이거나 빈 값일 수 있다. ISBN13을 우선 쓴다.
  v_isbn := coalesce(
    (select t from unnest(string_to_array(btrim(coalesce(p_isbn, '')), ' ')) as t where length(t) = 13 limit 1),
    nullif(split_part(btrim(coalesce(p_isbn, '')), ' ', 1), '')
  );

  if v_isbn is not null then
    insert into public.books (isbn, title, author, publisher, cover_url, total_pages)
    values (v_isbn, btrim(p_title), coalesce(p_author, ''), coalesce(p_publisher, ''), p_cover_url, p_total_pages)
    on conflict (isbn) do nothing;
    select id into v_book_id from public.books where isbn = v_isbn;
  else
    insert into public.books (title, author, publisher, cover_url, total_pages)
    values (btrim(p_title), coalesce(p_author, ''), coalesce(p_publisher, ''), p_cover_url, p_total_pages)
    returning id into v_book_id;
  end if;

  insert into public.user_books (user_id, book_id, status, total_pages)
  values (v_uid, v_book_id, 'wishlist', p_total_pages)
  on conflict (user_id, book_id) do nothing;

  select * into v_row from public.user_books where user_id = v_uid and book_id = v_book_id;
  return v_row;
end;
$$;

-- READ-04: 세션 저장 + user_books 갱신. 호출자 권한이라 RLS가 적용된다.
create function public.finish_session(
  p_user_book_id uuid,
  p_read_on date,
  p_started_at timestamptz,
  p_ended_at timestamptz,
  p_start_page integer,
  p_end_page integer,
  p_focus_exit_count integer,
  p_one_line_review text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_updated integer;
begin
  insert into public.reading_sessions (
    user_book_id, read_on, started_at, ended_at, duration_seconds,
    start_page, end_page, focus_exit_count, one_line_review
  )
  values (
    p_user_book_id, p_read_on, p_started_at, p_ended_at,
    greatest(extract(epoch from (p_ended_at - p_started_at))::integer, 0),
    p_start_page, p_end_page, coalesce(p_focus_exit_count, 0), nullif(btrim(coalesce(p_one_line_review, '')), '')
  )
  returning id into v_session_id;

  update public.user_books
  set current_page = p_end_page,
      last_read_on = greatest(coalesce(last_read_on, p_read_on), p_read_on),
      started_on = coalesce(started_on, p_read_on),
      status = case when status in ('wishlist', 'paused') then 'reading' else status end
  where id = p_user_book_id;
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception '서재에 없는 책입니다.' using errcode = 'P0002';
  end if;

  return v_session_id;
end;
$$;

-- READ-05: 리뷰 저장 + 완독 처리. 완독일은 기기 로컬 날짜를 받는다.
create function public.complete_book(
  p_user_book_id uuid,
  p_rating smallint,
  p_content text,
  p_completed_on date
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_updated integer;
begin
  update public.user_books
  set status = 'completed',
      completed_on = p_completed_on,
      current_page = total_pages
  where id = p_user_book_id;
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception '서재에 없는 책입니다.' using errcode = 'P0002';
  end if;

  insert into public.reviews (user_book_id, rating, content)
  values (p_user_book_id, p_rating, coalesce(p_content, ''))
  on conflict (user_book_id) do update
    set rating = excluded.rating, content = excluded.content;
end;
$$;

-- GOAL-01~02: 활성 목표를 닫고 새 목표를 시작한다. "오늘"은 기기 로컬 날짜를 받는다.
create function public.replace_goal(
  p_type text,
  p_target_value integer,
  p_days_of_week smallint[],
  p_reminder_time time,
  p_today date
)
returns public.reading_goals
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_active public.reading_goals;
  v_row public.reading_goals;
begin
  select * into v_active from public.reading_goals where ends_on is null;

  -- 오늘 시작한 목표는 지난 날짜에 적용된 적이 없으므로 이력을 남기지 않고 제자리에서 고친다.
  if v_active.id is not null and v_active.starts_on >= p_today then
    update public.reading_goals
    set type = p_type, target_value = p_target_value, days_of_week = p_days_of_week, reminder_time = p_reminder_time
    where id = v_active.id
    returning * into v_row;
    return v_row;
  end if;

  if v_active.id is not null then
    update public.reading_goals set ends_on = p_today where id = v_active.id;
  end if;

  insert into public.reading_goals (type, target_value, days_of_week, reminder_time, starts_on)
  values (p_type, p_target_value, p_days_of_week, p_reminder_time, p_today)
  returning * into v_row;
  return v_row;
end;
$$;

revoke execute on function public.register_book(text, text, text, text, text, integer) from public, anon;
revoke execute on function public.finish_session(uuid, date, timestamptz, timestamptz, integer, integer, integer, text) from public, anon;
revoke execute on function public.complete_book(uuid, smallint, text, date) from public, anon;
revoke execute on function public.replace_goal(text, integer, smallint[], time, date) from public, anon;
grant execute on function public.register_book(text, text, text, text, text, integer) to authenticated;
grant execute on function public.finish_session(uuid, date, timestamptz, timestamptz, integer, integer, integer, text) to authenticated;
grant execute on function public.complete_book(uuid, smallint, text, date) to authenticated;
grant execute on function public.replace_goal(text, integer, smallint[], time, date) to authenticated;
