# 004. 목표 도메인 타입 통일과 상태 보관 방식

- 상태: 채택
- 날짜: 2026-11-24

## Context

main(#14)은 `ActiveGoal` 타입과 `GoalProvider`(앱 전체 목표 상태, 온보딩 게이트)를 만들었고, 한예찬 브랜치는 `StoredReadingGoal`(종료일·생성일 포함)과 화면별 직접 조회, 별도 온보딩 게이트를 만들었다. 두 구현이 같은 `replace_goal` RPC를 쓰지만 타입, 상태 보관, 함수 인자 순서가 달라 병합이 충돌했다.

## Decision

- 목표 도메인 타입은 `StoredReadingGoal`로 통일하고 `ActiveGoal`은 쓰지 않는다. 알림 계산, 달성률 이력(`toGoalPeriod`), 폼 유틸이 `endsOn`·`createdAt`을 필요로 한다
- 활성 목표의 앱 전체 상태는 main의 `GoalProvider`(`useGoal`)가 맡는다. 목표가 없으면 `OnboardingScreen`을 보여 주는 게이트도 여기서 처리한다
- 목표를 바꾸는 화면(설정, 온보딩)은 저장 후 `useGoal().refresh()`를 호출해 Provider와 어긋나지 않게 한다
- 목표 API의 인자 순서는 main을 따른다: `setGoalNotificationsEnabled(goalId, enabled)`

## Alternatives considered

- `ActiveGoal`을 유지하고 필드를 늘리기: 브랜치 쪽 `utils/`, `lib/notifications/` 코드가 `StoredReadingGoal`에 넓게 의존해 변경 범위가 더 크다
- 화면별 직접 조회(브랜치 방식)를 유지하고 `GoalProvider` 폐기: 온보딩 게이트와 홈이 각자 조회해 상태가 어긋날 수 있고, main의 게이트 구조를 다시 만들어야 한다

## Consequences

- 목표를 읽는 새 화면은 `useGoal()`을 우선 쓰고, 저장하는 화면은 `refresh()`를 잊지 않아야 한다
- 한예찬의 온보딩 route와 게이트가 사라졌다. 같은 UI가 `OnboardingScreen`에 있다
- `ActiveGoal`을 쓰던 외부 코드가 있다면 `StoredReadingGoal`로 바꿔야 한다. 현재 저장소에는 남아 있지 않다
