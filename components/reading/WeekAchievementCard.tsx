import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ProgressBar } from '@/components/common/ProgressBar';
import { colors } from '@/constants/colors';
import { readerLayout } from '@/constants/readerTheme';
import { card, spacing, typography } from '@/constants/theme';
import { achievementLabel } from '@/utils/readingPeriod';
import type { WeeklyAchievement } from '@/utils/weeklyAchievement';

type WeekAchievementCardProps = {
  result: WeeklyAchievement;
};

export function WeekAchievementCard({ result }: WeekAchievementCardProps) {
  const { width, fontScale } = useWindowDimensions();
  const layout = readerLayout(width);
  const compact = layout.compact || width < 375;
  const weekdaySize = compact ? 11 : 12;
  const stateSize = compact ? 10 : 11;
  const markerSize = compact ? 8 : 9;
  const stackGap = compact ? 4 : 5;
  const allowScale = fontScale > 1.2;

  const summary =
    result.rate === null ? '판정할 목표 요일이 없습니다' : `${result.achievedCount}/${result.decidedCount}일`;

  return (
    <View style={styles.card}>
      <Text style={styles.rate}>{result.rate === null ? '—' : `${result.rate}%`}</Text>
      <Text style={styles.summary}>{summary}</Text>
      <ProgressBar current={result.achievedCount} total={result.decidedCount} />
      <View style={styles.days}>
        {result.days.map((day) => (
          <View key={day.dateKey} style={[styles.day, { gap: stackGap }]}>
            <Text
              style={[styles.weekday, { fontSize: weekdaySize, lineHeight: weekdaySize + 3 }]}
              numberOfLines={1}
              maxFontSizeMultiplier={allowScale ? undefined : 1.1}
            >
              {day.label}
            </Text>
            <View style={[styles.markerSlot, { height: markerSize + 2 }]}>
              <View
                style={[
                  styles.marker,
                  { width: markerSize, height: markerSize, borderRadius: markerSize },
                  markerStyle(day.achievement),
                ]}
              />
            </View>
            <Text
              style={[styles.state, { fontSize: stateSize, lineHeight: stateSize + 2 }]}
              numberOfLines={1}
              maxFontSizeMultiplier={allowScale ? undefined : 1.1}
            >
              {achievementLabel(day.achievement)}
            </Text>
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
    alignItems: 'flex-start',
    width: '100%',
  },
  day: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  weekday: {
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
  },
  state: {
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  markerSlot: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
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
