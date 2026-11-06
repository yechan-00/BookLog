---
date: 2026-11-06
requirement: AUTH-01
author: 한인웅
reviewer:
---

## 1. Summary

테스트 계정 자동 로그인과 역할·이용 정지 분기(AUTH-01·02)를 앱 진입에 붙이고, 원격 Supabase에 스키마를 적용해 DB 타입과 `lib/api` 규칙의 첫 모듈(프로필·도서 등록·카카오 검색)을 만들었다.

## 2. Requirements

- AUTH-01: 코드 구현 완료, 테스트 계정 로그인 확인. Android 실기기 확인 전 (진행 중)
- AUTH-02: admin·정지 계정 안내 화면까지 구현, 계정 확인 전 (진행 중)
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

## 5. Verification

- `npx tsc --noEmit`, `npx expo lint` 통과
- 원격 DB에 대해 스크립트로 확인함 (통과): anon의 profiles·books·user_books·reading_sessions 접근 차단(42501), 테스트 계정 로그인, 프로필 조회(role=user), profiles에서 본인 행만 조회, role 자가 승격 차단, 남의 user_id로 user_books insert 차단, books 직접 insert 차단
- 카카오 책 검색 호출 성공 (status 200, 결과 반환, isbn은 "ISBN10 ISBN13" 형태)
- 아직 확인하지 못함: Android 실기기 실행, 두 번째 user 계정으로 교차 읽기·쓰기 차단, admin·정지 계정 안내 화면, `register_book` RPC 호출

## 6. Next

- Android 실기기로 앱 실행 확인 (user 진입, admin·정지 안내 화면)
- 두 번째 user 계정으로 교차 접근 차단 확인
- `register_book` 호출은 화면(한예찬)과 연결할 때 확인
- 활성 목표가 없으면 온보딩으로 보내는 분기는 GOAL-01에서 추가
- 책 상세 라우트 파라미터를 `userBookId`로 맞추는 작업(10주 수요일 합의)
