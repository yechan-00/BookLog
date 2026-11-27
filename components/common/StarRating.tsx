import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
};

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <View style={[styles.row, onChange ? styles.editableRow : null]}>
      {[1, 2, 3, 4, 5].map((score) => {
        const filled = score <= value;
        const mark = (
          <Text style={[styles.star, filled ? styles.filled : styles.empty]}>★</Text>
        );

        if (!onChange) {
          return <View key={score}>{mark}</View>;
        }

        return (
          <Pressable
            key={score}
            accessibilityRole="button"
            accessibilityLabel={`별점 ${score}`}
            onPress={() => onChange(score)}
            style={styles.target}
          >
            {mark}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  // Each editable star is its own 44pt touch target, so neighbours sit flush instead of overlapping hit slops.
  editableRow: {
    gap: 0,
  },
  target: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    fontSize: 22,
    lineHeight: 28,
  },
  filled: {
    color: colors.accent,
  },
  empty: {
    color: colors.border,
  },
});
