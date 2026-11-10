import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/books/BookCover';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import type { BookSearchResult } from '@/types/book';
import { fallbackCoverColor } from '@/utils/book';

const COVER_WIDTH = 64;
const COVER_HEIGHT = 96;
const COVER_RADIUS = 8;

type BookSearchResultCardProps = {
  book: BookSearchResult;
  onPress: () => void;
};

export function BookSearchResultCard({ book, onPress }: BookSearchResultCardProps) {
  const author = book.author.trim();
  const publisher = book.publisher.trim();
  const details = [author, publisher].filter((item) => item.length > 0);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[book.title, ...details].join(', ')}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <BookCover
        title={book.title}
        color={fallbackCoverColor(book.title)}
        width={COVER_WIDTH}
        height={COVER_HEIGHT}
        cornerRadius={COVER_RADIUS}
        imageUrl={book.coverImageUrl ?? undefined}
      />
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>
          {book.title}
        </Text>
        {author ? (
          <Text numberOfLines={1} style={styles.meta}>
            {author}
          </Text>
        ) : null}
        {publisher ? (
          <Text numberOfLines={1} style={styles.meta}>
            {publisher}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
