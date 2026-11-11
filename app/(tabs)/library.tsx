import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BookCard } from '@/components/books/BookCard';
import { BookshelfDevPreviewEntry } from '@/components/books/BookshelfDevPreview';
import { CoverBookshelf } from '@/components/books/CoverBookshelf';
import { DustCard } from '@/components/books/DustCard';
import { EmptyBookshelf } from '@/components/books/EmptyBookshelf';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { libraryTheme } from '@/constants/libraryTheme';
import { radius, spacing, typography } from '@/constants/theme';
import type { LibraryBook } from '@/types/book';
import { startOfToday, toDateKey } from '@/utils/date';
import { loadLibraryBooks, type LoadStatus } from '@/utils/readingSource';

type LibraryFilter = 'all' | 'wishlist' | 'reading' | 'completed';

const filters: { key: LibraryFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'wishlist', label: '읽고 싶음' },
  { key: 'reading', label: '읽는 중' },
  { key: 'completed', label: '완독' },
];

export default function LibraryScreen() {
  const today = toDateKey(startOfToday());
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [query, setQuery] = useState('');
  const source = loadLibraryBooks();
  const books = source.status === 'ready' ? source.value : [];
  const trimmedQuery = query.trim().toLocaleLowerCase('ko-KR');
  const searchedBooks =
    source.status !== 'ready' || trimmedQuery.length === 0
      ? books
      : books.filter((book) => {
          const title = book.title.toLocaleLowerCase('ko-KR');
          const author = book.author.toLocaleLowerCase('ko-KR');
          return title.includes(trimmedQuery) || author.includes(trimmedQuery);
        });
  const visibleBooks = filter === 'all' ? searchedBooks : searchedBooks.filter((book) => book.status === filter);
  const readingBooks = books.filter((book) => book.status === 'reading');
  const openSearch = () => router.push('/book/search');
  const canSearch = source.status === 'ready';

  return (
    <Screen topInset backgroundColor={libraryTheme.background}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>나의 서재</Text>
            <Text style={styles.subtitle}>읽고 싶은 책부터 완독한 책까지</Text>
            {source.status === 'ready' ? (
              <Text style={styles.count}>등록된 책 {books.length}권</Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="책 추가"
            onPress={openSearch}
            style={styles.addButton}
          >
            <Text style={styles.addLabel}>책 추가</Text>
          </Pressable>
        </View>
        <BookshelfDevPreviewEntry />
      </View>

      <View style={styles.searchBlock}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          editable={canSearch}
          placeholder={canSearch ? '제목 또는 저자 검색' : '서재를 불러온 뒤 검색할 수 있어요'}
          placeholderTextColor={libraryTheme.textSecondary}
          style={[styles.searchInput, !canSearch && styles.searchInputDisabled]}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {!canSearch ? (
          <Text style={styles.searchNote}>서재 데이터가 없어 검색을 열지 않습니다.</Text>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
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
      </ScrollView>

      <SectionHeader title="책꽂이" />
      {source.status !== 'ready' ? (
        <EmptyState title={shelfTitle(source)} description={shelfDescription(source)} />
      ) : books.length === 0 ? (
        <EmptyBookshelf
          title="아직 서재가 비어 있어요."
          description="첫 번째 책을 꽂아 나만의 서재를 만들어 보세요."
          actionLabel="책 등록하기"
          onAdd={openSearch}
        />
      ) : visibleBooks.length === 0 ? (
        <EmptyState title="조건에 맞는 책이 없어요" description="검색어나 필터를 바꿔 보세요." />
      ) : (
        <CoverBookshelf
          books={visibleBooks.map((book) => ({
            id: book.userBookId,
            bookId: book.id,
            title: book.title,
            author: book.author,
            color: book.coverColor || book.spineColor,
            imageUrl: book.coverImageUrl,
            totalPages: book.totalPages,
          }))}
          onPressBook={(bookId) => router.push(`/book/${bookId}`)}
        />
      )}

      <SectionHeader title="목록" />
      {source.status !== 'ready' ? (
        <View style={styles.emptyActions}>
          <EmptyState title={shelfTitle(source)} description="예시 책은 표시하지 않습니다." />
          <PrimaryButton label="책 등록하기" onPress={openSearch} />
        </View>
      ) : books.length === 0 ? (
        <View style={styles.emptyActions}>
          <EmptyState title="아직 서재가 비어 있어요." description="첫 번째 책을 꽂아 나만의 서재를 만들어 보세요." />
          <PrimaryButton label="책 등록하기" onPress={openSearch} />
        </View>
      ) : visibleBooks.length === 0 ? (
        <EmptyState title="이 상태의 책이 없어요" />
      ) : (
        visibleBooks.map((book) => (
          <BookCard key={book.userBookId} book={book} onPress={() => router.push(`/book/${book.id}`)} />
        ))
      )}

      <SectionHeader title="먼지" />
      {source.status !== 'ready' ? (
        <EmptyState
          title={source.status === 'error' ? '먼지를 확인하지 못했습니다' : '먼지를 불러올 수 없습니다'}
          description={shelfDescription(source)}
        />
      ) : readingBooks.length === 0 ? (
        <EmptyState title="읽는 중인 책이 없습니다" description="먼지 상태는 읽는 중인 책에만 계산합니다." />
      ) : (
        readingBooks.map((book) => <DustRow key={book.userBookId} book={book} today={today} />)
      )}
    </Screen>
  );
}

function DustRow({ book, today }: { book: LibraryBook; today: string }) {
  return (
    <DustCard
      title={book.title}
      today={today}
      lastReadOn={book.lastReadAt}
      addedOn={null}
      lastWipedOn={null}
    />
  );
}

function shelfTitle(source: LoadStatus<LibraryBook[]>): string {
  return source.status === 'error' ? '서재를 확인하지 못했습니다' : '서재를 불러올 수 없습니다';
}

function shelfDescription(source: LoadStatus<LibraryBook[]>): string {
  return source.status === 'error' ? source.message : '서재 조회 API가 없습니다. 예시 책은 표시하지 않습니다.';
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.greeting,
    color: libraryTheme.text,
  },
  subtitle: {
    ...typography.body,
    color: libraryTheme.textSecondary,
  },
  count: {
    ...typography.caption,
    color: libraryTheme.secondaryBrown,
    fontWeight: '600',
  },
  addButton: {
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: libraryTheme.primaryBrown,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    ...typography.caption,
    color: libraryTheme.onPrimary,
    fontWeight: '700',
  },
  searchBlock: {
    gap: spacing.xs,
  },
  searchInput: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: libraryTheme.border,
    backgroundColor: libraryTheme.surface,
    paddingHorizontal: 14,
    color: libraryTheme.text,
    fontSize: 15,
  },
  searchInputDisabled: {
    opacity: 0.72,
  },
  searchNote: {
    ...typography.caption,
    color: libraryTheme.textSecondary,
  },
  filters: {
    gap: 8,
    paddingRight: spacing.sm,
  },
  chip: {
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: libraryTheme.border,
    backgroundColor: libraryTheme.surface,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: libraryTheme.primaryBrown,
    borderColor: libraryTheme.primaryBrown,
  },
  chipLabel: {
    ...typography.caption,
    color: libraryTheme.primaryBrown,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: libraryTheme.onPrimary,
  },
  emptyActions: {
    gap: spacing.sm,
  },
});
