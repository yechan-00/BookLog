---
date: 2026-11-11
requirement: VIEW-01
author: 한인웅
reviewer:
---

## 1. Summary

홈·기록·인사이트가 독서 이력을 불러올 때 책마다 세션을 따로 조회하던 것을, 세션 전체를 책 제목과 함께 한 번에 조회하도록 바꿨다. 화면에 보이는 값은 같고 요청 수만 줄었다.

## 2. Requirements

- VIEW-01~05: 이력 조회 방식 개선. 표시 결과는 변경 없음 (진행 중 유지)

## 3. Implementation

- `lib/api/sessions.ts`: `fetchReadingActivities()` 추가. `reading_sessions`에 `user_books(books(title))`를 붙여 한 번에 가져온다. 최신순으로 받아, 서버 행 제한(`max_rows` 1000)에 걸려도 오래된 기록부터 빠진다.
- `utils/readingSource.ts`(한예찬 작성): `loadReadingHistory()`가 서재 조회 + 책별 세션 조회 대신 목표 조회와 위 함수 두 요청을 병렬로 부른다.
- 홈 기준 요청 수: 책 N권일 때 N + 3번 → 3번 (목표, 세션, 현재 읽는 책).

## 4. Problems & Solutions

- 점검에서 탭에 들어올 때마다 책 수만큼 요청이 나가는 문제를 찾았다. 세션 테이블에 `user_books`로 가는 외래 키가 있어 조인 한 번으로 책 제목까지 가져올 수 있었다.
- 세션이 1000개를 넘으면 오래된 기록이 빠진다. MVP 기간에는 도달하지 않을 양이라 그대로 두고, 필요하면 기간 조건을 추가한다.

## 5. Verification

- `npx tsc --noEmit`, `npx expo lint` 통과
- 원격 DB에서 테스트 계정으로 새 조회와 기존 책별 조회를 비교: 책 2권·세션 4개, 결과 행 동일, 책 제목 누락 없음, 요청 3번 → 1번 (517ms → 117ms)
- 앱 화면(Android 실기기)은 아직 확인하지 못함: 홈·기록·인사이트 수치가 이전과 같은지

## 6. Next

- 실기기에서 홈·기록·인사이트 표시 확인
- 세션이 많아지면 기간 조건(예: 최근 1년) 추가 검토
