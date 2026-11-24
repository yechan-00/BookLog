import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/common/AppIcon';
import { homeTheme } from '@/constants/homeTheme';
import type { LibraryFilter, LibraryStats as LibraryStatsData } from '@/utils/libraryView';

type LibraryStatsProps = {
  stats: LibraryStatsData;
  activeFilter: LibraryFilter;
  onSelect: (filter: LibraryFilter) => void;
};

const chips: {
  key: Exclude<LibraryFilter, 'all'>;
  label: string;
  icon: AppIconName;
  valueKey: keyof LibraryStatsData;
}[] = [
  { key: 'completed', label: '완독', icon: 'checkmark', valueKey: 'completed' },
  { key: 'reading', label: '읽는 중', icon: 'bookOpen', valueKey: 'reading' },
  { key: 'wishlist', label: '읽고 싶음', icon: 'bookmark', valueKey: 'wishlist' },
  { key: 'paused', label: '임시 중단', icon: 'clock', valueKey: 'paused' },
];

export function LibraryStats({ stats, activeFilter, onSelect }: LibraryStatsProps) {
  return (
    <View style={styles.row}>
      {chips.map((chip) => {
        const selected = activeFilter === chip.key;
        const value = stats[chip.valueKey];
        return (
          <Pressable
            key={chip.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${chip.label} ${value}`}
            onPress={() => onSelect(selected ? 'all' : chip.key)}
            style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
          >
            <AppIcon name={chip.icon} size={16} color={selected ? homeTheme.onPrimary : '#79543F'} />
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {chip.label}
            </Text>
            <Text style={[styles.value, selected && styles.valueSelected]}>{value}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8DED4',
    backgroundColor: homeTheme.surface,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipSelected: {
    backgroundColor: homeTheme.primary,
    borderColor: homeTheme.primary,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    color: '#79543F',
    fontWeight: '600',
  },
  labelSelected: {
    color: homeTheme.onPrimary,
  },
  value: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
    color: '#79543F',
    fontVariant: ['tabular-nums'],
  },
  valueSelected: {
    color: homeTheme.onPrimary,
  },
  pressed: {
    opacity: 0.9,
  },
});
