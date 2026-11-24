---
date: 2026-11-11
requirement: VIEW-05
author: 한인웅
reviewer:
---

## 1. Summary

홈의 현재 읽는 책 카드에서 "이어 읽기"를 누르면 "진행 중인 독서가 없어요"가 뜨던 문제를 고쳤다. 책 상세의 독서 시작과 같은 함수를 쓰게 해, 세션이 없으면 새로 시작하고 있으면 이어 한다.

## 2. Requirements

- VIEW-05: 현재 읽는 책에서 독서 시작이 동작하도록 수정. 실기기 확인 전 (진행 중)

## 3. Implementation

- `lib/reading/startReading.ts`: 책 상세에 있던 `startReading`을 옮겼다. `beginReadingSession`으로 세션을 만들거나 이어 가고, 다른 책을 읽는 중이면 안내 후 그 세션으로 이동한다.
- `app/book/[id].tsx`: 옮긴 함수를 가져다 쓴다. 동작은 같다.
- `components/home/CurrentReadingCard.tsx`(한예찬 작성): "이어 읽기"가 독서 화면으로 바로 이동하던 것을 `startReading`을 거치게 바꿨다.

## 4. Problems & Solutions

- 책 상태 "읽는 중"은 서재 상태일 뿐이고, 기기의 진행 중 세션은 세션을 저장하면 지워진다. 홈 카드는 세션을 만들지 않고 독서 화면으로 이동해 빈 화면이 나왔다. 독서를 시작하는 버튼이 모두 같은 함수를 거치게 해 다시 생기지 않게 했다.

## 5. Verification

- `npx tsc --noEmit`, `npx expo lint` 통과
- 앱 화면(Android 실기기)은 아직 확인하지 못함: 홈 이어 읽기로 새 세션 시작, 진행 중 세션 이어 하기, 다른 책 세션이 있을 때 안내

## 6. Next

- 실기기에서 위 세 경우 확인
