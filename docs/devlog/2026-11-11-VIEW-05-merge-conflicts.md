---
date: 2026-11-11
requirement: VIEW-05
author: 한인웅
reviewer:
---

## 1. Summary

11주에 화면 작업(한예찬)과 데이터 연결 작업(한인웅)을 main에 합치면서 두 번 충돌이 났다. PR #8은 main을 병합한 통합 브랜치로, PR #12는 새 커밋만 최신 main 위로 옮겨 해결했다. 머지 방식이 팀 규칙과 다르게 진행된 점도 함께 기록한다.

## 2. Requirements

- VIEW-05 외 화면 작업 전반(BOOK-01·02, VIEW-01~07, GOAL-03, NOTI-01·02)의 통합 과정 기록. 기능 상태 변경 없음

## 3. Implementation

- **PR #8 (통합)**: `feat/BOOK-01-02-search-register-ui`가 PR #7 머지 전 main에서 갈라져 `constants/colors.ts`, `docs/PRD.md`가 충돌했다. 한예찬이 `integration/booklog-team-sync`에 main을 병합(`2799747`)해 풀었다. 색상은 main의 표지 팔레트와 책꽂이 색을 모두 남기고, PRD는 양쪽 상태를 반영했다. tsc·lint·단위 테스트 통과 후 Squash 머지(`71686eb`).
- **PR #12 (홈 대시보드)**: 한예찬이 이미 머지된 `integration/booklog-team-sync`에 새 커밋(`1d46147`)을 올렸다. 이 브랜치는 #8 이전 시점이라 main과 비교하면 #8 내용이 다시 섞여 11개 파일이 충돌하는 것처럼 보였다. 최신 main에서 `style/VIEW-05-home-dashboard`를 만들고 그 커밋만 cherry-pick했다(작성자 유지).
- 실제 충돌은 `components/home/CurrentReadingCard.tsx` 하나였다(PR #10과 겹침). 새 디자인을 유지하고 "독서 기록하기" 버튼만 `startReading()`을 거치게 했다. 새 디자인 쪽을 그대로 고르면 PR #10에서 고친 "진행 중인 독서가 없어요"가 다시 생긴다. tsc·lint·단위 테스트 4개 통과 후 머지(`ed0bacf`).

## 4. Problems & Solutions

- 이미 머지된 브랜치를 다시 쓰면 Squash 머지로 커밋 해시가 달라 이전 내용이 다시 diff에 섞인다 → 머지된 브랜치는 삭제하고, 새 작업은 최신 main에서 새 브랜치로 시작한다.
- rebase는 원격 브랜치를 덮어써야(`--force-with-lease`) 해서 브랜치 주인이 직접 하기로 했다. 한예찬은 rebase 대신 main을 병합한 새 브랜치를 올렸고, Squash 머지라 main 이력에는 영향이 없었다.
- 머지 방식이 규칙과 달랐다: #4~#7은 GitHub 승인 기록 없이 머지, #7은 일반 Merge commit, #12는 Squash 메시지가 PR 제목이 아닌 영어 커밋 메시지로 남음, 머지된 원격 브랜치 미삭제 → 승인 후 Squash and merge, 메시지는 PR 제목, 머지 후 브랜치 삭제(저장소 설정의 자동 삭제 권장).
- 충돌을 풀 때 한쪽을 통째로 고르면 다른 PR의 수정이 사라질 수 있다 → 충돌 파일을 고친 PR(#10 등)을 확인하고 그 의도를 남긴다.

## 5. Verification

- PR #8: 통합 브랜치에서 `npx tsc --noEmit`, `npx expo lint`, 단위 테스트 3개 통과, main과 충돌 없음 확인
- PR #12: `npx tsc --noEmit`, `npx expo lint`, 단위 테스트 4개 통과, 다른 홈 카드에 독서 화면 직접 이동이 없는지 확인

## 6. Next

- 머지 전 리뷰 승인과 DevLog `reviewer` 기입을 지킨다
- GitHub 저장소 설정에서 "Automatically delete head branches" 켜기
- 머지된 원격 브랜치 정리 (`integration/booklog-team-sync` 포함)
