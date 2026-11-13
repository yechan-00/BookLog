-- 로컬 개발용 시드 (`supabase db reset` 때만 실행되며 원격 DB에는 적용되지 않는다).
-- data/mockBooks.ts, data/mockReadingData.ts와 같은 내용을 테스트 계정 1개에 채운다.
-- 원격 프로젝트의 테스트 계정은 대시보드 Authentication에서 직접 만든다 (docs/specs/supabase-integration.md 1장).
-- seed는 superuser로 실행되어 auth.uid()가 null이므로 user_id를 모두 명시한다.

do $$
declare
  v_uid constant uuid := '00000000-0000-4000-8000-000000000001';
  v_today constant date := current_date;
  v_prev_month constant date := (date_trunc('month', current_date) - interval '1 month')::date;
  v_almond uuid; v_farewell uuid; v_demian uuid; v_vegetarian uuid;
  v_contradiction uuid; v_convenience uuid; v_dollargut uuid;
  ub_almond uuid; ub_demian uuid; ub_vegetarian uuid; ub_dollargut uuid;
  s_almond_1 uuid; s_almond_3 uuid; s_demian_3 uuid; s_demian_5 uuid;
  v_goal uuid;
begin
  -- 테스트 계정 (로컬 전용 비밀번호). handle_new_user 트리거가 profiles 행을 만든다.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
    'test1@booklog.local', crypt('booklog-local-test', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"nickname":"독서가"}', now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
  values (
    gen_random_uuid(), v_uid, v_uid::text, 'email',
    jsonb_build_object('sub', v_uid::text, 'email', 'test1@booklog.local', 'email_verified', true),
    now(), now(), now()
  );

  -- 도서 (ISBN은 시드용 가짜 값)
  insert into public.books (isbn, title, author, publisher, total_pages) values
    ('9990000000001', '아몬드', '손원평', '창비', 263) returning id into v_almond;
  insert into public.books (isbn, title, author, publisher, total_pages) values
    ('9990000000002', '작별하지 않는다', '한강', '문학동네', 332) returning id into v_farewell;
  insert into public.books (isbn, title, author, publisher, total_pages) values
    ('9990000000003', '데미안', '헤르만 헤세', '민음사', 248) returning id into v_demian;
  insert into public.books (isbn, title, author, publisher, total_pages) values
    ('9990000000004', '채식주의자', '한강', '창비', 263) returning id into v_vegetarian;
  insert into public.books (isbn, title, author, publisher, total_pages) values
    ('9990000000005', '모순', '양귀자', '쓰다', 280) returning id into v_contradiction;
  insert into public.books (isbn, title, author, publisher, total_pages) values
    ('9990000000006', '불편한 편의점', '김호연', '나무옆의자', 268) returning id into v_convenience;
  insert into public.books (isbn, title, author, publisher, total_pages) values
    ('9990000000007', '달러구트 꿈 백화점', '이미예', '팩토리나인', 368) returning id into v_dollargut;

  -- 서재
  insert into public.user_books (user_id, book_id, status, total_pages, current_page, started_on, completed_on, last_read_on)
  values (v_uid, v_almond, 'reading', 263, 72, v_today - 20, null, v_today) returning id into ub_almond;
  insert into public.user_books (user_id, book_id, status, total_pages, current_page)
  values (v_uid, v_farewell, 'wishlist', 332, 0);
  insert into public.user_books (user_id, book_id, status, total_pages, current_page, started_on, completed_on, last_read_on)
  values (v_uid, v_demian, 'completed', 248, 248, v_today - 9, v_today - 5, v_today - 5) returning id into ub_demian;
  insert into public.user_books (user_id, book_id, status, total_pages, current_page, started_on, completed_on, last_read_on)
  values (v_uid, v_vegetarian, 'completed', 263, 263, v_today - 16, v_today - 2, v_today - 2) returning id into ub_vegetarian;
  insert into public.user_books (user_id, book_id, status, total_pages, current_page, started_on, last_read_on)
  values (v_uid, v_contradiction, 'paused', 280, 40, v_today - 80, v_today - 45);
  insert into public.user_books (user_id, book_id, status, total_pages, current_page)
  values (v_uid, v_convenience, 'wishlist', 268, 0);
  insert into public.user_books (user_id, book_id, status, total_pages, current_page, started_on, completed_on, last_read_on)
  values (v_uid, v_dollargut, 'completed', 368, 368, v_prev_month + 3, v_prev_month + 17, v_prev_month + 17)
  returning id into ub_dollargut;

  -- 목표: 매일 10쪽
  insert into public.reading_goals (user_id, type, target_value, days_of_week, reminder_time, starts_on)
  values (v_uid, 'pages', 10, array[0,1,2,3,4,5,6]::smallint[], '21:30', date '2026-09-01')
  returning id into v_goal;

  -- 세션 (read_on = 기기 로컬 날짜 기준)
  insert into public.reading_sessions (user_id, user_book_id, read_on, started_at, ended_at, duration_seconds, start_page, end_page)
  select v_uid, ub_demian, v_today + d, (v_today + d + t)::timestamptz, (v_today + d + t)::timestamptz + make_interval(mins => m), m * 60, sp, ep
  from (values
    (-9, time '21:00', 18, 20, 32),
    (-8, time '21:10', 16, 32, 44),
    (-7, time '20:40', 22, 44, 60),
    (-6, time '21:05', 15, 60, 72),
    (-5, time '21:20', 20, 72, 88)
  ) as x(d, t, m, sp, ep);

  insert into public.reading_sessions (user_id, user_book_id, read_on, started_at, ended_at, duration_seconds, start_page, end_page, one_line_review)
  select v_uid, ub, v_today + d, (v_today + d + t)::timestamptz, (v_today + d + t)::timestamptz + make_interval(mins => m), m * 60, sp, ep, rv
  from (values
    (ub_almond,     -3, time '21:00', 30,   2,  14, null),
    (ub_almond,     -2, time '19:00', 40,  14,  40, null),
    (ub_vegetarian, -2, time '20:00', 70, 195, 263, '마지막 장이 오래 남았다.'),
    (ub_almond,     -1, time '21:10', 24,  40,  66, '생각보다 몰입해서 읽었다.'),
    (ub_almond,      0, time '21:00', 20,  66,  72, null)
  ) as x(ub, d, t, m, sp, ep, rv);

  select id into s_almond_1 from public.reading_sessions where user_book_id = ub_almond and read_on = v_today - 3;
  select id into s_almond_3 from public.reading_sessions where user_book_id = ub_almond and read_on = v_today - 1;
  select id into s_demian_3 from public.reading_sessions where user_book_id = ub_demian and read_on = v_today - 7;

  -- 인덱스 (mock의 quote는 quote로, memo는 title로 옮긴다. 메모가 없으면 쪽수 제목을 쓴다)
  insert into public.book_indexes (user_id, user_book_id, session_id, page, title, quote, tags) values
    (v_uid, ub_almond, s_almond_3, 54, '나중에 다시 보고 싶은 부분', '중요한 것은 속도가 아니라 방향이다.', '{}'),
    (v_uid, ub_almond, s_almond_1, 11, '11쪽', '오늘은 여기까지 읽어도 충분하다.', '{}'),
    (v_uid, ub_demian, s_demian_3, 52, '책의 중심 문장', '혼자 서는 일이 이렇게 조용한 줄 몰랐다.', '{}');

  -- 완독 리뷰
  insert into public.reviews (user_id, user_book_id, rating, content) values
    (v_uid, ub_demian, 5, '혼자 서는 법을 다시 생각하게 한 책.'),
    (v_uid, ub_vegetarian, 4, '불편하지만 오래 남는 문장들이 있었다.'),
    (v_uid, ub_dollargut, 4, '잠들기 전에 읽기 좋은 이야기.');
