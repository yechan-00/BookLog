import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { libraryTheme } from '@/constants/libraryTheme';
import { spacing, typography } from '@/constants/theme';
import { formatKoreanDate } from '@/utils/format';

type HomeHeaderProps = {
  today: Date;
  onOpenPreview?: () => void;
};

export function HomeHeader({ today, onOpenPreview }: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={styles.date}>{formatKoreanDate(today)}</Text>
        <Text style={styles.title}>오늘도 한 페이지씩</Text>
        <View style={styles.accentLine} />
        <Text style={styles.subtitle}>작은 독서가 쌓여 나만의 이야기가 돼요.</Text>
        {__DEV__ && onOpenPreview ? (
          <Pressable accessibilityRole="button" onPress={onOpenPreview} style={styles.previewEntry}>
            <Text style={styles.previewLabel}>개발용 홈 미리보기</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="설정"
        hitSlop={8}
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsPressed]}
      >
        <AppIcon name="settings" color={libraryTheme.darkBrown} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  date: {
    ...typography.caption,
    color: libraryTheme.secondaryBrown,
    fontWeight: '600',
  },
  title: {
    ...typography.greeting,
    color: libraryTheme.darkBrown,
  },
  accentLine: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: libraryTheme.primaryBrown,
    marginTop: 2,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.body,
    color: libraryTheme.textSecondary,
  },
  previewEntry: {
    minHeight: 36,
    justifyContent: 'center',
  },
  previewLabel: {
    ...typography.caption,
    color: libraryTheme.primaryBrown,
    fontWeight: '700',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: libraryTheme.surface,
    borderWidth: 1,
    borderColor: libraryTheme.border,
  },
  settingsPressed: {
    opacity: 0.85,
  },
});
