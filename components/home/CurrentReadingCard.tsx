import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ShelfBookCover } from '@/components/books/ShelfBookCover';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { libraryTheme } from '@/constants/libraryTheme';
import { radius, spacing, typography } from '@/constants/theme';
import type { LibraryBook } from '@/types/book';

type CurrentReadingCardProps = {
  book: LibraryBook;
};

export function CurrentReadingCard({ book }: CurrentReadingCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${book.title} 상세`}
        onPress={() => router.push(`/book/${book.userBookId}`)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <ShelfBookCover
          id={book.userBookId}
          title={book.title}
          author={book.author}
          color={book.coverColor || book.spineColor}
          width={78}
          height={117}
          imageUrl={book.coverImageUrl}
        />
        <View style={styles.body}>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>읽는 중</Text>
          </View>
          <Text numberOfLines={3} style={styles.title}>
            {book.title}
          </Text>
          <Text numberOfLines={1} style={styles.author}>
            {book.author}
          </Text>
        </View>
      </Pressable>
      <PrimaryButton
        label="이어 읽기"
        onPress={() => router.push({ pathname: '/reading/session', params: { userBookId: book.userBookId } })}
        primaryColor={libraryTheme.primaryBrown}
        primaryPressedColor={libraryTheme.darkBrown}
        onPrimaryColor={libraryTheme.onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: libraryTheme.surface,
    borderColor: libraryTheme.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowColor: libraryTheme.darkBrown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-end',
  },
  pressed: {
    opacity: 0.92,
  },
  body: {
    flex: 1,
    gap: 6,
    paddingBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: libraryTheme.softBrown,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLabel: {
    ...typography.caption,
    color: libraryTheme.primaryBrown,
    fontWeight: '700',
  },
  title: {
    ...typography.title,
    color: libraryTheme.darkBrown,
  },
  author: {
    ...typography.body,
    color: libraryTheme.textSecondary,
  },
});
