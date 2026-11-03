# Supabase 연결 설계안 (초안)

> 작성: 2026-11-03 · 한인웅 · 상태: 검토 중
> 관련 요구사항: AUTH-01~03 (직접), BOOK·GOAL·READ·INDEX·VIEW·NOTI (데이터 계층)
> 근거: `docs/PRD.md` 6·7·10장, 현재 `types/`·`data/`·`lib/supabase.ts`
> 결정 기록: [`docs/decisions/001-supabase-backend.md`](../decisions/001-supabase-backend.md)

## 0. 요약

- 인증은 **테스트 계정 `signInWithPassword` 자동 로그인**으로 시작하고, 루트 레이아웃에서 세션·프로필(역할·이용 정지)을 확인한 뒤 화면을 연다.
- DB는 PRD 9개 테이블을 snake_case로 옮기고, **모든 사용자 데이터 테이블에 `user_id`를 직접 둬서** RLS를 `user_id = auth.uid()` 한 줄로 통일한다.
- 여러 테이블을 함께 바꾸는 동작(도서 등록, 세션 저장, 완독, 목표 교체)은 **RPC 함수 하나로 묶어** 원자적으로 처리한다.
- 앱은 `lib/api/*` 함수만 Supabase를 호출하고, 화면은 지금처럼 도메인 타입(camelCase)만 받는다. `data/selectors.ts`의 계산 로직은 순수 함수로 남긴다.
- ⚠️ 2026-10-30부터 Supabase는 새 테이블을 Data API에 자동 노출하지 않는다. 마이그레이션에 **테이블별 `grant`를 반드시 넣어야** 한다 (RLS 정책만으로는 요청이 거부됨).

## 1. 인증·진입 흐름 (AUTH-01, AUTH-02)

```
앱 실행
 └ SplashScreen 유지
    ├ supabase.auth.getSession()
    │   └ 세션 없음 → signInWithPassword(테스트 계정)
    ├ profiles 조회 (role, is_suspended)
    │   ├ role = admin        → "관리자 웹을 이용하세요" 안내에서 멈춤
    │   ├ is_suspended = true → 이용 정지 안내에서 멈춤
    │   └ 활성 목표 없음      → 온보딩 (GOAL-01, 이후 PR)
    └ 탭 화면 진입
```

- 환경변수 (`.env.local`, `.env.example`에는 키 이름만):
  - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (기존)
  - `EXPO_PUBLIC_TEST_ACCOUNT_EMAIL`, `EXPO_PUBLIC_TEST_ACCOUNT_PASSWORD` (추가)
- 테스트 계정 비밀번호는 `EXPO_PUBLIC_`이라 앱 번들에 들어간다. RLS로 그 계정 자기 데이터만 접근되므로 MVP에서는 허용하고, P1 로그인 화면을 만들 때 제거한다.
- 세션 상태는 `AuthProvider`(Context)에 두고 `useAuth()`로 `userId`, `profile`, `status`(`loading | ready | suspended | admin | error`)를 꺼내 쓴다.
- 테스트 계정은 Supabase 대시보드 Authentication에서 직접 만든다 (user 2~3개 + admin 1개). `role`, `is_suspended`는 SQL로 지정.

## 2. 테이블 설계

공통 규칙

- PK는 `id uuid default gen_random_uuid()`.
- 사용자 데이터 테이블은 `user_id uuid not null default auth.uid()`를 둔다. 클라이언트가 `user_id`를 넣지 않아도 된다.
- 날짜만 필요한 값(`*_on`)은 `date`, 시각은 `timestamptz`. **"그날"의 기준은 기기 로컬 날짜**(`utils/date.ts`의 `toDateKey`)이므로 `read_on` 같은 날짜는 클라이언트가 계산해서 보낸다 (UTC 경계 문제 방지).
- 자식 테이블은 `(user_book_id, user_id)` 복합 FK로 `user_books(id, user_id)`를 참조해서, 남의 책에 세션을 붙이는 행을 DB가 막는다.

