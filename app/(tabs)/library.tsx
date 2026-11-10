import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCard } from '@/components/books/BookCard';
import { Bookshelf } from '@/components/books/Bookshelf';
import { DustCard } from '@/components/books/DustCard';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { colors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import type { LibraryBook } from '@/types/book';
import { startOfToday, toDateKey } from '@/utils/date';
import { loadLibraryBooks, type LoadStatus } from '@/utils/readingSource';
import { shelfGrowth, TEMP_SPINE_WIDTH_BANDS } from '@/utils/shelfGrowth';

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
  const source = loadLibraryBooks();
  const books = source.status === 'ready' ? source.value : [];
  const growth = shelfGrowth(
    books.map((book) => ({
      userBookId: book.userBookId,
      bookId: book.id,
      title: book.title,
      status: book.status,
      totalPages: book.totalPages,
      spineColor: book.spineColor,
    })),
    TEMP_SPINE_WIDTH_BANDS,
  );
  const visibleBooks = filter === 'all' ? books : books.filter((book) => book.status === filter);
  const readingBooks = books.filter((book) => book.status === 'reading');
  const openSearch = () => router.push('/book/search');

  return (
    <Screen topInset>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>서재</Text>
          {books.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="책 추가"
              onPress={openSearch}
              style={styles.addButton}
            >
              <Text style={styles.addLabel}>책 추가</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.subtitle}>읽고 싶은 책부터 완독까지 한곳에 모아 둡니다.</Text>
      </View>

      <SectionHeader title="나의 책꽂이" />
      {source.status !== 'ready' ? (
        <EmptyState title={shelfTitle(source)} description={shelfDescription(source)} />
      ) : growth.completedCount === 0 ? (
        <EmptyState title="책꽂이가 아직 비어 있어요" description="완독한 책이 여기에 한 권씩 놓입니다." />
      ) : (
        <View style={styles.shelfBlock}>
          <Text style={styles.note}>{shelfSummary(growth.completedCount, growth.knownPageTotal, growth.missingPageCount)}</Text>
          <Bookshelf
            books={growth.spines.map((spine) => ({
              id: spine.userBookId,
              bookId: spine.bookId,
              title: spine.title,
              color: spine.spineColor,
              width: spine.width,
            }))}
            onPressBook={(bookId) => router.push(`/book/${bookId}`)}
          />
        </View>
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

      {source.status !== 'ready' ? (
        <View style={styles.emptyActions}>
          <EmptyState title={shelfTitle(source)} description="예시 책은 표시하지 않습니다." />
          <PrimaryButton label="책 추가" onPress={openSearch} />
        </View>
      ) : books.length === 0 ? (
        <View style={styles.emptyActions}>
          <EmptyState title="서재가 아직 비어 있어요" description="검색으로 읽고 싶은 책을 추가해 보세요." />
          <PrimaryButton label="책 추가" onPress={openSearch} />
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
        <EmptyState title={source.status === 'error' ? '먼지를 확인하지 못했습니다' : '먼지를 불러올 수 없습니다'} description={shelfDescription(source)} />
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

function shelfSummary(count: number, pages: number | null, missing: number): string {
  const pageText = pages === null ? '확인된 페이지 합계 없음' : `확인된 페이지 ${pages}`;
  const missingText = missing > 0 ? ` · 페이지 없는 책 ${missing}권` : '';
  return `완독 ${count}권 · ${pageText}${missingText}`;
}

function shelfTitle(source: LoadStatus<LibraryBook[]>): string {
  return source.status === 'error' ? '서재를 확인하지 못했습니다' : '서재를 불러올 수 없습니다';
}

function shelfDescription(source: LoadStatus<LibraryBook[]>): string {
  return source.status === 'error' ? source.message : '서재 조회 API가 없습니다. 예시 책은 표시하지 않습니다.';
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  addButton: {
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    ...typography.caption,
    color: colors.onAccent,
    fontWeight: '600',
  },
  emptyActions: {
    gap: spacing.sm,
  },
  title: {
    ...typography.greeting,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  shelfBlock: {
    gap: spacing.sm,
  },
  note: {
    ...typography.caption,
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
