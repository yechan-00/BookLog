import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { typography } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '찾을 수 없음' }} />
      <View style={styles.container}>
        <Text style={styles.title}>화면을 찾지 못했어요.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>홈으로 돌아가기</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
    gap: 12,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  link: {
    paddingVertical: 12,
  },
  linkText: {
    ...typography.bodyStrong,
    color: colors.accent,
  },
});
