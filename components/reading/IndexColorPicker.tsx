import { Pressable, StyleSheet, Text, View } from 'react-native';

import { INDEX_COLOR_OPTIONS, INDEX_SWATCH_SIZE } from '@/constants/bookIndex';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/theme';

type IndexColorPickerProps = {
  value: string | null;
  onChange: (color: string | null) => void;
};

/** 색상은 선택 사항이라, 고른 색을 한 번 더 누르면 해제된다. */
export function IndexColorPicker({ value, onChange }: IndexColorPickerProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>색상 (선택)</Text>
      <View style={styles.row}>
        {INDEX_COLOR_OPTIONS.map((color, position) => {
          const isSelected = color === value;
          return (
            <Pressable
              key={color}
              accessibilityRole="button"
              accessibilityLabel={`색상 ${position + 1}`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onChange(isSelected ? null : color)}
              style={[styles.touch, isSelected && styles.touchSelected]}
            >
              <View style={[styles.swatch, { backgroundColor: color }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  touch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchSelected: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  swatch: {
    width: INDEX_SWATCH_SIZE,
    height: INDEX_SWATCH_SIZE,
    borderRadius: INDEX_SWATCH_SIZE / 2,
  },
});
