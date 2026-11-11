import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';

type BookSearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
};

export function BookSearchField({ value, onChangeText }: BookSearchFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.field, isFocused && styles.focused]}>
      <AppIcon name="search" color={isFocused ? colors.accent : colors.textSecondary} size={20} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="책 제목을 검색하세요"
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel="책 제목 검색"
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="검색어 지우기"
          hitSlop={8}
          onPress={() => onChangeText('')}
          style={styles.clear}
        >
          <AppIcon name="clear" color={colors.textMuted} size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
    borderRadius: radius.md,
  },
  focused: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  clear: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
