---
date: 2026-11-10
requirement: NOTI-01
author: 한예찬
reviewer:
---

## 1. Summary

온보딩과 타이머 화면이 호출할 로컬 알림 모듈을 추가했다. 권한 요청, 시간 목표의 남은 시간 알림, 목표 요일의 참여 유도 알림을 함수로 제공한다. NotificationLog에는 쓰지 않는다.

## 2. Requirements

- NOTI-01: `requestNotificationPermission`, `getNotificationPermission`, `openNotificationSettings` 구현. 앱 시작 시 요청하지 않음. 실기기 권한 팝업은 미확인 (진행 중)
- NOTI-02: `syncEngagementReminder`가 목표 요일·시각의 단발 알림만 예약. 달성한 날은 빼며 매주 반복은 쓰지 않음. 발송과 NotificationLog 기록은 미확인 (진행 중)
- READ-03: `scheduleGoalReached`, `cancelGoalReached` 구현. 페이지 목표는 예약하지 않음. 실기기 발송·취소는 미확인 (진행 중)

## 3. Implementation

- `lib/notifications/permissions.ts`: 현재 권한 확인 후 필요할 때만 요청. 거부는 예외 없이 상태로 반환
- `lib/notifications/goalReached.ts`: 식별자 `booklog.goal-reached` 하나만 교체·취소
- `lib/notifications/engagement.ts`: `booklog.engagement.YYYY-MM-DD`를 최대 14일 예약. 다른 알림은 취소하지 않음
- `lib/notifications/schedulePlan.ts`: 요일·자정·과거 시각 계산. `schedulePlan.test.ts`로 확인
- 호출 화면(온보딩, 타이머, 종료, 설정)은 수정하지 않음

## 4. Problems & Solutions

- 매주 반복 알림은 목표를 달성한 날에도 울린다. 날짜마다 한 번만 예약하고, 달성한 날짜는 계획에서 제외한다
- 예약 시각이 지났다는 사실만으로 발송을 확정할 수 없다. `deliveryConfirmed`는 항상 false다
- 로컬 알림만 쓰므로 `expo-notifications`의 원격 알림 entitlement는 켜지 않았다

## 5. Verification

- `npx tsc --noEmit` 통과
- `npx expo lint` 통과
- `lib/notifications/schedulePlan.test.ts`의 요일·자정·과거 시각·달성일 제외 검사 통과
- iOS·Android 실기기에서 권한, 예약, 취소, 앱 종료 후 발송은 확인하지 못했다

## 6. Next

- 한인웅 화면에서 아래 함수를 호출한다
- 설정 화면(GOAL-03)에서 권한 재안내와 알림 켜기·끄기를 연결한다
- 실기기에서 예약·취소를 확인한 뒤 NotificationLog 저장은 한인웅 API에 연결한다

### 호출 규약

| 함수 | 호출 시점 | 반환 | 실패 시 | 취소 |
| --- | --- | --- | --- | --- |
| `requestNotificationPermission()` | 온보딩에서 사용자가 알림 단계를 지날 때 | `{ state: 'undetermined' \| 'granted' \| 'denied', canAskAgain }` | 던지지 않음 | 해당 없음 |
| `getNotificationPermission()` | 설정 화면 표시 | 위와 같음 | 던지지 않음 | 해당 없음 |
| `openNotificationSettings()` | 거부 후 설정 안내 버튼 | `boolean` | `false` | 해당 없음 |
| `scheduleGoalReached({ goalId, goalType, targetMinutes, elapsedMinutes })` | 시간 목표 세션 시작 | `scheduled` 또는 `skipped` 또는 `failed` | 상태값으로 반환 | `cancelGoalReached()`가 `booklog.goal-reached`만 취소 |
| `syncEngagementReminder({ goal, achievedDates, now? })` | 목표 저장, 세션 저장 뒤 | `synced` / `cleared` / `permission_denied` / `failed` | 상태값으로 반환 | `goal.enabled === false` 또는 목표 없음이면 참여 유도 식별자만 취소 |
| `listUnconfirmedDueEngagementReminders(now?)` | 앱을 다시 열 때 기록 후보 조회 | 아직 큐에 남은 지난 예약. `deliveryConfirmed: false` | 빈 배열 | 기록 API는 호출하지 않음 |