| 테이블 | 컬럼 | 비고 |
| --- | --- | --- |
| `profiles` | `id` (PK, FK → `auth.users`), `nickname`, `email`, `role` (`user`/`admin`), `is_suspended`, `created_at` | `auth.users` 가입 시 트리거로 자동 생성 |
| `books` | `id`, `isbn` (unique), `title`, `author`, `publisher`, `cover_url`, `total_pages` (nullable), `created_at` | 모든 사용자가 공유. 쓰기는 RPC·관리자만 |
| `user_books` | `id`, `user_id`, `book_id`, `status` (`wishlist`/`reading`/`completed`/`paused`), `total_pages` (≥1), `current_page` (≥0), `started_on`, `completed_on`, `last_read_on`, `created_at` | `unique(user_id, book_id)` |
| `reading_goals` | `id`, `user_id`, `type` (`time`/`pages`), `target_value` (>0), `days_of_week smallint[]`, `reminder_time time`, `notifications_enabled`, `starts_on`, `ends_on` (nullable) | 사용자당 `ends_on is null` 목표는 1개 (부분 unique 인덱스) |
| `reading_sessions` | `id`, `user_id`, `user_book_id`, `read_on`, `started_at`, `ended_at`, `duration_seconds`, `start_page`, `end_page`, `pages_read` (generated), `focus_exit_count`, `one_line_review` | |
| `book_indexes` | `id`, `user_id`, `user_book_id`, `session_id` (nullable), `page`, `title`, `quote` (nullable), `color`, `tags text[]`, `created_at` | `index`는 SQL 예약어라 이름 변경 |
| `reviews` | `id`, `user_id`, `user_book_id` (unique), `rating` (1~5), `content`, `created_at` | UserBook 1:1 |
| `dust_wipe_logs` | `id`, `user_id`, `user_book_id`, `wiped_at`, `dust_level` (0~3) | |
| `notification_logs` | `id`, `user_id`, `goal_id`, `kind` (`engagement`/`goal_reached`), `sent_at`, `read_after` | |

PRD·현재 타입과 달라지는 점 (팀 확인 필요)

1. **`books` PK를 ISBN에서 uuid로** — 카카오 응답의 `isbn`은 `"ISBN10 ISBN13"` 형태이거나 빈 값일 수 있다. `isbn`은 ISBN13을 정규화해 unique 키로만 쓴다.
2. **총 페이지를 `user_books.total_pages`에 둔다** — 카카오가 페이지 수를 주지 않아 사용자가 입력한다(BOOK-02). `books.total_pages`는 관리자 정정값·다음 등록자 기본값으로만 쓴다.
3. **인덱스는 `user_book_id` 필수 + `session_id` 선택** — PRD 6장 "확인 필요" 제안안 채택. 책 상세에서 추가한 인덱스도 저장된다.
4. **`rating`은 `reviews`에만** — 현재 `UserBook.rating`은 조회 시 리뷰에서 붙인다.
5. **`coverColor`·`spineColor`는 저장하지 않는다** — 책 id 해시로 `constants/colors`의 팔레트에서 고르는 유틸로 대체.
6. **`DailyGoalResult`는 테이블이 없다** — PRD대로 세션 합계와 그날 적용 목표로 계산한다.

## 3. RLS·권한 (AUTH-03, 보안 비기능 요구사항)

권한 원칙

- `anon` 역할에는 아무 테이블도 grant하지 않는다 (자동 로그인 후에만 접근).
- `authenticated`에는 테이블별로 필요한 권한만 grant한 뒤 RLS로 행을 제한한다.
- 보조 함수(`is_admin()` 등)는 Data API에 노출되지 않는 `private` 스키마에 `security definer`로 둔다.

