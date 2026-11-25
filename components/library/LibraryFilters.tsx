import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { homeTheme } from '@/constants/homeTheme';
import { readerLayout } from '@/constants/readerTheme';
import type { LibraryFilter } from '@/utils/libraryView';

type LibraryFiltersProps = {
  value: LibraryFilter;
  onChange: (value: LibraryFilter) => void;
};

const filters: { key: LibraryFilter; label: string; weight: number }[] = [
  { key: 'all', label: '전체', weight: 0.9 },
  { key: 'reading', label: '읽는 중', weight: 1.15 },
  { key: 'completed', label: '완독', weight: 0.9 },
  { key: 'wishlist', label: '읽고 싶음', weight: 1.3 },
  { key: 'paused', label: '임시 중단', weight: 1.35 },
];

export function LibraryFilters({ value, onChange }: LibraryFiltersProps) {
  const { width, fontScale } = useWindowDimensions();
  const layout = readerLayout(width);
  const allowWrap = fontScale > 1.2;
  const gap = layout.compact ? 4 : 5;
  const padX = layout.compact ? 6 : layout.roomy ? 9 : 7;
  const fontSize = layout.compact ? 12 : 13;

  return (
    <View style={[styles.row, { gap }, allowWrap && styles.rowWrap]}>
      {filters.map((item) => {
        const selected = item.key === value;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [
              styles.chip,
              {
                flexGrow: item.weight,
                flexBasis: allowWrap ? undefined : 0,
                paddingHorizontal: padX,
              },
              selected && styles.chipSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.label, { fontSize, lineHeight: fontSize + 4 }, selected && styles.labelSelected]}
              numberOfLines={1}
              maxFontSizeMultiplier={allowWrap ? undefined : 1.15}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  rowWrap: {
    flexWrap: 'wrap',
  },
  chip: {
    height: 42,
    minHeight: 42,
    flexShrink: 1,
    minWidth: 0,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E8DED4',
    backgroundColor: homeTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: homeTheme.primary,
    borderColor: homeTheme.primary,
  },
  label: {
    fontWeight: '600',
    color: '#79543F',
    textAlign: 'center',
  },
  labelSelected: {
    color: homeTheme.onPrimary,
  },
  pressed: {
    opacity: 0.9,
  },
});
