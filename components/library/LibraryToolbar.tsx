import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionSheet } from '@/components/common/ActionSheet';
import { AppIcon } from '@/components/common/AppIcon';
import { homeTheme } from '@/constants/homeTheme';
import type { LibrarySort, LibraryViewMode } from '@/utils/libraryView';

type LibraryToolbarProps = {
  sort: LibrarySort;
  viewMode: LibraryViewMode;
  onChangeSort: (sort: LibrarySort) => void;
  onChangeView: (mode: LibraryViewMode) => void;
};

const sortOptions: { key: LibrarySort; label: string }[] = [
  { key: 'added', label: '최근 등록순' },
  { key: 'recent', label: '최근 독서순' },
  { key: 'title', label: '제목순' },
  { key: 'progress', label: '진행률순' },
];

export function LibraryToolbar({ sort, viewMode, onChangeSort, onChangeView }: LibraryToolbarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const currentLabel = sortOptions.find((item) => item.key === sort)?.label ?? '최근 등록순';

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`정렬 ${currentLabel}`}
        hitSlop={6}
        onPress={() => setSortOpen(true)}
        style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
      >
        <Text style={styles.sortLabel}>{currentLabel}</Text>
        <AppIcon name="chevronDown" size={15} color="#79543F" />
      </Pressable>

      <View style={styles.views}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="그리드 보기"
          accessibilityState={{ selected: viewMode === 'grid' }}
          onPress={() => onChangeView('grid')}
          style={({ pressed }) => [
            styles.viewButton,
            viewMode === 'grid' && styles.viewSelected,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon
            name="grid"
            size={18}
            color={viewMode === 'grid' ? homeTheme.onPrimary : '#79543F'}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="목록 보기"
          accessibilityState={{ selected: viewMode === 'list' }}
          onPress={() => onChangeView('list')}
          style={({ pressed }) => [
            styles.viewButton,
            viewMode === 'list' && styles.viewSelected,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon
            name="list"
            size={18}
            color={viewMode === 'list' ? homeTheme.onPrimary : '#79543F'}
          />
        </Pressable>
      </View>

      <ActionSheet
        visible={sortOpen}
        title="정렬"
        onClose={() => setSortOpen(false)}
        items={sortOptions.map((option) => ({
          key: option.key,
          label: option.label,
          onPress: () => onChangeSort(option.key),
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sortButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#79543F',
  },
  views: {
    flexDirection: 'row',
    gap: 6,
  },
  viewButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DED4',
    backgroundColor: homeTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewSelected: {
    backgroundColor: homeTheme.primary,
    borderColor: homeTheme.primary,
  },
  pressed: {
    opacity: 0.88,
  },
});
