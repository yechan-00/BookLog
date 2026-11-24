import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { homeTheme } from '@/constants/homeTheme';
import type { LibraryFilter } from '@/utils/libraryView';

type LibraryFiltersProps = {
  value: LibraryFilter;
  onChange: (value: LibraryFilter) => void;
};

const filters: { key: LibraryFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'reading', label: '읽는 중' },
  { key: 'completed', label: '완독' },
  { key: 'wishlist', label: '읽고 싶음' },
  { key: 'paused', label: '임시 중단' },
];

export function LibraryFilters({ value, onChange }: LibraryFiltersProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {filters.map((item) => {
        const selected = item.key === value;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E8DED4',
    backgroundColor: homeTheme.surface,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: homeTheme.primary,
    borderColor: homeTheme.primary,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#79543F',
  },
  labelSelected: {
    color: homeTheme.onPrimary,
  },
  pressed: {
    opacity: 0.9,
  },
});
