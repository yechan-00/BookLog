---
date: 2026-11-27
requirement: READ-04
author: 한인웅
reviewer:
---

## 1. Summary

독서 세션 화면이 종료·완독 흐름 뒤에 잘못 남거나, 종료 화면을 열었다 돌아오면 목표 도달 알림이 사라지던 문제 두 가지를 고쳤다.

## 2. Requirements

- READ-04: 세션 저장 뒤 끝난 세션 화면이 다시 보이지 않는다
- READ-03: 종료 화면을 열었다가 세션으로 돌아와도 목표 도달 알림이 유지된다

## 3. Implementation

- `hooks/useReturnToBookDetail.ts`(신규): 독서 흐름에서 책 상세로 돌아가는 훅. 스택에 같은 책 상세가 있으면 `dismissTo`, 없으면(홈 카드에서 시작) `dismissAll` 후 상세를 연다
- `app/reading/finish.tsx`, `app/book/complete.tsx`: 책 상세 이동을 위 훅으로 바꿨다
- `app/reading/session.tsx`: 화면에 다시 포커스가 오면 진행 중 세션을 다시 읽고, 목표 도달 알림 예약을 마운트 때 한 번이 아니라 포커스마다 한다

## 4. Problems & Solutions

- `dismissTo`는 대상 화면이 스택에 없으면 맨 위 화면만 교체한다. 홈에서 시작하면 [탭, 세션, 상세]가 되어 뒤로 가면 끝난 세션 화면이 나왔다 → 스택을 보고 없으면 흐름을 비운 뒤 상세를 연다
- 종료 화면은 열릴 때 알림을 취소하는데(종료 시각이 고정되므로), 뒤로 돌아오면 세션 화면이 다시 예약하지 않았다 → 포커스 때마다 세션 시작 시각 기준으로 다시 예약한다

## 5. Verification

- `npx expo lint` 통과. `npx tsc --noEmit`은 기존 오류 1건(`/dev/library-preview` 경로 타입)만 남음
- Android 에뮬레이터(Release): 홈 카드로 시작 → 종료 화면 열었다 돌아옴 → 세션 시작 약 2분 25초 뒤 목표 도달 알림 표시. 이어서 완독까지 저장 → 책 상세에서 뒤로 → 홈으로 이동
- 책 상세에서 시작 → 기록 없이 종료 → 같은 책 상세로 돌아오고, 뒤로 가면 홈

## 6. Next

- 없음
