---
date: 2026-11-06
requirement: AUTH-01
author: 한인웅
reviewer:
---

## 1. Summary

테스트 계정 자동 로그인과 역할·이용 정지 분기(AUTH-01·02)를 앱 진입에 붙이고, 원격 Supabase에 스키마를 적용해 DB 타입과 `lib/api` 규칙의 첫 모듈(프로필·도서 등록·카카오 검색)을 만들었다.

## 2. Requirements

- AUTH-01: 코드 구현 완료, 테스트 계정이 없어 실기기 확인 전 (진행 중)
- AUTH-02: admin·정지 계정 안내 화면까지 구현, 계정 확인 전 (진행 중)
- AUTH-03: 마이그레이션의 RLS를 원격에 적용함. 다른 계정으로 접근 차단 확인 전 (진행 중)
- BOOK-01·02: 백엔드 함수(`searchBooks`, `registerBook`)만 완료. 화면은 한예찬 (진행 중)

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
- 앱 실행은 하지 못했다. `.env.local`과 Supabase 테스트 계정이 없다.

## 6. Next

- Supabase 대시보드에서 테스트 계정(user·admin)을 만들고 `.env.local`에 키를 넣은 뒤 Android 실기기로 확인
- 다른 계정으로 RLS 차단 확인
- 카카오 REST 키 발급 후 검색 호출 확인
- 활성 목표가 없으면 온보딩으로 보내는 분기는 GOAL-01에서 추가
- 책 상세 라우트 파라미터를 `userBookId`로 맞추는 작업(10주 수요일 합의)
