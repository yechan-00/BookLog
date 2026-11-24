import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Bookshelf, type ShelfBook } from '@/components/books/Bookshelf';
import { colors } from '@/constants/colors';
import { homeTheme } from '@/constants/homeTheme';
import { card, spacing, typography } from '@/constants/theme';

type BookshelfPreviewCardProps = {
  books: ShelfBook[];
  completedCount: number;
  dustyCount: number;
  loading?: boolean;
  errorMessage?: string | null;
};

export function BookshelfPreviewCard({
  books,
  completedCount,
  dustyCount,
  loading = false,
  errorMessage = null,
}: BookshelfPreviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title}>나의 책꽂이</Text>
          <Text style={styles.note}>
            {loading
              ? '불러오는 중…'
              : errorMessage
                ? errorMessage
                : `완독 ${completedCount}권 · 먼지 ${dustyCount}권`}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="책꽂이 전체 보기"
          onPress={() => router.push('/bookshelf' as Href)}
          hitSlop={8}
        >
          <Text style={styles.link}>전체 보기</Text>
        </Pressable>
      </View>

      {books.length > 0 ? (
        <Bookshelf books={books.slice(0, 12)} onPressBook={(userBookId) => router.push(`/book/${userBookId}`)} />
      ) : (
        <Text style={styles.note}>
          {loading ? '책꽂이를 준비하고 있어요.' : '완독한 책이 쌓이면 이곳에 보여요.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    backgroundColor: homeTheme.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.section,
    color: homeTheme.text,
  },
  note: {
    ...typography.caption,
    color: homeTheme.textSecondary,
  },
  link: {
    ...typography.bodyStrong,
    color: colors.accent,
  },
});
