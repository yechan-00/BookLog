import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';

type IndexTagChipsProps = {
  tags: readonly string[];
  /** 주면 칩마다 삭제 버튼이 되고, 없으면 보기 전용이다. */
  onRemove?: (tag: string) => void;
};

export function IndexTagChips({ tags, onRemove }: IndexTagChipsProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {tags.map((tag) =>
        onRemove ? (
          <Pressable
            key={tag}
            accessibilityRole="button"
            accessibilityLabel={`${tag} 태그 삭제`}
            onPress={() => onRemove(tag)}
            style={[styles.chip, styles.removable]}
          >
            <Text style={styles.label}>#{tag}</Text>
            <Text style={styles.remove}>×</Text>
          </Pressable>
        ) : (
          <View key={tag} style={styles.chip}>
            <Text style={styles.label}>#{tag}</Text>
          </View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  removable: {
    minHeight: 44,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  remove: {
    ...typography.bodyStrong,
    color: colors.textMuted,
  },
});
