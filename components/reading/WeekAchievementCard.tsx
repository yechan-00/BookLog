import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/common/ProgressBar';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { achievementLabel } from '@/utils/readingPeriod';
import type { WeeklyAchievement } from '@/utils/weeklyAchievement';

type WeekAchievementCardProps = {
  result: WeeklyAchievement;
};

export function WeekAchievementCard({ result }: WeekAchievementCardProps) {
  const summary =
    result.rate === null ? '판정할 목표 요일이 없습니다' : `${result.achievedCount}/${result.decidedCount}일`;

  return (
    <View style={styles.card}>
      <Text style={styles.rate}>{result.rate === null ? '—' : `${result.rate}%`}</Text>
      <Text style={styles.summary}>{summary}</Text>
      <ProgressBar current={result.achievedCount} total={result.decidedCount} />
      <View style={styles.days}>
        {result.days.map((day) => (
          <View key={day.dateKey} style={styles.day}>
            <Text style={styles.weekday}>{day.label}</Text>
            <View style={[styles.marker, markerStyle(day.achievement)]} />
            <Text style={styles.state}>{achievementLabel(day.achievement)}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>아직 오지 않은 목표 요일과 오늘 진행 중은 분모에서 뺍니다.</Text>
    </View>
  );
}

function markerStyle(achievement: WeeklyAchievement['days'][number]['achievement']) {
  if (achievement === 'achieved') {
    return styles.markerAchieved;
  }

  if (achievement === 'missed') {
    return styles.markerMissed;
  }

  if (achievement === 'pending') {
    return styles.markerPending;
  }

  return styles.markerQuiet;
}

const styles = StyleSheet.create({
  card: {
    ...card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  rate: {
    ...typography.title,
    color: colors.text,
  },
  summary: {
    ...typography.body,
    color: colors.textSecondary,
  },
  days: {
    flexDirection: 'row',
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekday: {
    ...typography.caption,
    color: colors.textMuted,
  },
  state: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  markerAchieved: {
    backgroundColor: colors.positive,
    borderColor: colors.positive,
  },
  markerMissed: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  markerPending: {
    backgroundColor: 'transparent',
    borderColor: colors.accent,
  },
  markerQuiet: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
