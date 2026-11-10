import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ReadingStatCard } from '@/components/reading/ReadingStatCard';
import { WeekAchievementCard } from '@/components/reading/WeekAchievementCard';
import { colors } from '@/constants/colors';
import { card, radius, spacing, typography } from '@/constants/theme';
import { startOfToday, toDateKey } from '@/utils/date';
import { formatDuration, formatKoreanDateKey } from '@/utils/format';
import { insightReadingSummary, type InsightReadingSummary } from '@/utils/readingSummary';
import { loadReadingHistory, type LoadStatus } from '@/utils/readingSource';

const ranges = [7, 30] as const;

export default function InsightsScreen() {
  const todayKey = toDateKey(startOfToday());
  const [dayCount, setDayCount] = useState<(typeof ranges)[number]>(7);
  const source = loadReadingHistory();
  const summary = source.status === 'ready' ? insightReadingSummary(todayKey, dayCount, source.value) : null;
  const hasReading = summary !== null && summary.period.readingDayCount > 0;

  return (
    <Screen topInset>
      <View style={styles.header}>
        <Text style={styles.title}>인사이트</Text>
        <Text style={styles.subtitle}>최근 독서량과 확정된 목표 달성률을 살펴봅니다.</Text>
      </View>

      <View style={styles.ranges}>
        {ranges.map((range) => {
          const selected = range === dayCount;
          return (
            <Pressable
              key={range}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setDayCount(range)}
              style={[styles.range, selected && styles.rangeSelected]}
            >
              <Text style={[styles.rangeLabel, selected && styles.rangeLabelSelected]}>최근 {range}일</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="독서 시간" />
      {summary && hasReading ? (
        <View style={styles.grid}>
          <ReadingStatCard label="총 독서 시간" value={formatDuration(summary.period.totalDurationSeconds)} style={styles.card} />
          <ReadingStatCard
            label="일평균"
            value={formatDuration(summary.period.averageDurationSeconds)}
            style={styles.card}
          />
        </View>
      ) : (
        <EmptyState title={sectionTitle(source, hasReading, '독서 시간을 불러올 수 없습니다', '독서 시간을 확인하지 못했습니다')} description={sectionDescription(source, hasReading)} />
      )}

      <SectionHeader title="읽은 페이지" />
      {summary && hasReading ? (
        <View style={styles.grid}>
          <ReadingStatCard
            label="총 읽은 페이지"
            value={summary.period.totalPages === null ? '집계 불가' : `${summary.period.totalPages}p`}
            style={styles.card}
          />
          <ReadingStatCard
            label="일평균"
            value={summary.period.averagePages === null ? '집계 불가' : `${Math.round(summary.period.averagePages)}p`}
            style={styles.card}
          />
        </View>
      ) : (
        <EmptyState title={sectionTitle(source, hasReading, '페이지를 불러올 수 없습니다', '페이지를 확인하지 못했습니다')} description={sectionDescription(source, hasReading)} />
      )}

      <SectionHeader title="목표 달성률" />
      {summary ? <Achievement summary={summary} /> : (
        <EmptyState title={sectionTitle(source, false, '달성률을 불러올 수 없습니다', '달성률을 확인하지 못했습니다')} description={sectionDescription(source, false)} />
      )}

      <SectionHeader title="연속 독서일" />
      {summary ? (
        <ReadingStatCard label="목표 요일 기준" value={`${summary.streak.days}일`} />
      ) : (
        <EmptyState title={sectionTitle(source, false, '연속 독서일을 불러올 수 없습니다', '연속 독서일을 확인하지 못했습니다')} description={sectionDescription(source, false)} />
      )}

      <SectionHeader title="날짜별 추이" />
      {summary && hasReading ? (
        <View style={styles.trend}>
          {summary.period.days.map((day) => (
            <View key={day.dateKey} style={styles.trendRow}>
              <Text style={styles.trendDate}>{formatKoreanDateKey(day.dateKey)}</Text>
              <Text style={styles.trendValue}>
                {day.hasReading ? formatDuration(day.durationSeconds) : '기록 없음'}
                {' · '}
                {day.pagesRead === null ? '페이지 집계 불가' : `${day.pagesRead}페이지`}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState title={sectionTitle(source, hasReading, '추이를 불러올 수 없습니다', '추이를 확인하지 못했습니다')} description={sectionDescription(source, hasReading)} />
      )}
    </Screen>
  );
}

function Achievement({ summary }: { summary: InsightReadingSummary }) {
  const monthRate = summary.month.rate === null ? '—' : `${summary.month.rate}%`;
  return (
    <View style={styles.achievement}>
      <WeekAchievementCard result={summary.week} />
      <View style={styles.monthCard}>
        <Text style={styles.monthTitle}>이번 달 확정 달성률 {monthRate}</Text>
        <Text style={styles.monthNote}>
          확정 {summary.month.achievedCount}/{summary.month.decidedCount}일 · 이번 달 목표 요일 {summary.month.scheduledCount}일
        </Text>
      </View>
    </View>
  );
}

function sectionTitle(source: LoadStatus<unknown>, hasReading: boolean, unavailable: string, failed: string): string {
  if (source.status === 'error') {
    return failed;
  }
  if (source.status === 'unavailable') {
    return unavailable;
  }
  if (!hasReading) {
    return '이 기간의 독서 기록이 없습니다';
  }
  return unavailable;
}

function sectionDescription(source: LoadStatus<unknown>, hasReading: boolean): string {
  if (source.status === 'error') {
    return source.message;
  }
  if (source.status === 'unavailable') {
    return '세션·목표 이력 조회 API가 없습니다. 예시 수치는 표시하지 않습니다.';
  }
  if (!hasReading) {
    return '저장된 세션이 없습니다.';
  }
  return '';
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    ...typography.greeting,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  ranges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  range: {
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  rangeLabel: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  rangeLabelSelected: {
    color: colors.onAccent,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    flexGrow: 1,
  },
  achievement: {
    gap: spacing.sm,
  },
  monthCard: {
    ...card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  monthTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  monthNote: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  trend: {
    ...card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  trendRow: {
    gap: 2,
  },
  trendDate: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  trendValue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
