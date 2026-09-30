import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import type { BookStatus } from '@/types/book';
import { bookStatusLabel } from '@/utils/book';

const statusColor: Record<BookStatus, string> = {
  wishlist: colors.textSecondary,
  reading: colors.accent,
  completed: colors.positive,
  paused: colors.textMuted,
};

type StatusBadgeProps = {
  status: BookStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, { borderColor: statusColor[status] }]}>
      <Text style={[styles.label, { color: statusColor[status] }]}>{bookStatusLabel[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});
