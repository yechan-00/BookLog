---
date: 2026-11-10
requirement: VIEW-04
author: 한예찬
reviewer:
---

## 1. Summary

홈과 인사이트가 기록 탭과 같은 목표·세션 계산을 쓰도록 연결했다. 조회 함수가 없어 예시 수치와 예시 책은 치우고, 연결 대기·기록 없음·조회 오류를 구분했다.

## 2. Requirements

- VIEW-05: 오늘의 목표 상태, 오늘 독서량, 현재 읽는 책 자리, 연속 독서·이번 주 확정 달성률을 구성했다. 실제 수치와 책꽂이 미리보기는 데이터 연결 전 (진행 중)
- VIEW-04: 최근 7일·30일 독서량, 주·월 확정 달성률, 같은 연속 독서일, 날짜별 추이를 구성했다. 실제 수치는 데이터 연결 전 (진행 중)

## 3. Implementation

- `utils/readingSummary.ts`: 오늘의 목표 진행, 기간 합산, 기간 달성률. 스트릭과 이번 주는 `readingStreak`, `weeklyAchievement`를 그대로 호출
- `utils/readingSource.ts`: 기록·현재 책 조회 상태. 지금은 둘 다 연결 대기
- 홈의 독서 시작은 책이 있을 때만 `/reading/session`으로 이동한다. 목표 달성과 분리했다
- 진행률 막대는 100%에서 멈추고, 초과 독서량은 숫자로 남긴다
- 페이지 값이 없거나 정수가 아니면 0으로 합산하지 않는다

## 4. Problems & Solutions

- 현재 목표, 목표 이력, 세션, 현재 읽는 책 조회 함수가 `lib/api`에 없다. 테이블 조회를 추가하지 않았다
- 필요한 `fetchReadingHistory(): Promise<ReadingHistory>`
  - 인자 없음. 사용자 ID는 세션에서 정한다
  - 반환 `goals`: `type`, `targetValue`, `daysOfWeek`, `startsOn`, `endsOn`
  - 반환 `activities`: `readOn`, `durationSeconds`, `pagesRead`, `bookTitle`. `pagesRead`는 저장값 또는 `null`
  - 실패하면 `Error`
  - 호출은 홈·기록·인사이트에 들어올 때
- 필요한 `fetchCurrentReadingBook(): Promise<LibraryBook | null>`
  - 인자 없음. 없으면 `null`
  - 실패하면 `Error`
  - 호출은 홈에 들어올 때

## 5. Verification

- 단위 테스트 통과
- `npx tsc --noEmit` 통과
- `npx expo lint` 통과
- 실기기에서 홈·인사이트 표시와 기간 전환은 확인하지 못했다

## 6. Next

- 조회 함수가 오면 `loadReadingHistory`와 `loadCurrentBook`만 교체한다
- VIEW-06 책꽂이는 완독 도서와 페이지 수 규칙이 있어야 홈 미리보기에 연결한다
- VIEW-07 먼지털이는 마지막 독서일과 DustWipeLog가 있어야 한다
