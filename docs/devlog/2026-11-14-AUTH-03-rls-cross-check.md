---
date: 2026-11-14
requirement: AUTH-03
author: 한인웅
reviewer:
---

## 1. Summary

AUTH-01 DevLog(2026-11-06)에서 남겨 둔 "두 번째 계정으로 교차 접근 확인"을 로컬 Supabase에서 했다. 다른 회원의 데이터를 읽거나 바꾸려는 시도가 모든 사용자 테이블에서 막힌다.

## 2. Requirements

- AUTH-03: RLS로 본인 데이터만 읽고 쓸 수 있다 (충족, 완료로 바꿨다). 원격 DB는 같은 마이그레이션이 적용되어 있지만 이번 시험은 로컬에서만 돌렸다.

## 3. Implementation

- `supabase/tests/rls_cross_access.sql`: 회원2가 test1·회원3의 데이터를 건드리는 시도, 익명(anon) 접근, 관리자의 원문 접근을 검사하고 마지막에 ROLLBACK한다. 결과가 `pass | fail` 한 줄로 나온다.
- `supabase/tests/admin_rpc.sql`: 관리자 RPC의 동작과 일반 사용자 차단 시험 (ADMIN DevLog 참고).
- 실행 방법은 각 파일 첫 줄에 적었다. `supabase db reset`으로 시드를 넣은 뒤 `docker exec`로 실행한다.

## 4. Problems & Solutions

- `DO $$ ... $$` 안에서는 psql 변수가 치환되지 않아, 피해자 `user_book` id를 설정값(`set_config('t.victim_ub', ...)`)으로 넘겼다.

## 5. Verification

- 로컬 DB에서 53개 시험이 모두 통과했다 (fail 0).
  - 읽기·수정·삭제: 사용자 테이블 7개 모두 남의 행이 0개·0행. profiles는 본인 1행만 보인다.
  - 삽입: 남의 `user_id`로 추가하면 RLS 위반, 내 `user_id`로 남의 책에 세션을 붙이면 복합 FK 위반.
  - 권한 상승: `profiles.role`·`is_suspended` 직접 수정은 permission denied. 일반 사용자는 `books`를 수정할 수 없고 admin RPC는 `42501`.
  - anon: 9개 테이블 읽기와 `register_book` 호출이 모두 차단된다.
  - 관리자: 사용자 데이터 7개 테이블의 원문은 0행이고 수정도 0행이다(원문 비노출).
- 확인하지 못함: 원격 DB에서 같은 시험, 두 번째 실기기 계정으로 앱을 통해 확인.

## 6. Next

- 원격 DB에서도 같은 스크립트를 돌릴지 팀과 정한다. 원격에는 시드가 없어 계정 2개를 직접 만들어야 한다.
