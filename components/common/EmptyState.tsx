import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
