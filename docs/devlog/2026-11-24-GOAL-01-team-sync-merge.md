---
date: 2026-11-24
requirement: GOAL-01
author: 한인웅
reviewer:
---

## 1. Summary

한예찬의 `integration/booklog-team-sync`(프론트 구현 139개 파일)를 최신 main(#8~#22)에 합쳤다. 두 브랜치가 PR #7 시점에서 갈라진 뒤 같은 기능(목표 API, 온보딩, 알림 호출, 책 상태 변경)을 따로 만들어 38개 파일이 충돌했다. "백엔드·데이터는 main, 화면은 소유자 기준, 알림 모듈은 한예찬 구현"이라는 기준으로 풀었다. 이 문서는 그 판단과 결과를 남긴다.

## 2. Requirements

- 기능 요구사항의 상태 변경은 없다. 통합 과정 기록이며, 걸쳐 있는 요구사항은 GOAL-01·03, NOTI-01·02, READ-03, BOOK-03, VIEW-01~07이다
- PRD는 충돌한 상태 열만 main 기준으로 정리했다 (GOAL-01·02 진행 중, READ-01·02·04·05 완료 등)
- 먼지털이(VIEW-07)는 한예찬 구현이 그대로 살아 있다. 실기기 확인 전이므로 PRD 상태는 올리지 않았다

## 3. Implementation

**해결 기준**

| 대상 | 기준 | 근거 |
| --- | --- | --- |
| `lib/api`, 인증, 조회 로직 | main | PRD 담당: 백엔드는 한인웅 |
| 한인웅 소유 화면 (책 상세, 완독, 독서 세션·종료) | main, 한예찬의 목표 달성 메시지만 추가 | PRD: 화면은 한 사람이 소유 |
| 한예찬 소유 화면 (홈, 서재, 기록, 인사이트, 책꽂이 컴포넌트) | 브랜치 | 충돌 내용이 같은 화면의 이전 스냅샷(#8, #12)이었음 |
| 알림 모듈 (`lib/notifications/*`) | 한예찬 | PRD: 알림 모듈 한예찬 |

**영역별 결과**

- **목표**: `lib/api/goals.ts`는 브랜치 버전(`fetchGoalHistory`, `toGoalPeriod`, 입력 검증 포함)에 `replace_goal` RPC 호출을 유지했다. 타입은 `StoredReadingGoal`로 통일하고 `ActiveGoal`을 없앴다. `setGoalNotificationsEnabled`는 main의 인자 순서 `(goalId, enabled)`로 맞췄다. 상태 보관은 main의 `GoalProvider`를 쓰고 설정 화면이 저장 후 `refresh()`를 호출한다 (결정 기록 004)
- **온보딩**: main의 `components/goals/OnboardingScreen.tsx`에 한예찬의 화면(알림 켜기·끄기, 권한 안내)을 옮겼다. 별도 route와 게이트(`app/onboarding/goal.tsx`, `GoalOnboardingContext`, `useGoalOnboardingGate`)는 제거했다
- **알림**: 모듈은 한예찬 버전을 쓴다. `lib/reading/reminders.ts`, `goalReached.ts`는 호출 지점(한인웅)으로 남기고 이름과 시그니처를 유지한 채 내부를 한예찬의 `syncEngagementFromStoredGoal`, `syncGoalReachedForSession`에 위임한다. 계정이 바뀔 때 이전 알림을 지우는 효과는 main의 `AuthProvider`에 다시 넣었다
- **책 상태**: `lib/api/books.ts`는 main의 `updateBookStatus(id, from, to)`(이전 상태 보호 조건 포함)를 쓴다. 한예찬 화면이 쓰던 `planBookStatusChange`, `statusChangeOptions`는 main 규칙(`nextStatuses`) 위에 얹었다
- **조회**: 이력 조회는 main의 요청 한 번 방식을 쓰고, `fetchReadingActivities`에 세션·책 id, 저자, 표지, 시작·종료 시각, 페이지, 이탈 횟수를 추가해 브랜치 화면이 쓰는 필드를 채웠다
- **먼지털이**: 변경 없이 유지했다. 이어 읽기만 main의 `startReading`을 거치게 해 일시정지 책의 "읽는 중으로 바뀌어요" 안내가 나오게 했다. DB는 기존 `dust_wipe_logs`와 RLS를 그대로 쓴다
- **공유 파일**: `package.json`은 main의 SDK 패치 버전, `tsconfig.json`은 양쪽 exclude의 합집합, `package-lock.json`은 `npm install --package-lock-only`로 다시 만들었다
- **테스트 도구**: `react-native`를 못 불러오는 Node에서 API 계층을 검증하려고 `utils/apiTest.loader.mjs`와 가짜 모듈(`utils/testing/`)을 추가했다. `lib/api/{goals,sessions,books}.test.ts`, `lib/reading/reading.test.ts`가 이를 쓴다

## 4. Problems & Solutions

- **같은 기능이 두 갈래로 구현됨**: 목표 API, 온보딩, 알림 동기화, 상태 변경이 add/add 충돌이었다 → 한쪽을 통째로 고르지 않고 위 기준표로 영역별 결정. 같은 `replace_goal` RPC를 쓰고 있어 백엔드 계약은 같았다
- **상태 전환 규칙이 다름**: 브랜치는 읽는 중에서 읽고 싶음으로 직행 가능, 완독은 되돌릴 수 없었고 main은 반대다 → 서버가 강제하는 main 규칙을 따랐다. 한예찬의 `bookStatus.test.ts` 기대값 3곳을 이 규칙에 맞게 고쳤다
- **파일 단위로 한쪽을 고르면 섞인 파일이 됨**: 충돌 구간만 브랜치 쪽을 택했더니 자동 병합된 main 조각이 남아 `tsc` 오류가 났다 → 15개 화면 파일은 브랜치 버전으로 통째로 교체
- **문자열 치환이 함수 이름까지 바꿈**: `ActiveGoal`을 `StoredReadingGoal`로 바꾸다 `fetchActiveGoal`이 `fetchStoredReadingGoal`로 바뀜 → `tsc`가 잡았고 되돌림
- **래퍼에서 방어 코드 누락**: `armGoalReached`로 위임하면서 잘못된 시작 시각을 0으로 처리하는 방어가 빠져 `NaN`이 알림 예약으로 넘어갔다 → 새 테스트가 잡았고 고침
- **로컬 DB가 마이그레이션보다 뒤처짐**: `20261114000000_admin_rpc`가 없어 SQL 테스트가 중간에 멈췄다 → 추가 마이그레이션만 적용하고 이력 테이블에 기록(데이터는 건드리지 않음)

## 5. Verification

- `npx tsc --noEmit` 오류 0, 단위 테스트 16개 파일 통과 (기존 12 + 신규 4). 신규 테스트는 코드를 일부러 망가뜨려 실패하는지 확인했다
- `npx expo export --platform android` 번들 성공 (컴파일 확인이며 화면 동작은 아님)
- `npx expo lint`: 오류 2건은 `hooks/useBookSearch.ts`로, main과 브랜치 양쪽에 이미 있던 문제
- `supabase/tests/rls_cross_access.sql`: 52 통과, 1 실패. 실패는 시드의 회원 2가 로컬에 없어 "본인 행 1개" 항목이 0이 된 것이며, 다른 사용자 데이터 접근 차단 항목은 모두 통과. `admin_rpc.sql`은 관리자 시드가 없어 실행하지 못함
- **실기기 확인은 하지 않았다** (온보딩, 알림 수신, 먼지털이, 서재 상태 변경)

## 6. Next

- 실기기 확인: 온보딩 → 알림(권한 허용·거부) → 먼지털이 → 상태 변경 순으로. 목록은 이 PR 설명에 첨부
- 연결되지 않은 코드 정리: `components/goals/GoalForm.tsx`, `constants/goal.ts`, `utils/onboardingGoal.ts`의 `decideGoalOnboarding`(테스트 포함)
- 알림 권한이 없을 때 "알림은 끈 상태로 저장" 안내가 화면 전환으로 보이지 않는다. 안내 방식 정하기 (한예찬)
- 앱에 로그아웃이 없어 "계정 전환 시 알림 정리"는 실제로 실행될 경로가 없다. 로그아웃을 만들 때 함께 확인
- `AuthProvider`의 "서버 주소를 찾을 수 없음" 안내 문구는 main 기준으로 합치며 빠졌다. 필요하면 다시 추가
- 시드(회원 2·3, 관리자)를 넣어 두 SQL 테스트를 끝까지 돌리기 (`supabase db reset`은 로컬 데이터를 지우므로 백업 후)
- `useBookSearch.ts` 기존 lint 오류 정리
- PR 설명에 한예찬 소유 파일 수정과 공유 파일 변경(`package.json`, `tsconfig.json`, `types/`)을 명시하고, 필요하면 공유 파일을 별도 PR로 나누기
- 한예찬 확인 후 `reviewer` 기입
