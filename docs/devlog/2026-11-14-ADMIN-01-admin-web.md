---
date: 2026-11-14
requirement: ADMIN-01
author: 한인웅
reviewer:
---

## 1. Summary

관리자 웹(`admin/`, React + Vite)을 새로 만들고 로그인·대시보드·회원 관리·도서 관리를 구현했다. 집계와 이용 정지는 admin 전용 RPC 3개로 제공하고, 도서 정정은 기존 `books` 수정 정책을 쓴다. 로컬 Supabase(docker)에서 SQL 시험과 브라우저 점검을 마쳤고, 원격 DB에는 아직 적용하지 않았다.

## 2. Requirements

- ADMIN-01: 이메일·비밀번호 로그인. 로그인 뒤 `profiles.role`을 읽어 admin이 아니면 세션을 버리고 차단한다. 새로고침 때도 저장된 세션의 역할을 다시 확인한다 (완료)
- ADMIN-02: 지표 카드 6개(가입자·활성 사용자·세션 수·달성률·재개율·전환율), 기간 7·14·30일 선택. 원문 데이터는 받지 않는다 (완료). 활성 사용자·세션 수·재개율·전환율 정의는 PRD 9장의 "제안" 그대로 구현했고 팀 확인이 필요하다
- ADMIN-03: 회원 목록·검색(닉네임·이메일)·페이지 이동, 이용 정지·해제 (완료)
- ADMIN-04: 도서 목록·검색(제목·저자·ISBN)·"페이지 수 누락만" 필터, 제목·저자·출판사·총 페이지 수정 (완료)

## 3. Implementation

- `supabase/migrations/20261114000000_admin_rpc.sql`
  - `admin_dashboard_metrics(p_today, p_days)`: 지표를 한 행으로 돌려준다. 분자·분모도 함께 준다(예: 달성 11일 / 예정 43일).
  - `admin_list_members(p_search, p_limit, p_offset)`: 회원 기본 정보와 세션 수·마지막 독서일만 돌려준다. 검색은 LIKE 없이 `position`으로 비교해 `%`·`_`가 와일드카드로 해석되지 않는다.
  - `admin_set_suspended(p_user_id, p_suspended)`: 일반 회원만 대상이다. admin 계정이나 없는 id는 `P0002`.
  - 세 함수 모두 `security definer`이고 첫 줄에서 `private.is_admin()`을 확인한다(아니면 `42501`).
- 달성률은 `utils/readingPeriod.ts`의 `goalForDate`·`isGoalMet`과 같은 규칙을 SQL로 옮겼다(결정 003의 방향): 그날 적용되는 목표는 시작일이 가장 늦은 것, 목표 요일만, 시간 목표는 분×60초, 쪽수 목표는 읽은 쪽 합계, 오늘은 제외.
- `admin/`: `src/lib`(supabase 클라이언트, 인증, API, 날짜), `src/pages`(로그인·대시보드·회원·도서), `src/components`. 메뉴가 3개라 라우터 라이브러리 없이 해시(`#/members`)로 나눴다. 의존성은 react, react-dom, @supabase/supabase-js와 개발용 vite·typescript뿐이다.
- `types/database.ts`에 새 RPC 3개의 타입을 추가해 앱과 관리자 웹이 같은 타입을 쓴다.
- `supabase/seed.sql`에 로컬 전용 admin 계정(`admin@booklog.local`)과 지표가 갈리는 회원 6명을 추가했다(정지 1명, 세션 없는 1명, 오래전에만 읽은 1명, 알림·먼지털이 기록 포함).
- 루트 `tsconfig.json`의 `exclude`와 `eslint.config.js`의 `ignores`에 `admin`을 넣어 앱 타입체크·lint가 관리자 웹을 읽지 않게 했다.

## 4. Problems & Solutions

- 앱의 `lib/supabase.ts`가 `https://*.supabase.co`가 아닌 URL을 막아 로컬 Supabase를 쓸 수 없었다. 개발 모드(`__DEV__`)에서만 `localhost`·`127.0.0.1`·`10.0.2.2`의 http를 허용하도록 좁게 열었다. 운영 빌드의 동작은 같다.
- 시드는 DB(UTC) 날짜 기준이고 화면은 기기 로컬 날짜를 `p_today`로 보내서, 한국 시간 자정~오전 9시에는 하루 어긋난 지표가 나온다. 로컬 시드 때문에 생기는 차이이고, 같은 `p_today`로 SQL을 직접 호출하면 화면과 일치한다.
- 셸 heredoc으로 여러 파일을 한 번에 쓰다가 구문 오류로 하나도 만들어지지 않았다. 파일 단위로 다시 만들었다.

## 5. Verification

- `admin/`: `npx tsc --noEmit`, `npx vite build` 통과. 앱: `npx tsc --noEmit` 통과.
- 로컬 DB(SQL, authenticated 역할로 JWT claim 지정):
  - 관리자가 지표·회원 목록·검색·정지 해제·재정지를 호출하면 동작한다.
  - 관리자 계정을 정지하려 하면 `P0002`.
  - 일반 사용자가 세 RPC를 호출하면 모두 `42501`, `books` 수정은 0행이다. 관리자의 `books` 수정은 1행이다.
- 달성률 교차 확인(결정 003의 3번): 앱 TS(`describeDay`)와 SQL 집계를 같은 시드 데이터에서 4가지 조건으로 비교해 모두 일치했다 (`오늘=11/14·7일` 예정 43/달성 11, `11/13·7일` 43/12, `11/14·14일` 86/19, `11/14·30일` 108/19).
- 브라우저(headless Chrome, 로컬 DB): 일반 계정 로그인 차단, 잘못된 비밀번호 안내, 관리자 로그인 후 카드 6개, 새로고침 후 세션 유지, 회원 검색·정지·해제, 도서 페이지 수 검증(0 거부)·수정 저장, 로그아웃이 모두 동작했다.
- 확인하지 못함: 원격 DB에서의 동작, 모바일 폭 레이아웃 점검, 실제 사용자 테스트 데이터로 본 지표.

## 6. Next

- 원격 DB에 마이그레이션 적용(팀 합의 후). 원격의 admin 계정은 대시보드에서 계정을 만든 뒤 SQL로 `profiles.role = 'admin'`을 지정해야 한다 (`admin/README.md`).
- 지표 정의 "제안" 항목을 팀이 확인한다. 달성률 집계가 큰 데이터에서 느리면 기간을 제한하거나 인덱스를 검토한다.
- `types/`·`tsconfig.json`·`eslint.config.js`는 공용 파일이라 별도 작은 PR로 먼저 병합하는 편이 규칙에 맞다.
- 앱 `lib/supabase.ts`의 개발 모드 예외도 별도 변경으로 분리해 리뷰를 받는다.