| 테이블 | 일반 사용자 | 관리자 |
| --- | --- | --- |
| `profiles` | 본인 행 조회, `nickname`만 수정 (컬럼 단위 grant) | 전체 조회, `is_suspended` 수정 |
| `books` | 전체 조회 (insert는 RPC로만) | 조회·수정 |
| `user_books`, `reading_goals`, `reading_sessions`, `book_indexes`, `reviews`, `dust_wipe_logs`, `notification_logs` | 본인 행 CRUD | **정책 없음** — 원문 비노출(개인정보 요구사항). 지표는 집계 RPC로만 |

정책 예시 (모든 사용자 테이블이 같은 모양)

```sql
grant select, insert, update, delete on public.user_books to authenticated;
alter table public.user_books enable row level security;

create policy "own rows" on public.user_books
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

- `auth.uid()`를 `(select ...)`로 감싸면 행마다 다시 호출하지 않아 빠르다 (Supabase 권장 패턴).
- `profiles.role`, `is_suspended`는 사용자가 못 바꾸도록 `grant update (nickname)`만 준다.
- 이용 정지는 MVP에서 앱 진입 게이트로 막는다. 여유가 있으면 쓰기 정책에 `and not private.is_suspended()`를 더한다.

## 4. RPC 함수 (여러 테이블을 한 번에 바꾸는 동작)

| 함수 | 하는 일 | 요구사항 | 담당 |
| --- | --- | --- | --- |
| `register_book(isbn, title, author, publisher, cover_url, total_pages)` | ISBN으로 `books` upsert → `user_books` 생성(상태 `wishlist`), 이미 서재에 있으면 기존 행 반환 | BOOK-02 | 한인웅 |
| `finish_session(user_book_id, read_on, started_at, ended_at, start_page, end_page, focus_exit_count, one_line_review)` | 세션 저장 + `user_books.current_page`·`last_read_on` 갱신, 첫 세션이면 `started_on`·상태 `reading` | READ-04 | 함수 한인웅, 화면 연결 한예찬 |
| `complete_book(user_book_id, rating, content)` | 리뷰 저장 + 상태 `completed`, `completed_on`, `current_page = total_pages` | READ-05 | 한인웅 |
| `replace_goal(type, target_value, days_of_week, reminder_time)` | 기존 활성 목표 `ends_on = 오늘` + 새 목표 `starts_on = 오늘` | GOAL-01~02 | 한인웅 |
| `admin_dashboard_metrics(from, to)` | 관리자 확인 후 지표 6개 집계만 반환 | ADMIN-02 | 한인웅 |

- 사용자 RPC는 `security invoker`(호출자 권한 + RLS 적용)로 만든다. `register_book`만 `books` 쓰기 때문에 `security definer` + 입력 검증.
- `admin_dashboard_metrics`는 `security definer`이고 첫 줄에서 `private.is_admin()`이 아니면 예외를 던진다.

## 5. 앱 코드 구조

```
lib/
  supabase.ts          # 기존. createClient<Database>로 타입만 추가
  auth/
    AuthProvider.tsx   # 세션·프로필 상태, 자동 로그인
    useAuth.ts
  api/                 # Supabase 호출은 여기서만
    books.ts           # fetchLibraryBooks, fetchBookSummary, registerBook, updateBookStatus
    sessions.ts        # fetchSessions(range), finishSession
    goals.ts           # fetchActiveGoal, fetchGoalHistory, replaceGoal
    indexes.ts         # addIndex, fetchIndexes
    reviews.ts         # completeBook
    mappers.ts         # DB row(snake_case) → 도메인 타입(camelCase)
types/
  database.ts          # supabase gen types로 생성 (손으로 고치지 않음)
supabase/
  config.toml
  migrations/2026110x000000_init.sql
  seed.sql             # 현재 mock 데이터를 테스트 계정용으로 옮긴 것
