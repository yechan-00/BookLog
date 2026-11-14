-- 실행(로컬 전용, 시드 필요): docker exec -i supabase_db_BookLog psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/admin_rpc.sql
-- 각 단계의 기대값은 cho 제목에 적혀 있다. 지표 숫자는 시드 날짜(DB의 current_date)에 따라 달라진다.
begin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000099","role":"authenticated"}',true);
\echo '== 1. 관리자 지표 (최근 7일)'
select * from public.admin_dashboard_metrics(current_date, 7) \gx
\echo '== 2. 회원 목록 (7명 기대: test1 + 회원2~7), 검색 "회원5"'
select count(*) as total from public.admin_list_members();
select nickname, email, is_suspended, session_count, last_read_on, total_count from public.admin_list_members('회원5');
\echo '== 3. 정지 해제 → 재정지'
select public.admin_set_suspended('00000000-0000-4000-8000-000000000005', false);
select is_suspended from public.profiles where id='00000000-0000-4000-8000-000000000005';
select public.admin_set_suspended('00000000-0000-4000-8000-000000000005', true);
\echo '== 4. 관리자 계정 정지 시도 → P0002 기대'
do $$ begin
  perform public.admin_set_suspended('00000000-0000-4000-8000-000000000099', true);
  raise notice 'FAIL';
exception when sqlstate 'P0002' then raise notice 'OK: P0002'; end $$;
\echo '== 5. 관리자가 도서 정정 (books UPDATE 정책)'
update public.books set total_pages = 321 where isbn = (select isbn from public.books order by isbn limit 1) returning total_pages;
\echo '== 6. 일반 사용자는 모든 RPC 차단 (42501 기대)'
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin perform * from public.admin_dashboard_metrics(current_date, 7); raise notice 'FAIL metrics';
exception when sqlstate '42501' then raise notice 'OK metrics 42501'; end $$;
do $$ begin perform * from public.admin_list_members(); raise notice 'FAIL list';
exception when sqlstate '42501' then raise notice 'OK list 42501'; end $$;
do $$ begin perform public.admin_set_suspended('00000000-0000-4000-8000-000000000002', true); raise notice 'FAIL suspend';
exception when sqlstate '42501' then raise notice 'OK suspend 42501'; end $$;
\echo '   일반 사용자의 도서 수정은 0행이어야 함'
update public.books set total_pages = 999 returning 1;
rollback;

\echo '== 7. 독립 교차 확인 (superuser, 사용자별 직접 집계)'
with d as (select generate_series(current_date-7, current_date-1, interval '1 day')::date as day),
u as (select p.id from public.profiles p where role='user'),
x as (
  select u.id, d.day,
    (select g from public.reading_goals g where g.user_id=u.id and g.starts_on<=d.day and (g.ends_on is null or d.day<=g.ends_on) order by g.starts_on desc limit 1) as g
  from u cross join d
)
select count(*) filter (where (g).id is not null and extract(dow from day)::int = any((g).days_of_week)) as scheduled,
 count(*) filter (where (g).id is not null and extract(dow from day)::int = any((g).days_of_week) and
   case (g).type when 'time' then coalesce((select sum(duration_seconds) from public.reading_sessions s where s.user_id=x.id and s.read_on=x.day),0) >= (g).target_value*60
   else coalesce((select sum(pages_read) from public.reading_sessions s where s.user_id=x.id and s.read_on=x.day),0) >= (g).target_value end) as achieved
from x;
