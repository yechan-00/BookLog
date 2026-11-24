import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { homeTheme } from '@/constants/homeTheme';

type LibraryEmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function LibraryEmptyState({ title, description, actionLabel, onAction }: LibraryEmptyStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {onAction && actionLabel ? (
        <View style={styles.action}>
          <PrimaryButton
            label={actionLabel}
            onPress={onAction}
            primaryColor={homeTheme.primary}
            primaryPressedColor={homeTheme.accentLine}
            onPrimaryColor={homeTheme.onPrimary}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8DED4',
    backgroundColor: homeTheme.surface,
    padding: 20,
    gap: 6,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: homeTheme.text,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: homeTheme.textSecondary,
  },
  action: {
    marginTop: 10,
  },
});
