import { useEffect, useState } from 'react';

import { MetricCard } from '../components/MetricCard';
import { StatusMessage } from '../components/StatusMessage';
import { fetchMetrics, type DashboardMetrics } from '../lib/api';
import { toDateKey } from '../lib/date';

const PERIOD_OPTIONS = [7, 14, 30] as const;

function formatRate(rate: number | null): string {
  return rate === null ? '-' : `${Math.round(rate * 100)}%`;
}

export function DashboardPage() {
  const [days, setDays] = useState<number>(PERIOD_OPTIONS[0]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setMetrics(null);
    setErrorMessage(null);

    fetchMetrics(toDateKey(new Date()), days)
      .then((result) => {
        if (!isCancelled) {
          setMetrics(result);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : '지표를 불러오지 못했습니다.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [days]);

  return (
    <>
      <header className="page-head">
        <h2>대시보드</h2>
        <label className="inline">
          기간
          <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
            {PERIOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                최근 {option}일
              </option>
            ))}
          </select>
        </label>
      </header>

      {errorMessage ? <StatusMessage kind="error">{errorMessage}</StatusMessage> : null}
      {!metrics && !errorMessage ? <StatusMessage kind="loading">지표를 불러오는 중...</StatusMessage> : null}

      {metrics ? (
        <div className="grid">
          <MetricCard label="가입자" value={`${metrics.memberCount}명`} detail="이용 정지 포함 누적" />
          <MetricCard
            label="활성 사용자"
            value={`${metrics.activeUserCount}명`}
            detail={`최근 ${days}일 안에 세션을 저장한 사용자`}
          />
          <MetricCard label="세션 수" value={`${metrics.sessionCount}건`} detail={`최근 ${days}일 저장된 독서 세션`} />
          <MetricCard
            label="달성률"
            value={formatRate(metrics.achievementRate)}
            detail={`목표 요일 ${metrics.scheduledDayCount}일 중 ${metrics.achievedDayCount}일 달성 (오늘 제외)`}
          />
          <MetricCard
            label="재개율"
            value={formatRate(metrics.resumeRate)}
            detail={`먼지털이·참여 유도 알림 ${metrics.engagementEventCount}건 중 ${metrics.resumedEventCount}건이 24시간 안에 독서 재개`}
          />
          <MetricCard
            label="전환율"
            value={formatRate(metrics.conversionRate)}
            detail={`가입자 ${metrics.memberCount}명 중 ${metrics.convertedUserCount}명이 첫 세션 저장`}
          />
        </div>
      ) : null}

      <p className="muted note">집계값만 표시합니다. 인덱스·한줄평·총평 같은 원문은 이 화면에서 볼 수 없습니다.</p>
    </>
  );
}
