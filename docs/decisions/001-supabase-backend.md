# 001. 백엔드로 Supabase를 쓰고 데이터 접근 규칙을 통일한다

> 날짜: 2026-11-03 · 작성: 한인웅 · 상태: 제안됨 (팀 검토 중)
> 상세 설계: [`docs/specs/supabase-integration.md`](../specs/supabase-integration.md)

## Context

- 앱(Expo)과 관리자 웹(React)이 같은 백엔드를 써야 하고, 두 사람이 한 학기 안에 MVP를 끝내야 한다. 서버를 따로 운영할 여력이 없다.
- PRD 보안 요구사항: 모든 사용자 테이블에 RLS, 관리자 집계는 admin 전용 RPC로만, 관리자 웹에는 인덱스·한줄평·총평 원문을 노출하지 않는다.
- MVP는 회원가입·로그인 화면 없이 테스트 계정으로 자동 로그인한다 (AUTH-01).
- 지금 화면은 모두 `data/`의 mock을 읽고 있고, `lib/supabase.ts`에는 클라이언트 초기화만 있다.
- Supabase는 2026-10-30부터 새 테이블을 Data API에 자동 노출하지 않으므로, 테이블마다 권한을 명시적으로 줘야 한다.

## Decision

1. 백엔드는 Supabase(Auth, PostgreSQL, RLS, RPC) 하나로 한다.
2. 인증은 미리 만든 테스트 계정으로 `signInWithPassword` 자동 로그인하고, `profiles.role`·`is_suspended`로 진입을 나눈다.
3. 모든 사용자 데이터 테이블에 `user_id`(기본값 `auth.uid()`)를 두고 RLS 정책을 `(select auth.uid()) = user_id` 하나로 통일한다. `anon`에는 권한을 주지 않고, `authenticated`에는 테이블마다 필요한 권한만 `grant`한다.
4. 여러 테이블을 함께 바꾸는 동작(도서 등록, 세션 저장, 완독, 목표 교체)과 관리자 집계는 RPC 함수로 만든다.
5. 스키마는 Supabase CLI 마이그레이션 파일(`supabase/migrations/`)로 저장소에서 관리하고, DB 타입은 `supabase gen types`로 `types/database.ts`에 생성한다.
6. 앱은 `lib/api/*`에서만 Supabase를 호출하고, 화면에는 `types/`의 도메인 타입만 넘긴다.

## Alternatives considered

- **Firebase (Firestore)**: 문서형 DB라 달성률·연속 독서일·관리자 집계 같은 기간별 집계 쿼리가 번거롭고, 규칙 기반 접근 제어로는 "집계만 공개"를 표현하기 어렵다.
- **직접 만든 API 서버 (Node + DB)**: 접근 제어를 자유롭게 짤 수 있지만, 배포·인증까지 직접 맡아야 해서 학기 일정에 비해 부담이 크다.
- **익명 로그인 (`signInAnonymously`)**: 비밀번호가 앱 번들에 들어가지 않지만, PRD의 "미리 만든 테스트 계정"과 다르고 관리자 지표용 테스트 데이터를 관리하기 어렵다.
- **테이블 직접 쓰기만 사용 (RPC 없음)**: 단순하지만 세션 저장과 `user_books` 갱신처럼 함께 바뀌어야 하는 값이 중간 실패로 어긋날 수 있다.
- **대시보드 SQL Editor로만 스키마 관리**: 시작은 빠르지만 두 사람의 스키마 변경 이력이 남지 않는다.

## Consequences

- 테스트 계정 비밀번호가 `EXPO_PUBLIC_` 환경변수로 앱 번들에 들어간다. RLS로 피해 범위를 그 계정 데이터로 제한하고, P1 로그인 화면 도입 시 제거한다.
- 새 테이블을 만들 때마다 `grant`, `enable row level security`, 정책을 함께 써야 한다. 빠뜨리면 요청이 거부된다.
- `books`의 PK를 ISBN에서 uuid로 바꾸고, 총 페이지를 `user_books`에 두며, 인덱스에 `user_book_id`를 필수로 둔다. PRD 6장 데이터 모델과 현재 `types/`를 이에 맞춰 고쳐야 한다 (`chore/database-types` PR).
- 스키마를 바꾸면 마이그레이션 파일과 `types/database.ts`를 같은 PR에서 함께 갱신해야 한다.
- 남은 결정(연속 독서일 기준, 관리자 웹 위치 등)은 상세 설계 7장에서 팀이 정한다. 확정되면 이 기록의 상태를 "채택됨"으로 바꾼다.
