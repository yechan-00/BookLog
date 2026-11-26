---
date: 2026-11-26
requirement: VIEW-05
author: 한인웅
reviewer:
---

## 1. Summary

홈의 "지금 읽는 책" 카드에서 `독서 기록하기`를 누르면 "진행 중인 독서가 없어요"가 뜨던 문제를 다시 고쳤다. 11/11(#10)에 고친 문제가 홈 카드 개편 뒤 되살아난 것이다. 책 상세의 `집중 독서 시작`과 같은 `startReading`을 거치게 했다.

## 2. Requirements

- VIEW-05: 홈 현재 읽는 책에서 독서 시작이 다시 동작하도록 수정. 상태는 진행 중 그대로 둔다

## 3. Implementation

- `components/home/CurrentReadingCard.tsx`(한예찬 소유): `독서 기록하기`가 `/reading/session`으로 바로 이동하던 것을 `startReading(userBookId, currentPage, status)` 호출로 바꿨다. `status`를 넘겨, 홈 카드에 임시 중단 책이 나올 때도 "'읽는 중'으로 바뀌어요" 확인을 받는다

## 4. Problems & Solutions

- #10의 수정이 홈 대시보드 개편(#12)에서 카드가 새로 쓰이며 빠졌고, 통합 머지(#23)에서도 화면 파일을 브랜치 버전으로 통째로 교체해 잡히지 않았다 → 같은 수정을 다시 넣었다. 화면 컴포넌트라 현재 Node 테스트 환경에서 회귀 테스트를 붙이지 못했다

## 5. Verification

- `npx expo lint` 통과
- `npx tsc --noEmit`: 오류 1건(`app/settings/index.tsx`의 `/dev/library-preview` 경로 타입)은 수정 전에도 있던 것으로, 이번 변경과 무관하다
- 앱 화면은 아직 확인하지 못함: 진행 중 세션이 없을 때 새 세션 시작, 같은 책 세션 이어 하기, 다른 책 세션이 있을 때 안내

## 6. Next

- 위 세 경우를 기기에서 확인
- 홈 카드를 다시 고칠 때 독서 시작 버튼은 `startReading`을 거쳐야 한다는 점을 한예찬과 공유
- `app/settings/index.tsx` 경로 타입 오류는 별도로 정리
