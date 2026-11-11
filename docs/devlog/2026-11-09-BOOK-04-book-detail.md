---
date: 2026-11-09
requirement: BOOK-04
author: 한인웅
reviewer:
---

## 1. Summary

책 상세 화면을 mock에서 Supabase 실제 데이터로 바꾸고, 독서 시작 버튼을 진행 중 세션(READ-01)과 연결했다. 인덱스 목록(INDEX-02)도 페이지 오름차순으로 DB에서 불러온다. 이 브랜치는 `feat/READ-01-timer` 위에 쌓여 있어 그 PR이 먼저 머지되어야 한다.

## 2. Requirements

- BOOK-04: 진행률(현재/총 페이지), 인덱스 목록, 독서 시작 버튼을 실제 데이터로 표시. 상태 변경 UI는 BOOK-03 범위라 아직 없음. 실기기 확인 전 (진행 중)
- INDEX-02: 페이지 오름차순 목록 구현. 실기기 확인 전 (진행 중)

## 3. Implementation

- `app/book/[id].tsx`: 라우트 파라미터 `id`를 `userBookId`로 사용한다. `useFocusData(fetchBookDetail)`로 화면에 들어올 때마다 새로 불러와, 독서를 마치고 돌아오면 진행률이 바로 바뀐다. 로딩·오류(다시 시도)·빈 상태를 처리한다.
- 독서 시작: `beginReadingSession`으로 세션을 만들거나 이어간다. 다른 책의 세션이 있으면 안내하고 그 세션으로 이동할 수 있게 한다.
- 읽고 싶음 상태의 책도 독서를 시작할 수 있다. 첫 세션을 저장하면 `finish_session`이 상태를 읽는 중으로 바꾼다. 완독한 책만 시작 버튼을 숨긴다.
- 노트(P1) 섹션은 제거했다.

## 4. Problems & Solutions

- 서재·홈의 mock 화면은 아직 mock의 책 id로 `/book/<id>`를 연다. 실데이터 책 상세는 `userBookId`가 필요하므로, 서재를 실데이터로 바꾸는 쪽(한예찬)이 `fetchLibraryBooks`의 `userBookId`로 이동하도록 맞춰야 한다. 11주 수요일 머지 때 함께 확인한다.
- 완독하기 버튼은 완독 처리 화면이 아직 mock 기반이라 숨겼다. `TODO(READ-05)`로 남겼다.

## 5. Verification

- `npx tsc --noEmit`, `npx expo lint` 통과
- 상세 조회에 쓰는 쿼리(`user_books` + `books` 조인, 세션 목록, 인덱스 페이지 오름차순)는 원격 DB에서 확인함 (READ-01 DevLog 참고)
- 앱 화면(Android 실기기)은 아직 확인하지 못함

## 6. Next

- 서재(한예찬)에서 `userBookId`로 책 상세에 진입하는지 11주 수요일에 교차 확인
- 상태 변경 UI는 BOOK-03 연결 때 추가, 완독하기 버튼은 READ-05에서 복원
