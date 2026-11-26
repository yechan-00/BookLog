import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  topInset?: boolean;
  includeBottomInset?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
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
  const safeTop = topInset ? insets.top : 0;
  const paddingTop = topInset ? spacing.md : spacing.lg;
  const paddingBottom = (includeBottomInset ? insets.bottom : 0) + spacing.xxxl;

  if (!scroll) {
    return (
      <View
        style={[styles.container, styles.content, { paddingTop: safeTop + paddingTop, paddingBottom, backgroundColor }]}
      >
        {children}
      </View>
    );
  }

  // The status bar area sits outside the ScrollView so content never scrolls underneath it.
  return (
    <View style={[styles.container, { paddingTop: safeTop, backgroundColor }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop, paddingBottom }, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
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

