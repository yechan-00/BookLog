import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { homeSpace, homeTheme } from '@/constants/homeTheme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { formatKoreanDate } from '@/utils/format';

type HomeHeaderProps = {
  today: Date;
  /** Preview-only override so sample names stay out of production data. */
  previewNickname?: string | null;
};

export function HomeHeader({ today, previewNickname }: HomeHeaderProps) {
  const { profile } = useAuth();
  const nickname = previewNickname !== undefined ? previewNickname : profile?.nickname?.trim() || null;
  const longName = Boolean(nickname && nickname.length > 8);

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Text style={styles.date}>{formatKoreanDate(today)}</Text>
        {nickname ? (
          <Text style={[styles.greeting, longName && styles.greetingLong]}>
            {nickname} 님,{'\n'}오늘도 한 페이지씩
          </Text>
        ) : (
          <Text style={styles.greeting}>
            오늘도{'\n'}한 페이지씩
          </Text>
        )}
        <View style={styles.accentLine} />
        <Text style={styles.subtitle} numberOfLines={1}>
          좋은 이야기가, 좋은 하루를 만듭니다.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="설정"
        hitSlop={8}
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
      >
        <AppIcon name="person" size={20} color={homeTheme.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: homeSpace.md,
  },
  left: {
    flex: 1,
    minWidth: 0,
    paddingRight: homeSpace.sm,
  },
  date: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: homeTheme.date,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '700',
    color: homeTheme.text,
  },
  greetingLong: {
    fontSize: 22,
    lineHeight: 27,
  },
  accentLine: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: homeTheme.accentLine,
    marginTop: 12,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: homeTheme.textSecondary,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: homeTheme.surface,
    borderWidth: 1,
    borderColor: '#E9DFD5',
    shadowColor: homeTheme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  pressed: {
    opacity: 0.88,
  },
});
