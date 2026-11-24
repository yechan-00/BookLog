-- 실행(로컬 전용, 시드 필요): docker exec -i supabase_db_BookLog psql -U postgres -v ON_ERROR_STOP=1 -A -F " | " < supabase/tests/rls_cross_access.sql
-- 결과의 마지막 줄이 fail = 0이어야 한다. 모든 변경은 ROLLBACK된다.
-- AUTH-03 교차 접근 시험. 공격자 = 회원2, 피해자 = test1(전 테이블에 데이터 있음) 및 회원3(알림·먼지털이 기록).
-- 모든 시험은 트랜잭션 안에서 하고 마지막에 ROLLBACK한다.
begin;

create temp table results (name text, ok boolean, detail text);
grant all on results to anon, authenticated;

create function pg_temp.expect(p_name text, p_ok boolean, p_detail text default '') returns void
language sql as $$ insert into results values (p_name, p_ok, p_detail) $$;
grant execute on function pg_temp.expect(text, boolean, text) to anon, authenticated;

select id as victim_ub from public.user_books where user_id = '00000000-0000-4000-8000-000000000001' limit 1 \gset
select set_config('t.victim_ub', :'victim_ub', false) \g /dev/null

-- ===== 공격자: 회원2 (authenticated)
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',true) \g /dev/null

do $$
declare
  t text;
  v_foreign bigint;
  v_own bigint;
  v_rows bigint;
begin
  -- 1. 모든 사용자 테이블: 남의 행이 하나도 보이지 않는다
  foreach t in array array['user_books','reading_goals','reading_sessions','book_indexes','reviews','dust_wipe_logs','notification_logs']
  loop
    execute format('select count(*) from public.%I where user_id <> auth.uid()', t) into v_foreign;
    execute format('select count(*) from public.%I where user_id = auth.uid()', t) into v_own;
    perform pg_temp.expect('읽기: ' || t || ' 남의 행 0개', v_foreign = 0, 'foreign=' || v_foreign || ' own=' || v_own);
  end loop;

  -- 2. profiles: 본인 행만 보인다
  select count(*) into v_rows from public.profiles;
  perform pg_temp.expect('읽기: profiles 본인 1행만', v_rows = 1, 'rows=' || v_rows);

  -- 3. 남의 행 수정·삭제는 0행
  foreach t in array array['user_books','reading_goals','reading_sessions','book_indexes','reviews','dust_wipe_logs','notification_logs']
  loop
    execute format('update public.%I set user_id = user_id where user_id = %L', t, '00000000-0000-4000-8000-000000000001');
    get diagnostics v_rows = row_count;
    perform pg_temp.expect('수정: ' || t || ' 남의 행 0행', v_rows = 0, 'rows=' || v_rows);
    execute format('delete from public.%I where user_id = %L', t, '00000000-0000-4000-8000-000000000001');
    get diagnostics v_rows = row_count;
    perform pg_temp.expect('삭제: ' || t || ' 남의 행 0행', v_rows = 0, 'rows=' || v_rows);
  end loop;
end $$;

-- 4. 남의 user_id로 삽입 → RLS 위반
do $$ begin
  insert into public.reading_goals (user_id, type, target_value, days_of_week, starts_on)
  values ('00000000-0000-4000-8000-000000000001', 'pages', 5, array[1]::smallint[], current_date);
  perform pg_temp.expect('삽입: 남의 user_id로 목표 추가 차단', false, '삽입됨');
exception when insufficient_privilege then perform pg_temp.expect('삽입: 남의 user_id로 목표 추가 차단', true, 'RLS 위반');
end $$;

-- 5. 본인 user_id로 남의 user_book에 세션 붙이기 → 복합 FK 위반
do $$ begin
  insert into public.reading_sessions (user_id, user_book_id, read_on, started_at, ended_at, duration_seconds, start_page, end_page)
  values (auth.uid(), current_setting('t.victim_ub')::uuid, current_date, now(), now(), 60, 0, 5);
  perform pg_temp.expect('삽입: 남의 책에 내 세션 붙이기 차단', false, '삽입됨');