```

호출 함수 규칙 (PRD 10장 접점 1번)

- 함수 이름은 `fetch*` / 동사형(`registerBook`, `finishSession`). 인자는 도메인 값, 반환은 `types/`의 도메인 타입.
- `{ data, error }`에서 `error`가 있으면 `throw`한다. 화면 훅에서 로딩·빈 상태·오류 상태로 바꾼다 (AGENTS.md 5. Data and errors).
- `user_id`는 인자로 받지 않는다 (DB default + RLS가 처리).
- 화면은 `hooks/`의 데이터 훅(`useLibraryBooks` 등)을 쓰고, 탭에 다시 들어올 때 `useFocusEffect`로 다시 불러온다. 캐싱 라이브러리(TanStack Query)는 지금은 넣지 않고, 필요해지면 decision record로 결정한다.
- `data/selectors.ts`의 `calculateStreak` 같은 계산은 `utils/`로 옮겨 데이터를 인자로 받는 순수 함수로 만든다. 홈·인사이트·관리자 지표가 같은 달성률 유틸을 쓴다 (PRD 접점 4번).
- mock 데이터는 `data/`에 남겨 두되, 화면이 Supabase로 바뀐 뒤에는 화면 코드에서 import하지 않는다.

## 6. 작업 순서 (PR 단위)

| # | 브랜치 | 내용 | 비고 |
| --- | --- | --- | --- |
| 0 | `docs/decision-supabase-backend` | 이 스펙 문서, `docs/decisions/001-supabase-backend.md` | 7장 결정 사항을 팀이 확인한 뒤 머지 |
| 1 | `chore/setup-supabase` | Supabase CLI 초기화, `init.sql`(테이블·grant·RLS·트리거·RPC), `seed.sql` | 원격 프로젝트에 `supabase db push` |
| 2 | `chore/database-types` | `types/database.ts` 생성, 도메인 타입 조정(`BookIndex.title` 등), `lib/supabase.ts`에 제네릭 | 공유 파일이라 작게 먼저 머지 |
| 3 | `feat/AUTH-01-auto-login` | `AuthProvider`, 루트 레이아웃 게이트, 정지·관리자 안내 화면, `.env.example` 갱신 | AUTH-01·02, PRD 상태 갱신 + DevLog |
| 4 | `feat/BOOK-03-library-data` | 서재·책 상세를 `lib/api/books.ts`로 교체 | 이후 각 기능 PR에서 화면별로 mock 제거 |
| 5~ | 기능별 | 세션 저장(한예찬), 목표·온보딩, 인덱스, 완독, 기록·인사이트 | RPC는 1번 PR에 미리 포함 |

1·2번은 한예찬 작업(타이머·세션)의 전제이므로 9주 말 접점 기준으로 먼저 머지한다.

## 7. 결정이 필요한 것

1. **테스트 계정 방식** — (추천) 미리 만든 계정 `signInWithPassword` vs 익명 로그인(`signInAnonymously`, 기기마다 다른 사용자). 익명은 비밀번호가 번들에 안 들어가지만 PRD와 다르고, 관리자 지표용 테스트 데이터 관리가 어렵다.
2. **총 페이지 위치** — 2장 2번안(`user_books.total_pages`)으로 갈지.
3. **ISBN 대신 uuid PK** — 2장 1번안.
4. **연속 독서일 기준** — 목표 요일만 셀지 매일 셀지 (PRD 미결). 스키마에는 영향 없고 계산 유틸만 바뀐다.
5. **관리자 웹 위치** — 이 저장소 안 `admin/` 폴더 vs 별도 저장소. 같은 Supabase 프로젝트와 `types/database.ts`를 공유해야 한다.
6. **마이그레이션 관리** — (추천) Supabase CLI 마이그레이션 파일을 저장소에 두고 `db push`. 대시보드 SQL Editor만 쓰면 두 사람의 스키마가 어긋나기 쉽다.

## 참고

- Supabase 변경 공지: 새 테이블 Data API 자동 노출 중단 (기존 프로젝트 2026-10-30 적용) — https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
- Supabase × Expo React Native 가이드 — https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
