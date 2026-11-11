---
date: 2026-11-10
requirement: AUTH-01
author: 한예찬
reviewer:
---

## 1. Summary

테스트 계정 환경변수가 없을 때 자동 로그인 오류 대신 이메일·비밀번호 로그인 화면을 보여 준다. 변수가 있으면 기존 자동 로그인을 유지한다.

## 2. Requirements

- AUTH-01: 테스트 계정 자동 로그인은 환경변수가 있을 때만 유지. 없을 때의 수동 로그인은 실기기 확인 전

## 3. Implementation

- `lib/auth/AuthProvider.tsx`: 세션도 없고 테스트 계정 변수도 없으면 `signedOut`
- `components/auth/SignInForm.tsx`: `supabase.auth.signInWithPassword`로 로그인
- 비밀번호는 저장하거나 출력하지 않음

## 4. Problems & Solutions

- iPhone에서 보인 문구는 테스트 계정 환경변수가 비어 있다는 예외였다. Supabase 연결 실패나 계정 오류로 단정하지 않음

## 5. Verification

- `npx tsc --noEmit` 통과
- `npx expo lint` 통과
- iPhone에서 로그인 성공은 확인하지 못함

## 6. Next

- Expo Go에서 앱을 다시 불러온 뒤 테스트 계정으로 로그인한다
