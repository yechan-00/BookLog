---
date: 2026-11-10
requirement: VIEW-06
author: 한예찬
reviewer:
---

## 1. Summary

서재에 완독 책꽂이 계산과 읽는 중인 책의 먼지 기준일 계산을 연결했다. 서재 조회와 먼지털이 저장 함수가 없어 예시 책은 치웠고, 저장 성공으로 표시하지 않는다.

## 2. Requirements

- VIEW-06: 완독 권수, 확인된 페이지 합계, 책등 데이터, 서재·홈 책꽂이 자리를 구성했다. 두께 구간은 임시 표시값이라 수용 기준의 두께 규칙은 미확정 (진행 중)
- VIEW-07: 마지막 독서일·추가일·먼지털이 시각으로 경과일을 계산한다. 단계 기준일과 저장 API, 먼지 이미지가 없어 완료가 아니다 (진행 중)

## 3. Implementation

- `utils/shelfGrowth.ts`: 완독만 포함하고 같은 사용자 도서는 한 번만 센다. 페이지가 없으면 두께를 만들지 않는다
- `TEMP_SPINE_WIDTH_BANDS`는 화면용 임시 상수다. 제품 규칙으로 PRD에 확정하지 않았다
- `utils/shelfDust.ts`: 기준일은 마지막 독서일, 기록이 없으면 추가일, 그리고 그보다 늦은 먼지털이 날짜다. 독서 시간·페이지·달성률·스트릭은 바꾸지 않는다
- 먼지 단계 함수는 호출자가 기준일을 넘길 때만 0~3을 반환한다. 화면은 기준일이 없어 단계를 표시하지 않는다
- 먼지 털기는 저장 API가 없으면 실패로 남긴다

## 4. Problems & Solutions

- `lib/api`에 서재 목록, 완독 목록, 먼지 기록 조회·저장이 없다. 테이블 조회를 추가하지 않았다
- 필요한 `fetchLibrary(): Promise<LibraryBook & { addedOn: string | null }[]>`
  - 인자 없음. 사용자 ID는 세션에서 정한다
  - `addedOn`은 `user_books.created_at`의 기기 로컬 날짜
  - 실패하면 `Error`
  - 호출은 서재·홈에 들어올 때
- 필요한 `fetchDustWipes(): Promise<{ userBookId: string; wipedOn: string; dustLevel: number }[]>`
  - 책마다 가장 최근 기록
  - 실패하면 `Error`
- 필요한 `saveDustWipe(input: { userBookId: string; dustLevel: number; wipedAt: string }): Promise<void>`
  - 실패하면 `Error`. 화면은 그때 저장 성공을 표시하지 않는다
  - 독서 세션은 만들지 않는다

## 5. Verification

- 단위 테스트 통과
- `npx tsc --noEmit` 통과
- `npx expo lint` 통과
- 실기기에서 책등 터치와 먼지 털기 표시는 확인하지 못했다

## 6. Next

- 두께 구간과 먼지 기준일(예: 3·7·14일)이 정해지면 상수만 교체한다
- 저장 API가 오면 먼지 털기 성공 뒤에만 집중 독서 화면으로 이동한다. 현재 집중 독서 화면은 `bookId`를 읽는다
