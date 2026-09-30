import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/books/BookCover';
import { StatusBadge } from '@/components/books/StatusBadge';
import { ProgressBar } from '@/components/common/ProgressBar';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import type { LibraryBook } from '@/types/book';
import { clampPercent } from '@/utils/format';

type BookCardProps = {
  book: LibraryBook;
  onPress: () => void;
};

export function BookCard({ book, onPress }: BookCardProps) {
  const showProgress = book.status === 'reading' || book.status === 'paused';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <BookCover title={book.title} color={book.coverColor} imageUrl={book.coverImageUrl} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text numberOfLines={2} style={styles.title}>
            {book.title}
          </Text>
          <StatusBadge status={book.status} />
        </View>
        <Text numberOfLines={1} style={styles.author}>
          {book.author}
        </Text>
        {showProgress ? (
          <View style={styles.progress}>
            <ProgressBar current={book.currentPage} total={book.totalPages} />
            <Text style={styles.progressLabel}>
              {book.currentPage} / {book.totalPages} · {clampPercent(book.currentPage, book.totalPages)}%
            </Text>
          </View>
        ) : null}
        {book.status === 'completed' && book.rating ? (
          <Text style={styles.rating}>별점 {book.rating}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  body: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  author: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progress: {
    gap: 6,
    marginTop: 4,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rating: {
    ...typography.caption,
    color: colors.accent,
  },
});
