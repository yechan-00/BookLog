# 2026-11-25 기록 달력·공통 시트·Wheel Picker 최종 반영

## 요약

P0 UI/UX 최종 개선을 `feature/reading-calendar-polish`에서 마무리하고 `main`에 병합·Push했다.

## 반영 내용 (코드)

- 기록 탭: 확대 달력, 미달/달성/과달 아이콘, 완독 표지, 월간·주간 통계 카드 제거
- 공통 Bottom Sheet / Confirm / Action / Message / Toast
- 목표·온보딩·알림 시간 Wheel Picker (저장 단위·API 계약 유지)
- 서재 상태·정렬 Action Sheet, 확인 시트, 성공 Toast

## 검증

- `npx tsc --noEmit` PASS
- 변경 파일 ESLint PASS
- wheelTime / wheelDuration / goalForm / calendarCompletions / recordsMonth / readingStats / notificationGoals / bookStatus 등 단위 테스트 PASS
- permissions / schedulePlan / 일부 RN API 테스트: 기존 로더 한계로 미실행
- 실기기: 미검증

## Git

- Feature commit: `f95aaa7`
- Merge commit: `780246d` (문서 정리 전 시점). 이후 PRD·DevLog 정리 Commit이 이어질 수 있다.
