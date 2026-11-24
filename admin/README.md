# 북로그 관리자 웹

React + Vite + TypeScript. 앱과 같은 Supabase를 쓰며, DB 타입은 `../types/database.ts`를 함께 쓴다.

## 실행

```bash
cd admin
npm install
cp .env.example .env.local   # 값을 채운다 (git에 올라가지 않는다)
npm run dev                  # http://localhost:5173
```

- `.env.local`에는 Project URL과 **Publishable Key**만 넣는다. service_role·secret 키는 쓰지 않는다.
- 점검: `npm run typecheck`, `npm run build`

## 로컬 Supabase로 확인하기

```bash
npx supabase start
npx supabase db reset        # 마이그레이션 + 시드 적용 (로컬 DB만 초기화된다)
```

`.env.local`에 `VITE_SUPABASE_URL=http://127.0.0.1:54321`과 `npx supabase status`의 Publishable Key를 넣는다.
시드 계정(로컬 전용): 관리자 `admin@booklog.local` / `booklog-admin-local`.

## 원격 DB에 admin 계정 만들기

1. Supabase 대시보드 Authentication에서 이메일 계정을 만든다.
2. SQL Editor에서 역할을 지정한다. admin은 앱에서 바꿀 수 없고 SQL로만 지정한다.

```sql
update public.profiles set role = 'admin' where email = '<관리자 이메일>';
```

## 구조

- 로그인한 계정의 `profiles.role`이 admin이 아니면 바로 로그아웃시킨다. 화면 분기는 편의일 뿐이고, 실제 권한은 RLS와 admin 전용 RPC가 막는다.
- 대시보드·회원 목록·이용 정지는 RPC(`admin_dashboard_metrics`, `admin_list_members`, `admin_set_suspended`), 도서 정정은 `books` 테이블 수정으로 처리한다.
- 인덱스·한줄평·총평 같은 원문은 받지도 보여주지도 않는다.
