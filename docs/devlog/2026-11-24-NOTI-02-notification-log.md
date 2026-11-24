---
date: 2026-11-24
requirement: NOTI-02
author: 한인웅
reviewer:
---

## 1. Summary

NOTI-02의 남은 수용 기준인 "앱을 열 때 예약 시각이 지난 알림을 NotificationLog에 기록한다"를 연결했다. OS는 발송된 알림을 예약 큐에서 지워서 "발송됨"을 직접 읽을 수 없으므로, 예약할 때 기기에 장부를 남기고 앱을 열 때 큐와 비교해 발송된 알림을 추정해 `notification_logs`에 저장한다.

## 2. Requirements

- NOTI-02: 기록 수용 기준 구현. 알림 예약·취소는 기존 구현 그대로
- 관리자 대시보드 재개율(ADMIN-02)이 `notification_logs`(kind=engagement)의 `sent_at`을 읽으므로, 이제 알림 쪽 집계에 값이 쌓인다
- 상태는 `진행 중`으로 둔다. 권한 팝업, 예약 발송, 앱 종료 후 발송을 실기기에서 확인하기 전에는 완료가 아니다 (PRD 4.7 메모)

## 3. Implementation

- `lib/notifications/engagementLedger.ts`: 예약 장부(식별자, 목표 id, 예약 시각)와 전송 대기함의 순수 로직. 저장소를 주입받아 Node에서 테스트한다
- `lib/notifications/engagementLog.ts`: 대기함을 서버에 전송한다. 성공한 항목만 지우고, 영구 실패(목표 외래키 불일치 등)는 버리고, 일시 실패(오프라인)는 나머지를 시도하지 않고 다음 실행으로 넘긴다. 동시에 호출돼도 한 번만 전송한다
- `lib/api/notificationLogs.ts`: `notification_logs` 삽입. `user_id`는 DB 기본값(`auth.uid()`)을 쓴다
- `lib/notifications/engagement.ts`: 재예약·취소 직전에 발송된 알림을 대기함으로 옮기고(`collectFiredEngagement`), 예약한 계획을 장부에 기록한다
- `lib/notifications/recordDueEngagement.ts`, `components/notifications/EngagementLogSync.tsx`: 앱을 열 때와 포그라운드로 돌아올 때 실행한다. `app/_layout.tsx`의 목표 게이트를 통과한 뒤에만 마운트한다
- `lib/notifications/clearBooklog.ts`: 계정이 바뀔 때 장부와 대기함도 지운다

판정 규칙: 예약 시각이 지났고 큐에 없으면 발송됨, 지났는데 큐에 남아 있으면 미발송(기록 안 함), 미래이고 큐에 있으면 대기, 미래인데 큐에 없으면 취소됨.

## 4. Problems & Solutions

- 기존 `listUnconfirmedDueEngagementReminders`는 "시각이 지났는데 아직 큐에 있는" 알림만 찾아, 실제로 발송된 알림은 잡지 못한다. 기존 `engagementLogCandidates`도 계획(미래) 목록을 거르므로 항상 빈 결과였다 → 예약 장부를 새로 두고 큐와 비교
- 재예약은 기존 알림을 모두 취소한 뒤 다시 만들기 때문에, 그 전에 장부를 정리하지 않으면 이미 발송된 알림이 사라진다 → 재예약 직전에 먼저 수집
- 계정이 바뀌면 이전 계정의 목표 id로 삽입이 외래키 오류가 나 영원히 재시도될 수 있다 → 외래키·입력 형식 오류는 영구 실패로 버리고, 계정 전환 시 장부를 비운다
- 전송 중에 새로 수집된 항목이 전송 완료 후 덮어써질 수 있다 → 처음 읽은 목록이 아니라 처리한 항목만 현재 대기함에서 제거

## 5. Verification

- 신규 테스트 2개 파일(장부, 전송)과 기존을 합쳐 18개 파일 통과, `npx tsc --noEmit` 오류 0, 수정 파일 ESLint 문제 없음
- 판정 규칙, 중복 방지, 오프라인 재시도, 영구 실패 폐기, 동시 호출, 전송 중 추가분 보존을 테스트하고 코드를 일부러 망가뜨려 실패하는지 확인했다
- `npx expo export --platform android` 번들 성공
- **실기기 확인은 하지 않았다.** 아래 6번 시나리오가 필요하다

## 6. Next

- 실기기 확인: 목표 알림 시각을 1~2분 뒤로 잡고 앱을 닫아 둔 뒤 알림 수신 → 앱 실행 → `notification_logs`에 `kind=engagement`, `sent_at`=예약 시각 행이 1건 생기는지. 다시 열어도 늘지 않는지. 비행기 모드에서 열고 나중에 복구했을 때 저장되는지
- 알려진 한계: 기록은 "예약 시각이 지났고 큐에서 사라짐"으로 추정한 값이다. 알림 권한을 껐거나 방해 금지 모드여서 사용자에게 보이지 않은 경우도 기록될 수 있다. 이 기능 배포 전에 예약된 알림은 장부가 없어 기록되지 않는다
- 앱을 완전히 종료한 채 여러 날이 지나면 지난 알림이 한 번에 기록된다. `sent_at`은 각 예약 시각이라 재개율 계산에는 영향이 없다
- 한예찬 확인 후 `reviewer` 기입
