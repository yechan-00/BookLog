import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { homeTheme } from '@/constants/homeTheme';

type HomeCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HomeCard({ children, style }: HomeCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Twin mid-row cards share width; height follows content via stretch. */
export const homeTwinCardStyle = { flex: 1 } as const;

type HomeCardTitleProps = {
  title: string;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function HomeCardTitle({ title, onPress, accessibilityLabel }: HomeCardTitleProps) {
  const content = (
    <>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {onPress ? <AppIcon name="chevronRight" size={17} color={homeTheme.text} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.titleRow}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.titleRow, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: homeTheme.surface,
    borderColor: homeTheme.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: homeTheme.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  titleRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: homeTheme.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
