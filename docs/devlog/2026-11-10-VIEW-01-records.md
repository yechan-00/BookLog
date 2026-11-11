---
date: 2026-11-10
requirement: VIEW-01
author: 한예찬
reviewer:
---

## 1. Summary

기록 탭에 월 달력, 주간 달성률, 연속 독서일 계산을 연결했다. 세션과 목표 이력을 가져오는 함수가 없어 화면은 빈 상태로 두고, Mock 기록은 실제 기록처럼 보여 주지 않는다.

## 2. Requirements

- VIEW-01: 달력 이동·오늘·선택·날짜 상태 구분은 구현했다. 실제 독서일을 표시하는 수용 기준은 데이터 연결 전 (진행 중)
- VIEW-02: 목표 기간별 주간 달성률 계산과 요일 표시는 구현했다. 실제 수치 표시는 데이터 연결 전 (진행 중)
- VIEW-03: 목표 요일 기준 연속 독서일 계산은 구현했다. 실제 수치 표시는 데이터 연결 전 (진행 중)

## 3. Implementation

- `utils/readingPeriod.ts`: 날짜에 적용할 목표는 `starts_on`이 가장 늦은 기간. 변경일은 새 목표를 쓴다
- `utils/readingCalendar.ts`, `utils/weeklyAchievement.ts`, `utils/readingStreak.ts`: 화면과 분리한 순수 계산
- `app/(tabs)/records.tsx`: 조회 결과가 없으면 빈 상태. 결과가 있으면 달력 표시, 선택 날짜, 주간 카드, 연속 독서일을 그린다
- 시간 목표는 초를 합산하고, 페이지 목표는 저장된 `pages_read`만 합산한다. 값이 없으면 달성으로 추정하지 않는다

## 4. Problems & Solutions

- `lib/api`에 세션 목록, 목표 이력, 달성률, 연속 독서일 함수가 없다. 테이블을 직접 읽거나 함수를 새로 만들지 않았다
- 결정 기록 002의 DB 함수가 생기기 전에는 이 계산과 숫자가 달라질 수 있다

## 5. Verification

- `node --experimental-strip-types --import ./utils/readingStats.loader.mjs utils/readingStats.test.ts` 통과
- `npx tsc --noEmit` 통과
- `npx expo lint` 통과
- 실기기에서 달력 조작과 실제 기록 표시는 확인하지 못했다

## 6. Next

- 한인웅의 조회 함수가 오면 `loadReadingHistory`만 교체한다
- VIEW-04~05는 같은 날짜별 달성 결과를 주·월과 홈 카드에 다시 쓴다
