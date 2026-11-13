-- ADMIN-02·03: 관리자 웹용 집계·관리 RPC.
-- security definer라 RLS를 우회하므로, 모든 함수가 첫 줄에서 admin만 통과시킨다.
-- 집계값과 회원 기본 정보만 돌려준다. 인덱스·한줄평·총평 같은 원문은 돌려주지 않는다 (PRD 7장 개인정보).
-- 도서 정정(ADMIN-04)은 books의 "admin books update" 정책으로 처리하므로 RPC가 필요 없다.

------------------------------------------------------------------------------
-- 대시보드 지표 (ADMIN-02). 정의는 docs/PRD.md 9장.
-- 기간은 [p_today - p_days, p_today] 이고, 달성률은 오늘을 뺀 지난 날만 센다 (오늘은 아직 진행 중이므로).
-- 달성률 계산은 utils/readingPeriod.ts의 goalForDate·isGoalMet과 같은 규칙이다:
--   그날 적용되는 목표 = 시작일이 가장 늦은 목표, 목표 요일만 센다, 시간 목표는 분×60초, 쪽수 목표는 읽은 쪽 합계.
------------------------------------------------------------------------------
create function public.admin_dashboard_metrics(
  p_today date,
  p_days integer default 7
)
returns table (
  member_count bigint,
  active_user_count bigint,
  session_count bigint,
  scheduled_day_count bigint,
  achieved_day_count bigint,
  achievement_rate numeric,
  engagement_event_count bigint,
  resumed_event_count bigint,
  resume_rate numeric,
  converted_user_count bigint,
  conversion_rate numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from date := p_today - p_days;
begin
  if not (select private.is_admin()) then
    raise exception '관리자만 사용할 수 있습니다.' using errcode = '42501';
  end if;
  if p_days is null or p_days < 1 or p_days > 366 then
    raise exception '기간은 1~366일이어야 합니다.' using errcode = '22023';
  end if;

  select count(*) into member_count from public.profiles where role = 'user';

  select count(distinct s.user_id), count(*)
    into active_user_count, session_count
  from public.reading_sessions s
  join public.profiles p on p.id = s.user_id and p.role = 'user'
  where s.read_on > v_from and s.read_on <= p_today;

  with days as (
    select d::date as day from generate_series(v_from, p_today - 1, interval '1 day') as d
  ),
  applied as (
    select distinct on (g.user_id, days.day)
      g.user_id, days.day, g.type, g.target_value, g.days_of_week
    from days
    join public.reading_goals g
      on g.starts_on <= days.day and (g.ends_on is null or days.day <= g.ends_on)
    join public.profiles p on p.id = g.user_id and p.role = 'user'
    order by g.user_id, days.day, g.starts_on desc
  ),
  scheduled as (
    select * from applied where extract(dow from day)::smallint = any (days_of_week)
  ),
  daily as (
    select user_id, read_on, sum(duration_seconds) as seconds, sum(pages_read) as pages
    from public.reading_sessions
    where read_on >= v_from and read_on < p_today
    group by user_id, read_on
  )
  select
    count(*),
    count(*) filter (
      where case sc.type
        when 'time' then coalesce(dl.seconds, 0) >= sc.target_value * 60
        else coalesce(dl.pages, 0) >= sc.target_value
      end
    )
  into scheduled_day_count, achieved_day_count
  from scheduled sc
  left join daily dl on dl.user_id = sc.user_id and dl.read_on = sc.day;

  achievement_rate := case when scheduled_day_count = 0 then null
    else round(achieved_day_count::numeric / scheduled_day_count, 4) end;

  -- 재개: 먼지털이 또는 참여 유도 알림 뒤 24시간 안에 시작한 세션이 있으면 1건으로 센다.
  with events as (
    select user_id, sent_at as at from public.notification_logs where kind = 'engagement'
    union all
    select user_id, wiped_at as at from public.dust_wipe_logs
  ),
  in_period as (
    select e.* from events e
    join public.profiles p on p.id = e.user_id and p.role = 'user'
    where e.at::date > v_from and e.at::date <= p_today
  )
  select
    count(*),
    count(*) filter (
      where exists (
        select 1 from public.reading_sessions s
        where s.user_id = ip.user_id and s.started_at > ip.at and s.started_at <= ip.at + interval '24 hours'
      )
    )
  into engagement_event_count, resumed_event_count
  from in_period ip;

  resume_rate := case when engagement_event_count = 0 then null
    else round(resumed_event_count::numeric / engagement_event_count, 4) end;

  -- 전환: 가입자 중 세션을 한 번이라도 저장한 사용자 (기간과 무관한 누적값)
  select count(*) into converted_user_count
  from public.profiles p
  where p.role = 'user' and exists (select 1 from public.reading_sessions s where s.user_id = p.id);

  conversion_rate := case when member_count = 0 then null
    else round(converted_user_count::numeric / member_count, 4) end;

  return next;
end;
$$;

------------------------------------------------------------------------------
-- 회원 목록·검색 (ADMIN-03). 닉네임·이메일에 검색어가 들어 있으면 일치한다 (와일드카드 문자도 그대로 비교).
------------------------------------------------------------------------------
create function public.admin_list_members(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  nickname text,
  email text,
  is_suspended boolean,
  created_at timestamptz,
  session_count bigint,
  last_read_on date,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := lower(btrim(coalesce(p_search, '')));
begin
  if not (select private.is_admin()) then
    raise exception '관리자만 사용할 수 있습니다.' using errcode = '42501';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 200 or p_offset is null or p_offset < 0 then
    raise exception '조회 범위가 올바르지 않습니다.' using errcode = '22023';
  end if;

  return query
  select
    p.id, p.nickname, p.email, p.is_suspended, p.created_at,
    coalesce(stat.session_count, 0), stat.last_read_on,
    count(*) over ()
  from public.profiles p
  left join lateral (
    select count(*) as session_count, max(s.read_on) as last_read_on
    from public.reading_sessions s
    where s.user_id = p.id
  ) stat on true
  where p.role = 'user'
    and (
      v_search = ''
      or position(v_search in lower(p.nickname)) > 0
      or position(v_search in lower(coalesce(p.email, ''))) > 0
    )
  order by p.created_at desc, p.id
  limit p_limit offset p_offset;
end;
$$;

------------------------------------------------------------------------------
-- 이용 정지·해제 (ADMIN-03). 일반 회원만 대상이고, 정지 여부는 profiles.is_suspended 하나만 바꾼다.
------------------------------------------------------------------------------
create function public.admin_set_suspended(
  p_user_id uuid,
  p_suspended boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if not (select private.is_admin()) then
    raise exception '관리자만 사용할 수 있습니다.' using errcode = '42501';
  end if;
  if p_suspended is null then
    raise exception '정지 여부가 비어 있습니다.' using errcode = '22023';
  end if;

  update public.profiles
  set is_suspended = p_suspended
  where id = p_user_id and role = 'user';
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception '회원을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.admin_dashboard_metrics(date, integer) from public, anon;
revoke execute on function public.admin_list_members(text, integer, integer) from public, anon;
revoke execute on function public.admin_set_suspended(uuid, boolean) from public, anon;
grant execute on function public.admin_dashboard_metrics(date, integer) to authenticated;
grant execute on function public.admin_list_members(text, integer, integer) to authenticated;
grant execute on function public.admin_set_suspended(uuid, boolean) to authenticated;
