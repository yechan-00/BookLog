import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ReadingStatCard } from '@/components/reading/ReadingStatCard';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { getInsightSnapshot } from '@/data/selectors';
import { formatDuration } from '@/utils/format';

const upcomingReports = ['요일별 독서량', '시간대별 독서량', '월간 독서시간', '장르별 독서량'];

export default function InsightsScreen() {
  const insight = getInsightSnapshot();
  const goalPercent = Math.round(insight.goalRate * 100);

  return (
    <Screen topInset>
      <View style={styles.header}>
        <Text style={styles.title}>인사이트</Text>
        <Text style={styles.subtitle}>이번 주의 독서 흐름을 카드로 살펴봅니다.</Text>
      </View>

      <View style={styles.grid}>
        <ReadingStatCard
          label="이번 주 독서"
          value={formatDuration(insight.weekDurationSeconds)}
          style={styles.card}
        />
        <ReadingStatCard label="읽은 페이지" value={`${insight.weekPages}p`} style={styles.card} />
        <ReadingStatCard label="목표 달성률" value={`${goalPercent}%`} style={styles.card} />
        <ReadingStatCard label="연속 독서" value={`${insight.streakDays}일`} style={styles.card} />
        <ReadingStatCard label="이번 달 완독" value={`${insight.monthlyCompletedCount}권`} style={styles.card} />
      </View>

      <SectionHeader title="독서 리포트" />
      <View style={styles.report}>
        <Text style={styles.reportCaption}>이후 단계에서 차트로 채워질 항목입니다.</Text>
        {upcomingReports.map((item) => (
          <Text key={item} style={styles.reportItem}>
            {item}
          </Text>
        ))}
      </View>
    </Screen>
  );
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    flexGrow: 1,
  },
  report: {
    ...card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  reportCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  reportItem: {
    ...typography.body,
    color: colors.text,
  },
});
