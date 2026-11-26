---
date: 2026-11-26
requirement: VIEW-01
author: 한인웅
reviewer:
---

## 1. Summary

기록 탭 달력에서 목표 요일이 아닌 날에 읽은 기록이 아무 표시 없이 비어 보이던 문제를 고쳤다. 그런 날에는 회갈색 펼친 책 아이콘을 그리고, 범례에 "목표 외 독서"를 추가했다.

## 2. Requirements

- VIEW-01: "목표 요일이 아닌 날 읽은 날도 표시한다" 수용 기준을 다시 충족한다. 11/25 달력 개편(f95aaa7)에서 이 날들이 빈칸으로 그려지며 빠졌다

## 3. Implementation

- `components/reading/CalendarGoalStatusIcon.tsx`(한예찬 소유): `hasReading` prop을 추가했다. 달성 상태가 `off`(목표 요일 아님)·`none`(목표 없음)이고 기록이 있으면 `bookOpen`을 `offDayReading` 색으로 그린다
- `components/reading/MonthCalendar.tsx`(한예찬 소유): 칸의 `mark.hasReading`을 아이콘과 접근성 문구("목표 요일이 아닌 날 독서")에 넘긴다. 범례에 "목표 외 독서"를 추가하고 줄바꿈을 허용했다
- 달성률·연속 독서일 계산(`utils/readingPeriod.ts`)은 바꾸지 않았다. 목표 요일이 아닌 날은 여전히 계산에서 빠진다

## 4. Problems & Solutions

- 날짜 상태 계산은 이미 `hasReading`을 만들고 있었지만 달력 아이콘이 `achievement`만 받아 버려지고 있었다 → 계산은 그대로 두고 표시 쪽에서만 쓴다

## 5. Verification

- `npx expo lint` 통과. `npx tsc --noEmit`은 기존 오류 1건(`/dev/library-preview` 경로 타입)만 남음
- Android 에뮬레이터 확인 결과는 PR에 적는다

## 6. Next

- 없음
