---
date: 2026-11-14
requirement: INDEX-01
author: 한인웅
reviewer:
---

## 1. Summary

인덱스 추가 폼에 색상(선택)과 태그(선택) 입력을 넣고, 책 상세의 인덱스 목록에 색상 점과 태그 칩을 표시한다. DB 컬럼(`book_indexes.color`, `tags`)은 초기 스키마에 이미 있어서 마이그레이션은 없다. 같은 폼을 책 상세와 집중 독서 화면이 함께 쓰므로 양쪽에 적용된다.

## 2. Requirements

- INDEX-01: "페이지와 짧은 제목은 필수, 문장·색상·태그는 선택. 독서 중과 책 상세 양쪽에서 추가" 충족 (완료로 바꿨다). 앱 화면은 Android 에뮬레이터에서만 확인했고 실기기 확인 전이다.
- INDEX-02: 목록에 색상 점과 태그를 함께 보여 주도록 확장했다 (이미 완료 상태).

## 3. Implementation

- `constants/bookIndex.ts`(새 파일): 색상 후보(`spinePalette` 재사용), 태그 최대 5개·12자, 폼 최대 높이 비율 등 상수.
- `utils/bookIndex.ts`(새 파일): 태그 정리(`normalizeTag`: 앞의 `#`·여분의 공백 제거), 추가(`addTag`: 빈 값·대소문자 무시 중복은 조용히 무시, 길이·개수 초과만 오류), 저장 전 검증(`validateTags`), 저장값 좁히기(`parseIndexColor`, `parseStoredTags`).
- `components/reading/IndexColorPicker.tsx`, `IndexTagInput.tsx`, `IndexTagChips.tsx`(새 파일): 색상 칩(고른 색을 다시 누르면 해제, 터치 영역 44pt), 태그 입력(쉼표·완료 키·추가 버튼), 태그 칩(삭제 가능/보기 전용).
- `components/reading/IndexFormModal.tsx`: 폼 확장. 입력 영역은 스크롤로 두고 오류 문구와 저장 버튼은 스크롤 밖에 둬서 키보드가 올라와도 항상 보인다. 태그가 추가되면 끝까지 스크롤한다.
- `lib/api/indexes.ts`: `addIndex`가 `color`·`tags`를 받아 검증(팔레트에 없는 색상 거부, 태그 길이·개수)하고 저장한다. `lib/api/mappers.ts`는 읽을 때 같은 규칙으로 좁힌다.
- `types/reading.ts`: `BookIndex`에 `color: string | null`, `tags: string[]`를 필수로 추가했다. 사용처는 mapper·mock뿐이어서 `data/mockReadingData.ts`의 인덱스 3개에 `color: null, tags: []`를 넣었다.
- `app/book/[id].tsx`: 목록에 색상 점과 태그 칩 표시.

## 4. Problems & Solutions

- 결정: 색상은 팔레트 값(hex)을 그대로 `color` 컬럼에 저장한다. 팔레트 이름이나 순서를 저장하면 팔레트가 바뀔 때 의미가 틀어지고, hex는 그 자체로 읽히기 때문이다. 읽을 때는 현재 팔레트에 없는 값이면 `null`로 취급한다(외부 데이터를 믿지 않는 규칙).
- 결정: 태그는 최대 5개, 12자 이하로 제한하고, 대소문자 구분 없이 중복을 막고, 앞의 `#`은 제거한다. PRD에 상한이 없어서 폼이 길어지지 않고 칩이 한 줄 안팎에 들어가는 수준으로 정했다. 상수 한 곳(`constants/bookIndex.ts`)만 고치면 바뀐다.
- 결정: 저장을 누를 때 태그 입력창에 남은 글자도 태그로 함께 저장한다. 추가 버튼을 안 누르고 저장해도 입력이 사라지지 않게 하려는 것이다.
- 결정: 태그가 길이 제한에 걸리면 입력한 글자를 지우지 않고 입력창에 남겨 고쳐 쓰게 한다.
- 결정: `BookIndex`의 새 필드를 선택(`?`)이 아니라 필수로 두었다. 한 가지 모양만 쓰게 하고, 영향이 mock 3줄뿐이라서다.
- 결정: 새 상수 파일을 `constants/`(공용 폴더)에 만들었다. 기존 파일은 건드리지 않아 한예찬의 변경과 충돌할 일은 없다. 공용 폴더라 PR에서 알려야 한다.
- 첫 구현에서 오류 문구가 스크롤 영역 맨 아래에 있어 입력 중에는 보이지 않았다(에뮬레이터에서 발견). 오류 문구를 스크롤 밖(저장 버튼 위)으로 옮겨 해결했다.
- RN 0.88의 `ScrollView` ref 타입이 바뀌어 `useRef<ScrollView>`가 타입 오류를 냈다. `react-native`가 내보내는 `ScrollViewInstance`를 쓰도록 고쳤다.

## 5. Verification

- `npx tsc --noEmit`, `npx expo lint` 통과.
- 로컬 Supabase + Android 에뮬레이터(API 35, Expo Go):
  - 책 상세에서 색상 3번과 태그 `alpha,beta`(쉼표·추가 버튼)와 입력창에 남긴 `pending`을 넣고 저장하면 DB가 `color=#C4785A`, `tags={alpha,beta,pending}`이고, 목록에 색상 점과 `#alpha #beta #pending`이 표시된다.
  - 태그 6번째 시도는 "태그는 최대 5개까지 넣을 수 있어요.", 13자 태그는 "태그는 12자 이하로 입력해 주세요."가 저장 버튼 위에 표시된다. 칩을 눌러 삭제할 수 있다.
  - 색상·태그 없이 저장하면 `color` null, `tags` `{}`로 저장된다. 기존 인덱스는 표시가 이전과 같다.
  - 집중 독서 화면에서 추가하면 `color=#7A5C6B`, `tags={fx}`로 저장된다.
- 확인하지 못함: 실기기, iOS, 접근성 도구(스크린 리더) 확인, 매우 작은 화면에서의 폼 높이. 집중 독서 화면의 목록 표시(그 화면은 방금 저장한 인덱스를 제목 위주로만 보여 준다).

## 6. Next

- 색상 칩의 접근성 라벨이 "색상 1~6"이다. 색상 이름을 정하면 더 알아보기 쉽다.
- 집중 독서 화면이 방금 저장한 인덱스에 색상·태그도 보여 줄지 정한다.
- 인덱스 모아보기·검색은 P1이다. 지금 만들지 않았다.
