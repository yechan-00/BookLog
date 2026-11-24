import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { homeTheme } from '@/constants/homeTheme';

type LibraryHeaderProps = {
  onAdd: () => void;
  onOpenBookshelf?: () => void;
};

export function LibraryHeader({ onAdd, onOpenBookshelf }: LibraryHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={styles.title}>나의 서재</Text>
        <Text style={styles.subtitle}>
          읽고 싶은 책부터 완독한 책까지,{'\n'}나만의 책장이에요.
        </Text>
      </View>
      <View style={styles.actions}>
        {onOpenBookshelf ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="책꽂이 열기"
            onPress={onOpenBookshelf}
            style={({ pressed }) => [styles.shelfButton, pressed && styles.pressed]}
          >
            <AppIcon name="library" size={18} color={homeTheme.primary} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="책 추가"
          onPress={onAdd}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <AppIcon name="plus" size={18} color={homeTheme.onPrimary} />
          <Text style={styles.addLabel}>책 추가</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: homeTheme.text,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: homeTheme.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shelfButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: homeTheme.border,
    backgroundColor: homeTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: homeTheme.primary,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  addLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: homeTheme.onPrimary,
  },
  pressed: {
    opacity: 0.9,
  },
});
