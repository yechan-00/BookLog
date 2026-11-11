import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { libraryTheme } from '@/constants/libraryTheme';
import { typography } from '@/constants/theme';

/** Dev-only entry to the separated bookshelf preview screen. */
export function BookshelfDevPreviewEntry() {
  if (!__DEV__) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="개발용 책꽂이 미리보기"
      onPress={() => router.push('/dev/bookshelf-preview')}
      style={styles.entry}
    >
      <Text style={styles.label}>개발용 책꽂이 미리보기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  entry: {
    minHeight: 44,
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    color: libraryTheme.primaryBrown,
    fontWeight: '700',
  },
});
