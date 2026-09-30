import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCard } from '@/components/books/BookCard';
import { Bookshelf } from '@/components/books/Bookshelf';
import { EmptyState } from '@/components/common/EmptyState';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { colors } from '@/constants/colors';
import { radius, typography } from '@/constants/theme';
import { getCompletedBooks, getLibraryBooks } from '@/data/selectors';

type LibraryFilter = 'all' | 'wishlist' | 'reading' | 'completed';

const filters: { key: LibraryFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'wishlist', label: '읽고 싶음' },
  { key: 'reading', label: '읽는 중' },
  { key: 'completed', label: '완독' },
];

export default function LibraryScreen() {
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const books = getLibraryBooks();
  const completedBooks = getCompletedBooks();
  const visibleBooks = useMemo(
    () => (filter === 'all' ? books : books.filter((book) => book.status === filter)),
    [books, filter],
  );

  return (
    <Screen topInset>
      <View style={styles.header}>
        <Text style={styles.title}>서재</Text>
        <Text style={styles.subtitle}>읽고 싶은 책부터 완독까지 한곳에 모아 둡니다.</Text>
      </View>

      <SectionHeader title="나의 책꽂이" />
      {completedBooks.length === 0 ? (
        <EmptyState title="책꽂이가 아직 비어 있어요" description="완독한 책이 여기에 한 권씩 놓입니다." />
      ) : (
        <Bookshelf books={completedBooks} onPressBook={(bookId) => router.push(`/book/${bookId}`)} />
      )}

      <View style={styles.filters}>
        {filters.map((item) => {
          const selected = item.key === filter;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setFilter(item.key)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {visibleBooks.length === 0 ? (
        <EmptyState title="이 상태의 책이 없어요" />
      ) : (
        visibleBooks.map((book) => (
          <BookCard key={book.id} book={book} onPress={() => router.push(`/book/${book.id}`)} />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    ...typography.greeting,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: colors.onAccent,
  },
});
