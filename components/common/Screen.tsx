import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  topInset?: boolean;
  includeBottomInset?: boolean;
  contentContainerStyle?: ViewStyle;
  /** Optional screen background. Defaults to the global app background. */
  backgroundColor?: string;
};

export function Screen({
  children,
  scroll = true,
  topInset = false,
  includeBottomInset = false,
  contentContainerStyle,
  backgroundColor = colors.background,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = topInset ? insets.top + spacing.md : spacing.lg;
  const paddingBottom = (includeBottomInset ? insets.bottom : 0) + spacing.xxxl;

  if (!scroll) {
    return (
      <View style={[styles.container, styles.content, { paddingTop, paddingBottom, backgroundColor }]}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={[styles.content, { paddingTop, paddingBottom }, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
});

