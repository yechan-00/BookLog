---
date: 2026-11-12
requirement: READ-03
author: 한인웅
reviewer:
---

## 1. Summary

한예찬이 만든 알림 모듈(`scheduleGoalReached`, `cancelGoalReached`, `syncEngagementReminder`)을 집중 독서 화면과 종료 화면의 알맞은 시점에 호출했다. 이 브랜치는 `feat/GOAL-01-onboarding` 위에 쌓여 있다.

## 2. Requirements

- READ-03: 시간 목표일 때 독서 화면이 열리면 남은 시간 뒤로 알림을 예약하고, 저장하거나 기록 없이 종료하면 취소한다. 페이지 목표는 모듈이 건너뛴다. 실기기 확인 전 (진행 중)
- NOTI-02: 세션을 저장한 뒤 오늘 목표 달성 여부를 반영해 참여 유도 알림을 다시 예약한다(달성한 날은 예약에서 빠진다). 실기기 확인 전 (진행 중)

## 3. Implementation

- `lib/reading/goalReached.ts`: `armGoalReached(startedAt)`. 목표 − (오늘 이미 저장한 시간 + 이번 세션의 지금까지 시간)을 분으로 계산해 넘긴다. 앱을 강제 종료했다가 이어하기로 다시 열어도 남은 시간이 맞다. 목표 요일이 아닌 날은 예약하지 않고 이전 예약을 취소한다. 실패해도 던지지 않고 결과로 돌려준다.
- `app/reading/session.tsx`: 화면이 열릴 때 예약하고, 실패하면 화면에 안내 한 줄을 보여 준다.
- `app/reading/finish.tsx`: 저장 성공 뒤 `cancelGoalReached()`와 `refreshEngagementReminder()`를 호출하고, 기록 없이 종료할 때도 취소한다. 알림 실패가 세션 저장 결과를 바꾸지 않는다.

## 4. Problems & Solutions

- 오늘 이미 읽은 시간을 반영하지 않으면 두 번째 세션에서 알림이 너무 늦게 울린다. 서버의 오늘 세션 합계를 더해서 계산한다.
- 이 파일들의 결과는 알림 모듈 함수(한예찬)의 동작에 의존한다. 모듈 자체는 수정하지 않았다.

## 5. Verification

- `npx tsc --noEmit`, `npx expo lint` 통과
- 확인하지 못함: Android 실기기에서 알림 발송(앱 종료 상태 포함), 저장·종료 시 취소, 두 번째 세션의 남은 시간. PRD 접점 5번(알림 실기기 확인)과 함께 수요일에 확인한다.

## 6. Next

- 실기기 확인 결과 반영
