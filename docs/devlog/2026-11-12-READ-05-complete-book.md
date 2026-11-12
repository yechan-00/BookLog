---
date: 2026-11-12
requirement: READ-05
author: 한인웅
reviewer:
---

## 1. Summary

완독 처리 화면을 mock에서 `complete_book` RPC 호출로 바꿨다. 별점과 총평을 저장하면 책이 완독 상태가 되고 완독일이 기록되며, 책 상세로 돌아간다.

## 2. Requirements

- READ-05: 별점(1~5)·총평 입력 → Review 저장, 상태 = 완독, 완독일(기기 로컬 날짜) 기록, 현재 페이지 = 총 페이지. 책꽂이 배치는 서재의 완독 목록(한예찬)이 읽는 값이 갱신된다. 실기기·쓰기 검증 전 (진행 중)
- READ-04: 마지막 페이지까지 읽고 저장하면 종료 화면에서 "완독 처리하기"로 바로 이동한다.
- BOOK-03: 서재의 상태 변경에서 완독을 고르면 `/book/complete?userBookId=…`로 이동하면 된다(한예찬 연결 필요).

## 3. Implementation

- `lib/api/reviews.ts`: `completeBook`. 별점은 호출 전에 1~5 정수로 검증하고, 날짜는 기기 로컬 기준으로 보낸다.
- `app/book/complete.tsx`: `userBookId`를 받아 책을 불러오고, 저장 중 입력을 잠그며 실패하면 오류를 보여 준다. 이미 완독한 책은 안내만 한다(다시 읽기는 MVP 범위 밖).
- `app/book/[id].tsx`: 읽는 중인 책에 "완독하기" 버튼을 다시 넣었다(READ-01 때 숨긴 `TODO(READ-05)` 해소).
- `app/reading/finish.tsx`: 마지막 페이지까지 읽은 경우 완독 처리 버튼을 보여 준다.

## 4. Problems & Solutions

- 총평은 기존 화면 규칙대로 필수로 두었다. PRD 문구("별점·총평 입력 시")가 선택 여부를 명확히 하지 않아, 선택으로 바꿀지 팀과 정한다.

## 5. Verification

- `npx tsc --noEmit`, `npx expo lint` 통과
- 원격 DB: 서재에 없는 id로 `complete_book`을 호출하면 `P0002 서재에 없는 책입니다.`가 오는 것만 확인했다(데이터 변경 없음).
- 확인하지 못함: 실제 완독 처리 쓰기(상태·완독일·리뷰 저장). 테스트 계정의 책 2권이 팀원이 읽는 중이라 바꾸지 않았다. 수요일에 확인한다.

## 6. Next

- 총평 필수 여부 결정
- 서재 상태 변경(BOOK-03)에서 완독 선택 시 이 화면으로 연결
