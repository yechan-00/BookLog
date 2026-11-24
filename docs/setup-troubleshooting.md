# 개발 환경 문제 해결

> 작성: 한인웅 · 최종 수정: 2026-11-11
> 11주에 실제로 겪은 문제와 해결 방법을 모았다. 새 기기 세팅, 사용자 테스트 준비 때 먼저 확인한다.

## 1. Windows PowerShell에서 `npx`가 실행되지 않음

증상: `npx : 이 시스템에서 스크립트를 실행할 수 없으므로 ... npx.ps1 파일을 로드할 수 없습니다` (`PSSecurityException`)

원인: PowerShell 실행 정책이 `npx.ps1` 스크립트를 막는다. 코드 문제가 아니다.

해결 (둘 중 하나):

- 설정을 바꾸지 않고 실행: `npx.cmd expo start` (또는 VS Code 터미널을 Command Prompt·Git Bash로 바꾼다)
- 현재 사용자에게만 허용 (관리자 권한 불필요): `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## 2. `.env.local`에 키가 있는데 앱이 읽지 못함

증상: 카카오 검색에서 "카카오 도서 검색 키가 비어 있습니다", `npx expo start` 첫 줄의 `env: export ...` 목록에 해당 변수가 없음

먼저 `env: export` 목록을 본다. 여기에 없는 변수는 앱에 들어가지 않는다. 원인 후보와 확인 방법:

1. **줄바꿈 문자가 섞임**: 편집기에서는 줄이 나뉘어 보이지만 `\n`이 아닌 줄바꿈(`\r`만, `U+2028` 등)으로 이어져 있으면 여러 줄이 한 줄로 읽힌다. 메신저 등에서 복사해 붙여넣을 때 생긴다.
   - 확인 (프로젝트 폴더, 값은 출력하지 않음):
     ```bash
     node -e 'const t=require("fs").readFileSync(".env.local","utf8");const c=(r)=>(t.match(r)||[]).length;console.log("LF",c(/\n/g),"CR",c(/\r/g),"U+2028",c(/ /g),"U+2029",c(/ /g),"NEL",c(/\u0085/g))'
     ```
     `LF`가 변수 수보다 적고 다른 값이 0보다 크면 이 문제다.
   - 해결: VS Code·Cursor 오른쪽 아래 `LF`/`CRLF`를 눌러 `LF`로 다시 저장하거나, 변수 이름과 줄바꿈을 직접 다시 입력한다(값만 붙여넣기).
2. **셸에 같은 이름의 변수가 이미 있음**: Expo는 이미 정의된 환경 변수를 `.env.local` 값으로 덮어쓰지 않는다(빈 값이어도). `unset <변수명>` 또는 시스템 환경 변수에서 지운 뒤 터미널·편집기를 다시 연다.
3. **다른 파일에 적음**: `.env.local.backup`, `.env.local.txt`, 다른 clone 폴더 등. `ls -la .env*`, `grep -l KAKAO .env*`로 확인한다.

어느 경우든 고친 뒤 `npx expo start -c`로 캐시를 지우고 다시 실행한다. `EXPO_PUBLIC_` 값은 빌드할 때 번들에 들어가므로 재시작이 필요하다.

참고: 키 값은 git·PR·메신저 공개 채널에 올리지 않는다. `.env.local`은 `.gitignore`에 있다.

## 3. 카카오 검색 오류 메시지

| 메시지 | 원인 |
| --- | --- |
| 키가 비어 있습니다 | 2번 문제 (앱에 키가 들어오지 않음) |
| 키가 올바르지 않습니다 (401) | 키 값이 틀림 |
| 권한이 없습니다 (403) | 카카오 개발자 콘솔에서 책 검색 API 사용 설정 확인 |

## 4. `npx tsc --noEmit`이 새 화면 주소에서 실패함

증상: 새로 만든 라우트(예: `/dev/home-preview`)를 `router.push`에 넣은 곳에서 `TS2345 ... is not assignable to parameter of type ...`

원인: Expo Router의 경로 타입 파일(`.expo/types/router.d.ts`)이 예전 상태다.

해결: `npx expo start`를 한 번 실행하면 타입 파일이 다시 만들어진다. 그 뒤 `npx tsc --noEmit`을 다시 실행한다.

## 5. 웹 정적 빌드(`npx expo export --platform web`) 실패

증상: `ReferenceError: localStorage is not defined`

원인: `lib/supabase.ts`가 `expo-sqlite/localStorage`를 세션 저장소로 쓰는데, 웹 정적 렌더링(서버)에는 `localStorage`가 없다. Android·iOS 실행에는 영향이 없다. 웹 배포가 필요해지면 따로 처리한다.

## 6. zsh·bash에서 `event not found`

원인: 명령의 큰따옴표 안에 `!`가 있으면 셸이 이전 명령 기호로 해석한다.

해결: 명령을 작은따옴표로 감싸거나 `!`를 쓰지 않는다.

## 7. 로컬 Supabase(`supabase start`)로 앱이 시작되지 않음

원인: `lib/supabase.ts`가 `https://<project-ref>.supabase.co` 형식 주소만 허용한다. 로컬 주소(`http://127.0.0.1:54321`)는 시작 시 오류가 난다.

해결: 지금은 클라우드 프로젝트 주소를 쓴다. 로컬 DB로 개발해야 하면 이 검사를 조정한다.
