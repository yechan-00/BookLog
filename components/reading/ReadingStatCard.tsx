import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';

type ReadingStatCardProps = {
  label: string;
  value: string;
  style?: ViewStyle;
};

export function ReadingStatCard({ label, value, style }: ReadingStatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    padding: spacing.lg,
    gap: 6,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  value: {
    ...typography.title,
    color: colors.text,
  },
});
