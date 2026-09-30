import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import type { SessionListItem } from '@/data/selectors';
import { formatDuration, formatKoreanDateKey } from '@/utils/format';

type ReadingSessionCardProps = {
  session: SessionListItem;
  onPress?: () => void;
};

export function ReadingSessionCard({ session, onPress }: ReadingSessionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}
    >
      <View style={styles.row}>
        <Text numberOfLines={1} style={styles.title}>
          {session.bookTitle}
        </Text>
        <Text style={styles.date}>{formatKoreanDateKey(session.dateKey)}</Text>
      </View>
      <Text style={styles.meta}>
        {formatDuration(session.durationSeconds)} · {session.pagesRead}페이지
      </Text>
      {session.oneLineReview ? (
        <Text numberOfLines={2} style={styles.review}>
          {session.oneLineReview}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    padding: spacing.lg,
    gap: 6,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  review: {
    ...typography.body,
    color: colors.text,
  },
});
