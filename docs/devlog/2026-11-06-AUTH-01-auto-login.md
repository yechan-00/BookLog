---
date: 2026-11-06
requirement: AUTH-01
author: 한인웅
reviewer:
---

## 1. Summary

테스트 계정 자동 로그인과 역할·이용 정지 분기(AUTH-01·02)를 앱 진입에 붙이고, 원격 Supabase에 스키마를 적용해 DB 타입과 `lib/api` 규칙의 첫 모듈(프로필·도서 등록·카카오 검색)을 만들었다.

## 2. Requirements

- AUTH-01: 구현 완료. Android 실기기에서 자동 로그인 후 홈 진입 확인 (완료)
- AUTH-02: 구현 완료. Android 실기기에서 일반 사용자 진입, 관리자·이용 정지 계정 안내 화면 확인 (완료)
- AUTH-03: 원격 RLS 적용. anon 차단과 본인 행 제한·권한 상승 차단 확인. 두 번째 계정으로 교차 접근 확인 전 (진행 중)
- BOOK-01·02: 백엔드 함수(`searchBooks`, `registerBook`) 완료, 카카오 검색 확인. `register_book` 호출은 확인 전. 화면은 한예찬 (진행 중)

## 3. Implementation

- `lib/auth/AuthProvider.tsx`: 세션 확인 → 없으면 `signInWithPassword` → 프로필 조회 → `status` 결정
- `components/auth/AuthGateScreen.tsx`, `app/_layout.tsx`: `ready`가 아니면 로딩·관리자·정지·오류 화면에서 멈춤
- `lib/api/profile.ts`, `books.ts`, `kakaoBooks.ts`, `errors.ts`: 오류는 throw, `user_id`는 인자로 받지 않음
- `types/database.ts`: `supabase gen types`로 생성. `lib/supabase.ts`에 제네릭 적용
- `types/book.ts`, `types/user.ts`: `BookSearchResult`, `RegisteredBook`, `Profile` 추가
- `.env.example`: `EXPO_PUBLIC_KAKAO_REST_API_KEY` 추가

## 4. Problems & Solutions

- 원격 프로젝트에 테이블이 없어 타입 생성이 막혔다. `supabase db push --remote`로 init 마이그레이션을 적용한 뒤 생성했다.
- `node_modules`가 없어 `npm ci`로 설치했다.
- 실기기에서 "Failed to download remote update"가 떴다. 폰 브라우저로는 Metro에 접속되어 네트워크 문제가 아니었고, Expo Go를 재설치하니 연결되었다. 브라우저로 접속하면 웹 번들 단계에서 `expo-sqlite`의 wasm 해석 오류가 나는데 앱(Android) 실행과는 무관하며, 웹 지원이 필요해질 때 따로 다룬다.

## 5. Verification

- `npx tsc --noEmit`, `npx expo lint` 통과
- 원격 DB에 대해 스크립트로 확인함 (통과): anon의 profiles·books·user_books·reading_sessions 접근 차단(42501), 테스트 계정 로그인, 프로필 조회(role=user), profiles에서 본인 행만 조회, role 자가 승격 차단, 남의 user_id로 user_books insert 차단, books 직접 insert 차단
- 카카오 책 검색 호출 성공 (status 200, 결과 반환, isbn은 "ISBN10 ISBN13" 형태)
- Android 실기기(Expo Go 58.0.5)에서 확인함: 자동 로그인 후 홈 진입, 관리자 계정은 "관리자 웹을 이용해 주세요" 안내, 이용 정지 계정은 정지 안내에서 멈춤. 확인 뒤 계정은 원래 값(role=user, is_suspended=false)으로 되돌림
- 아직 확인하지 못함: 두 번째 user 계정으로 교차 읽기·쓰기 차단, `register_book` RPC 호출

## 6. Next

- 두 번째 user 계정으로 교차 접근 차단 확인
- `register_book` 호출은 화면(한예찬)과 연결할 때 확인
- 활성 목표가 없으면 온보딩으로 보내는 분기는 GOAL-01에서 추가
- 책 상세 라우트 파라미터를 `userBookId`로 맞추는 작업(10주 수요일 합의)
