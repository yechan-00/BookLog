---
date: 2026-11-10
requirement: GOAL-03
author: 한예찬
reviewer:
---

## 1. Summary

설정 화면에 목표 입력 검증, 알림 권한 확인, 참여 유도 알림 끄기를 연결했다. 목표 조회·저장 함수가 없어 저장은 성공으로 처리하지 않고, Mock 목표도 보여 주지 않는다.

## 2. Requirements

- GOAL-03: 입력과 권한, 참여 유도 알림 취소는 구현했다. 목표를 서버에 저장하고 그 값으로 예약을 갱신하는 수용 기준은 미충족 (진행 중)
- NOTI-01: 설정에서 권한 상태를 구분하고, 미결정일 때만 사용자 동작으로 요청한다. 실기기 확인 전 (진행 중)

## 3. Implementation

- `app/settings/index.tsx`: 현재 목표는 미연결로 표시. 저장 버튼은 검증을 통과해도 API 없음 안내만 하고 `syncEngagementReminder`를 호출하지 않음
- 알림 끄기는 `syncEngagementReminder({ goal: null })`로 참여 유도 예약만 취소
- `utils/goalForm.ts`: 목표량, 요일, HH:mm 검증
- `lib/notifications/permissions.ts`: 조회 실패를 `error`로 구분

## 4. Problems & Solutions

- `lib/api`에 목표 조회·`replace_goal` 호출 함수가 없다. 화면에서 테이블을 직접 읽거나 저장 API를 만들지 않았다
- 저장된 목표가 없으면 알림 켜기에서 예약을 만들지 않는다

## 5. Verification

- `npx tsc --noEmit` 통과
- `npx expo lint` 통과
- `lib/notifications/schedulePlan.test.ts` 통과
- 실기기에서 권한 팝업, 설정 이동, 예약 취소는 확인하지 못했다

## 6. Next

- 한인웅의 목표 조회·저장 함수가 오면 저장 성공 뒤에만 `syncEngagementReminder`를 호출한다
- 달성한 날짜 목록이 있으면 `achievedDates`로 넘긴다
