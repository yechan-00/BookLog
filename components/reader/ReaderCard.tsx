import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { readerRadius, readerTheme } from '@/constants/readerTheme';

type ReaderCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
};

export function ReaderCard({ children, style, padding = 16 }: ReaderCardProps) {
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: readerTheme.surface,
    borderRadius: readerRadius.card,
    borderWidth: 1,
    borderColor: readerTheme.border,
    shadowColor: readerTheme.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
