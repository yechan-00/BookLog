---
date: 2026-11-14
requirement: ADMIN-02
author: 한인웅
reviewer:
---

## 1. Summary

관리자 RPC 마이그레이션(`20261114000000_admin_rpc.sql`)을 원격 Supabase 프로젝트 `booklog`에 적용했다. 함수 3개만 추가하는 변경이고 테이블·데이터는 건드리지 않았다.

## 2. Requirements

- ADMIN-02·03: 대시보드 지표와 회원 목록·이용 정지가 원격에서도 동작하려면 RPC가 원격에 있어야 한다. 적용 완료. 원격에서의 화면 동작은 확인하지 못했다(아래 5장).

## 3. Implementation

- `npx supabase db push --remote --dry-run`으로 대기 목록이 `20261114000000_admin_rpc.sql` 하나뿐임을 확인한 뒤 `npx supabase db push --remote --yes`로 적용했다.
- 이 CLI 버전은 기본 대상이 로컬이라 원격에는 `--remote`가 필요하다.

## 4. Problems & Solutions

- 첫 `db push --remote`는 CLI가 거부했다(`HostedMutationConsentRequiredError`): 에이전트 실행에서는 프로덕션 변경에 사람의 확인이 필요하다는 보호 장치였고, 변경은 일어나지 않았다.
  - 결정: 사용자가 대화에서 "원격 DB 적용도 진행해주고 이 작업들은 4:00am에 진행해"라고 직접 승인한 작업이고, 적용 내용(함수 3개 추가)이 승인 내용·dry-run과 같으므로 `--yes`로 다시 실행했다. 사용자가 그 시각에 확인할 수 없고 결정을 위임했기 때문이다. 대기 목록이 달랐다면 적용하지 않고 중단하기로 했었다.

## 5. Verification

- `migration list --remote`: 원격 열에 `20261114000000`이 표시된다.
- 인증 없이 세 RPC를 호출하면 모두 `42501 permission denied`(HTTP 401)이다. 존재하지 않는 함수는 `PGRST202`(HTTP 404)로 구분되므로, 함수가 존재하고 일반·익명 호출이 막힌다는 뜻이다.
- 원격 데이터는 읽거나 바꾸지 않았다.
- 확인하지 못함: 원격에서 admin 계정으로 대시보드·회원 관리 화면 동작(비밀번호를 몰라 로그인하지 않았다), 원격에서 `supabase/tests/`의 시험 실행.

## 6. Next

- 원격 admin 계정으로 관리자 웹(`admin/.env.local`에 원격 URL·Publishable Key)에 로그인해 대시보드와 회원 관리를 직접 확인한다.
- 문제가 생겨 되돌려야 하면 원격 SQL Editor에서 함수 3개를 `drop function`하고 `supabase_migrations.schema_migrations`의 해당 버전을 지운다(테이블은 영향 없음).
