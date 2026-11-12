---
date: 2026-11-12
requirement: INDEX-01
author: 한인웅
reviewer:
---

## 1. Summary

책 상세에서도 인덱스를 추가할 수 있게 했다. 독서 중 추가와 같은 입력 폼(페이지·짧은 제목 필수, 문장 선택)을 쓰고, 저장하면 목록을 바로 다시 불러온다.

## 2. Requirements

- INDEX-01: 독서 중과 책 상세 양쪽에서 추가 가능해졌다. 색상·태그(선택 항목)는 아직 입력 UI가 없다. 실기기 확인 전 (진행 중)
- INDEX-02: 책 상세 목록은 저장 직후 갱신된다. 페이지 오름차순은 서버 정렬이다 (진행 중)

## 3. Implementation

- `app/book/[id].tsx`: 인덱스 섹션에 추가 버튼과 `IndexFormModal`. 책 상세에서 추가한 인덱스는 `session_id`가 비어 있다(PRD 6장: 선택).
- `hooks/useFocusData.ts`: 현재 화면을 그대로 두고 다시 불러오는 `refresh`를 추가했다. 기존 `reload`는 로딩 화면으로 돌아가므로 오류 뒤 재시도에만 쓴다.

## 4. Problems & Solutions

- 저장 직후 `reload`를 쓰면 상세 화면 전체가 로딩 화면으로 바뀌어 깜빡였다. 데이터를 유지한 채 갱신하는 `refresh`를 따로 두었다.
- 저장에 실패하면 섹션 위에 오류 문구를 보여 주고 목록은 바꾸지 않는다.

## 5. Verification

- `npx tsc --noEmit`, `npx expo lint` 통과
- 인덱스 저장·페이지 오름차순 조회는 READ-01 DevLog에서 원격 DB로 확인했다. 앱 화면은 실기기에서 확인하지 못했다.

## 6. Next

- 색상·태그 입력은 필요하면 P0 범위 안에서 팀과 정한다 (지금은 만들지 않음)