exception when foreign_key_violation then perform pg_temp.expect('삽입: 남의 책에 내 세션 붙이기 차단', true, '복합 FK 위반');
end $$;
do $$ begin
  insert into public.reading_sessions (user_id, user_book_id, read_on, started_at, ended_at, duration_seconds, start_page, end_page)
  values ('00000000-0000-4000-8000-000000000001', current_setting('t.victim_ub')::uuid, current_date, now(), now(), 60, 0, 5);
  perform pg_temp.expect('삽입: 남의 user_id로 세션 추가 차단', false, '삽입됨');
exception when insufficient_privilege then perform pg_temp.expect('삽입: 남의 user_id로 세션 추가 차단', true, 'RLS 위반');
end $$;

-- 6. 권한 상승: 본인 role·is_suspended 직접 수정 차단
do $$ begin
  update public.profiles set role = 'admin' where id = auth.uid();
  perform pg_temp.expect('권한 상승: profiles.role 수정 차단', false, '수정됨');
exception when insufficient_privilege then perform pg_temp.expect('권한 상승: profiles.role 수정 차단', true, 'permission denied');
end $$;
do $$ begin
  update public.profiles set is_suspended = false where id = auth.uid();
  perform pg_temp.expect('권한 상승: profiles.is_suspended 수정 차단', false, '수정됨');
exception when insufficient_privilege then perform pg_temp.expect('권한 상승: profiles.is_suspended 수정 차단', true, 'permission denied');
end $$;

-- 7. books: 일반 사용자는 수정 못 한다
do $$
declare v_rows bigint;
begin
  update public.books set title = title;
  get diagnostics v_rows = row_count;
  perform pg_temp.expect('books 수정: 일반 사용자 0행', v_rows = 0, 'rows=' || v_rows);
end $$;

-- 8. admin 전용 RPC 차단
do $$ begin
  perform * from public.admin_list_members();
  perform pg_temp.expect('admin RPC: 일반 사용자 차단', false, '실행됨');
exception when sqlstate '42501' then perform pg_temp.expect('admin RPC: 일반 사용자 차단', true, '42501');
end $$;

-- ===== 익명(anon)
reset role;
set local role anon;
do $$
declare t text; v_blocked boolean;
begin
  foreach t in array array['profiles','books','user_books','reading_goals','reading_sessions','book_indexes','reviews','dust_wipe_logs','notification_logs']
  loop
    begin
      execute format('select count(*) from public.%I', t);
      v_blocked := false;
    exception when insufficient_privilege then v_blocked := true;
    end;
    perform pg_temp.expect('anon: ' || t || ' 읽기 차단', v_blocked, '');
  end loop;
  begin
    perform public.register_book('x','x','','',null,10);
    perform pg_temp.expect('anon: register_book 차단', false, '');
  exception when insufficient_privilege then perform pg_temp.expect('anon: register_book 차단', true, '');
  end;
end $$;

-- ===== 관리자: 원문 테이블은 정책이 없어 보이지 않는다
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000099","role":"authenticated"}',true) \g /dev/null
do $$
declare
  t text;
  v_rows bigint;
begin
  foreach t in array array['user_books','reading_goals','reading_sessions','book_indexes','reviews','dust_wipe_logs','notification_logs']
  loop
    execute format('select count(*) from public.%I', t) into v_rows;
    perform pg_temp.expect('admin: ' || t || ' 원문 0행', v_rows = 0, 'rows=' || v_rows);
    execute format('update public.%I set user_id = user_id', t);
    get diagnostics v_rows = row_count;
    perform pg_temp.expect('admin: ' || t || ' 수정 0행', v_rows = 0, 'rows=' || v_rows);
  end loop;
end $$;

reset role;
select case when ok then 'PASS' else 'FAIL' end as r, name, detail from results order by ok, name;
select count(*) filter (where ok) as pass, count(*) filter (where not ok) as fail from results;
rollback;