end;
$$;

-- 관리자 웹 확인용 (ADMIN-01~03): 관리자 1명과 지표가 갈리는 일반 회원 6명. 로컬 전용 비밀번호.
-- 회원 7은 세션이 없고(전환 X), 회원 6은 오래전에만 읽었고(활성 X), 회원 5는 이용 정지 상태다.
do $$
declare
  v_admin constant uuid := '00000000-0000-4000-8000-000000000099';
  v_today constant date := current_date;
  v_book uuid;
  v_uid uuid;
  v_ub uuid;
  v_goal uuid;
  i integer;
  d integer;
  v_minutes integer;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_admin, 'authenticated', 'authenticated',
    'admin@booklog.local', crypt('booklog-admin-local', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"nickname":"운영자"}', now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
  values (
    gen_random_uuid(), v_admin, v_admin::text, 'email',
    jsonb_build_object('sub', v_admin::text, 'email', 'admin@booklog.local', 'email_verified', true),
    now(), now(), now()
  );
  update public.profiles set role = 'admin' where id = v_admin;

  select id into v_book from public.books order by isbn limit 1;

  for i in 2..7 loop
    v_uid := ('00000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'member' || i || '@booklog.local', crypt('booklog-local-test', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('nickname', '회원' || i),
      now() - make_interval(days => 20 - i), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
    values (
      gen_random_uuid(), v_uid, v_uid::text, 'email',
      jsonb_build_object('sub', v_uid::text, 'email', 'member' || i || '@booklog.local', 'email_verified', true),
      now(), now(), now()
    );

    insert into public.user_books (user_id, book_id, status, total_pages, current_page, started_on)
    values (v_uid, v_book, 'reading', 300, 0, v_today - 14)
    returning id into v_ub;

    -- 홀수 번호는 쪽수 목표(매일 10쪽), 짝수 번호는 시간 목표(평일 20분)
    insert into public.reading_goals (user_id, type, target_value, days_of_week, starts_on)
    values (
      v_uid,
      case when i % 2 = 1 then 'pages' else 'time' end,
      case when i % 2 = 1 then 10 else 20 end,
      case when i % 2 = 1 then array[0,1,2,3,4,5,6]::smallint[] else array[1,2,3,4,5]::smallint[] end,
      v_today - 14
    ) returning id into v_goal;

    if i <> 7 then
      for d in (case when i = 6 then 12 else 1 end)..(case when i = 6 then 13 else 10 end) loop
        if (d + i) % 3 <> 0 then
          v_minutes := 10 + (i * d) % 25;
          insert into public.reading_sessions (
            user_id, user_book_id, read_on, started_at, ended_at, duration_seconds, start_page, end_page
          ) values (
            v_uid, v_ub, v_today - d,
            (v_today - d + time '21:00')::timestamptz,
            (v_today - d + time '21:00')::timestamptz + make_interval(mins => v_minutes),
            v_minutes * 60, d * 10, d * 10 + 4 + (i * d) % 9
          );
        end if;
      end loop;
    end if;

    if i in (2, 3, 4) then
      insert into public.notification_logs (user_id, goal_id, kind, sent_at)
      values (v_uid, v_goal, 'engagement', (v_today - 3 + time '21:30')::timestamptz);
    end if;
    if i = 3 then
      insert into public.dust_wipe_logs (user_id, user_book_id, wiped_at, dust_level)
      values (v_uid, v_ub, (v_today - 4 + time '20:00')::timestamptz, 2);
    end if;
    if i = 5 then
      update public.profiles set is_suspended = true where id = v_uid;
    end if;
  end loop;
end;
$$;
