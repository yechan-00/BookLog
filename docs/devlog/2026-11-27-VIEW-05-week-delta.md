---
date: 2026-11-27
requirement: VIEW-05
author: 한인웅
reviewer:
---

## 1. Summary

홈 "이번 주 독서" 카드의 지난주 비교를 같은 기간 기준으로 바꾸고, 좁은 칸에 맞게 `지난주보다 ▼25분`처럼 화살표로 줄였다.

## 2. Requirements

- VIEW-05: 홈 주간 독서 요약이 주 중반에도 공정하게 비교된다

## 3. Implementation

- `utils/homeWeekStats.ts`(한예찬 소유): `previousWeekSeconds`를 지난주 7일 합계에서 "지난주 월요일부터 오늘과 같은 요일까지" 합계로 바꿨다
- `components/home/WeekStatusCard.tsx`(한예찬 소유): 문구를 `지난주보다 ▲12분`/`▼25분`/`지난주와 같아요`로 바꾸고, 스크린리더에는 "지난주 이맘때보다 25분 적게 읽었어요" 같은 문장을 읽힌다
- `utils/homeWeekStats.test.ts`: 지난주 토요일 기록이 수요일 비교에서 빠지는지 확인을 추가했다

## 4. Problems & Solutions

- 이번 주(오늘까지)와 지난주(7일 전체)를 비교해 주 중반에는 꾸준히 읽어도 거의 항상 "덜"로 나왔다 → 같은 요일까지만 더한다
- 문구 칸이 약 123dp라 "지난주보다 1시간 55분 더"처럼 길어지면 잘렸다 → 방향 단어 대신 ▲/▼를 쓴다

## 5. Verification

- `homeWeekStats.test.ts` 통과. `npx expo lint` 통과, `npx tsc --noEmit`은 기존 오류 1건(`/dev/library-preview` 경로 타입)만 남음
- Android 에뮬레이터(Release): 11/27(금) 홈에 "지난주보다 ▼25분" 표시 (변경 전 "지난주보다 55분 덜")

## 6. Next

- 없음
