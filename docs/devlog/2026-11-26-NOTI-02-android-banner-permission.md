---
date: 2026-11-26
requirement: NOTI-02
author: 한인웅
reviewer:
---

## 1. Summary

Android에서 BookLog 알림이 화면 위 배너로 뜨지 않고 알림 창에만 쌓이던 문제를 고쳤다. 설정 화면에서 알림 권한을 허용하고 돌아와도 "알림 권한 필요"가 초록 체크와 함께 남아 있던 표시도 고쳤다.

## 2. Requirements

- NOTI-02, READ-03: 참여 유도·목표 도달 알림이 Android에서 배너로 표시된다. 상태는 진행 중 유지
- NOTI-01, GOAL-03: 설정 화면의 알림 상태가 실제 권한을 따라간다

## 3. Implementation

- `lib/notifications/runtime.ts`(한예찬 소유): 채널을 `booklog-reminders-high`(중요도 HIGH)로 새로 만든다. Android는 이미 만든 채널의 중요도를 앱이 올릴 수 없어 채널 id를 바꿨다. 옛 채널 `booklog-reminders`는 그 채널로 예약된 알림이 남아 있지 않을 때만 지운다
- `app/settings/index.tsx`(한예찬 소유): 앱이 포그라운드로 돌아오면 권한을 다시 읽는다(`useFocusReturn`). 상태 표시를 허용됨(초록 체크)·권한 필요(주황 종)·그 외(회색 시계)로 나눴다

## 4. Problems & Solutions

- 옛 채널을 바로 지우면, 그 채널로 이미 예약된 참여 유도 알림이 발송 시점에 버려진다. 알림 재예약은 목표·세션 저장 때만 일어난다 → 예약 목록에 옛 채널(또는 채널을 알 수 없는 예약)이 있으면 채널을 남겨 두고, 다음 실행 때 다시 확인한다
- 권한 안내 시트의 `설정 열기`로 시스템 설정에 다녀오면 설정 화면은 포커스를 잃지 않아 `useFocusEffect`가 다시 돌지 않았다 → 앱 복귀 이벤트로 권한을 다시 읽는다

## 5. Verification

- `npx expo lint` 통과. `npx tsc --noEmit`은 기존 오류 1건(`/dev/library-preview` 경로 타입)만 남음
- Android 에뮬레이터(API 35, Release) 확인 결과는 PR에 적는다

## 6. Next

- 이미 설치된 기기는 다음 실행 때 새 채널이 만들어진다. 옛 채널로 예약된 알림은 목표·세션을 저장해 재예약되면 새 채널로 옮겨진다
- iOS는 변경 없음
