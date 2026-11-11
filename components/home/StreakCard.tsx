import { StyleSheet, Text, View } from 'react-native';

import { libraryTheme } from '@/constants/libraryTheme';
import { radius, spacing, typography } from '@/constants/theme';
import type { ReadingStreak } from '@/utils/readingStreak';

type StreakCardProps = {
  streak: ReadingStreak;
};

export function StreakCard({ streak }: StreakCardProps) {
  const hasStreak = streak.days > 0;

  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>연속 독서</Text>
      </View>
      {hasStreak ? <Text style={styles.daysAccent}>{streak.days}일</Text> : null}
      <Text style={styles.title}>{hasStreak ? '연속 독서 중' : '연속 독서를 시작해 보세요'}</Text>
      <Text style={styles.note}>목표 요일만 세며, 오늘 진행 중은 바로 끊지 않습니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: libraryTheme.surface,
    borderColor: libraryTheme.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: libraryTheme.softBrown,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  badgeLabel: {
    ...typography.caption,
    color: libraryTheme.primaryBrown,
    fontWeight: '700',
  },
  title: {
    ...typography.title,
    color: libraryTheme.darkBrown,
  },
  daysAccent: {
    ...typography.bodyStrong,
    color: libraryTheme.primaryBrown,
  },
  note: {
    ...typography.caption,
    color: libraryTheme.textSecondary,
  },
});
