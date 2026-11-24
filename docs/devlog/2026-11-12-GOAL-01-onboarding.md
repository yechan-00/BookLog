---
date: 2026-11-12
requirement: GOAL-01
author: 한인웅
reviewer:
---

## 1. Summary

목표 조회·저장 API(`fetchActiveGoal`, `replaceGoal`)를 만들고, 활성 목표가 없으면 온보딩을 거쳐야 앱이 열리게 했다(GOAL-01). 설정 화면의 목표 수정과 알림 켜기·끄기를 실제 저장에 연결했다(GOAL-02). 저장 뒤에는 서버 목표와 오늘 기록으로 참여 유도 알림을 다시 예약한다.

## 2. Requirements

- GOAL-01: 단위·목표량·요일·알림 시간을 입력해 저장해야 홈으로 이동. 저장 뒤 알림 권한을 요청한다. 실기기 확인 전 (진행 중)
- GOAL-02: `replace_goal`로 이전 목표에 종료일을 기록하고 새 목표를 시작한다. 같은 날 다시 고치면 그날 목표를 덮어쓴다(RPC 동작). 실기기·쓰기 검증 전 (진행 중)
- NOTI-01·02, GOAL-03: 한예찬의 알림 모듈·설정 화면을 그대로 쓰고 호출만 연결했다. 상태는 바꾸지 않았다.

## 3. Implementation

- `lib/api/goals.ts`: `fetchActiveGoal`(활성 목표 없으면 null), `replaceGoal`(오늘 날짜는 기기 로컬 기준으로 전달), `setGoalNotificationsEnabled`. DB의 `HH:mm:ss`는 `HH:mm`으로 바꾼다.
- `lib/goals/GoalProvider.tsx`, `app/_layout.tsx`: 로그인 뒤 목표를 불러와 `loading / needed / ready / error`로 나눈다. `needed`면 라우트 대신 온보딩 화면을 직접 보여 줘서 홈으로 가는 길이 없다.
- `components/goals/GoalForm.tsx`, `OnboardingScreen.tsx`: 온보딩과 설정이 같은 폼을 쓴다. 초깃값(15분, 평일, 21:00)은 `constants/goal.ts`에 있고 사용자가 확인하고 눌러야 저장된다.
- `lib/reading/reminders.ts`: `refreshEngagementReminder()`. 서버 목표와 오늘 달성 여부로 `syncEngagementReminder`를 호출하고, 실패해도 던지지 않고 결과로 돌려준다(저장을 되돌리지 않기 위해).
- `app/settings/index.tsx`: 한예찬 소유 파일이다. 기존 입력 폼과 구조는 그대로 두고 연결만 추가했다(88줄 추가, 6줄 삭제). 현재 목표 표시, 목표 저장(`replace_goal` 후 알림 재예약), 알림 켜기·끄기를 `notifications_enabled`에 저장. 권한 UI는 그대로다. 입력 폼을 `GoalForm`으로 합치는 중복 제거는 팀과 합의한 뒤 따로 한다(온보딩의 `GoalForm`과 설정의 입력 폼이 지금은 중복이다).

## 4. Problems & Solutions

- 설정의 알림 끄기는 기기 예약만 취소해서, 이후 목표를 저장하면 알림이 다시 켜질 수 있었다. 켜기·끄기를 `notifications_enabled`에 저장하도록 바꿨다.
- 목표 로딩 오류에 로그인 오류 화면을 재사용하면 문구가 맞지 않아 전용 오류 화면을 만들었다.
- 테스트 계정에 이미 목표(2026-11-11 시작, 알림 시간 없음)가 있다. 알림 시간이 없는 목표는 알림 예약 없이 건너뛰고, 설정에서는 기본 21:00을 보여 준다.

## 5. Verification

- `npx tsc --noEmit`, `npx expo lint` 통과
- 원격 DB 읽기 확인(통과): 활성 목표 조회 형태, 기존 목표 1건 확인
- 확인하지 못함: `replace_goal` 쓰기 동작(같은 날 덮어쓰기, 다음 날 이력 보존). 테스트 계정에 팀원 데이터가 있어 변경하지 않았다. 목표 없는 계정이나 수요일 교차 확인 때 확인한다.
- 확인하지 못함: 온보딩 화면과 알림 권한 요청, 예약(Android 실기기)

## 6. Next

- 목표 없는 계정으로 온보딩 전체 흐름과 `replace_goal` 확인
- 세션 저장·시작 지점에서 알림 호출(READ-03, NOTI-02)
