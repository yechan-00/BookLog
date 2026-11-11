---
date: 2026-11-10
requirement: BOOK-01
author: 한예찬
reviewer:
---

## 1. Summary

서재에서 책 검색 화면으로 들어가 카카오 검색 결과를 고르고, 총 페이지를 입력해 `registerBook`으로 서재에 추가하는 화면을 연결했다. 성공 응답을 확인한 뒤에만 서재로 돌아간다.

## 2. Requirements

- BOOK-01: 검색 화면·디바운스·결과 목록은 구현했다. 카카오 키가 로컬에 없고 실기기에서 결과 표시를 확인하지 못해 수용 기준은 미충족 (진행 중)
- BOOK-02: 총 페이지 검증, 로그인 확인, `registerBook` 호출은 구현했다. 실기기에서 저장과 서재 이동을 확인하지 못했다 (진행 중)

## 3. Implementation

- `app/book/search.tsx`: 검색 화면. 스택 헤더 제목은 "책 추가하기"
- `hooks/useBookSearch.ts`: 400ms 디바운스, 같은 검색어 재요청 생략, 이전 요청 취소
- `components/books/RegisterBookSheet.tsx`: 기존 `SheetModal`에서 총 페이지를 받고, 로그인 상태를 확인한 뒤 `registerBook`을 호출한다
- `app/(tabs)/library.tsx`: 책이 있으면 헤더의 "책 추가", 서재가 비어 있으면 빈 상태의 "책 추가"
- `lib/api`와 마이그레이션은 수정하지 않았다

## 4. Problems & Solutions

- `registerBook`은 독서 상태를 받지 않고 DB 함수가 `wishlist`로만 넣는다. 상태 선택 UI는 이 단계에 넣지 않고 BOOK-03으로 남긴다
- 로컬 `.env.local`에 `EXPO_PUBLIC_KAKAO_REST_API_KEY`, `EXPO_PUBLIC_TEST_ACCOUNT_EMAIL`, `EXPO_PUBLIC_TEST_ACCOUNT_PASSWORD`가 없다. 값을 만들거나 덮어쓰지 않았다
- 서재 목록은 아직 Mock이라 등록에 성공해도 목록에 바로 나타나지 않는다

## 5. Verification

- `npx tsc --noEmit` 통과
- `npx expo lint` 통과
- 실기기에서 검색 결과, 등록 성공, 등록 후 이동은 확인하지 못했다

## 6. Next

- 카카오 키와 테스트 계정 변수를 넣은 뒤 실기기에서 검색·등록을 확인한다
- BOOK-03에서 서재 목록을 실제 데이터로 바꾸고, 읽는 중·중단 변경과 완독의 READ-05 이동을 연결한다
