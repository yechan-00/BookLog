import { Redirect, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LibraryBookGrid } from '@/components/library/LibraryBookGrid';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { LibraryFilters } from '@/components/library/LibraryFilters';
import { LibraryHeader } from '@/components/library/LibraryHeader';
import { LibraryListItem } from '@/components/library/LibraryListItem';
import { LibrarySearchField } from '@/components/library/LibrarySearchField';
import { LibraryToolbar } from '@/components/library/LibraryToolbar';
import { Screen } from '@/components/common/Screen';
import { homeTheme } from '@/constants/homeTheme';
import type { BookStatus, LibraryBook } from '@/types/book';
import { addDays, startOfToday, toDateKey } from '@/utils/date';
import {
  filterLibraryBooks,
  type LibraryFilter,
  type LibrarySort,
  type LibraryViewMode,
} from '@/utils/libraryView';
import { spinePaletteColorFor } from '@/utils/spineStyle';

type PreviewScenario =
  | 'empty'
  | 'one'
  | 'three'
  | 'nine'
  | 'twenty'
  | 'reading'
  | 'completed'
  | 'wishlist'
  | 'long-title'
  | 'no-cover'
  | 'no-search'
  | 'error';

const SCENARIOS: { key: PreviewScenario; label: string }[] = [
  { key: 'empty', label: '0권' },
  { key: 'one', label: '1권' },
  { key: 'three', label: '3권' },
  { key: 'nine', label: '9권' },
  { key: 'twenty', label: '20권' },
  { key: 'reading', label: '읽는 중' },
  { key: 'completed', label: '완독' },
  { key: 'wishlist', label: '읽고 싶음' },
  { key: 'long-title', label: '긴 제목' },
  { key: 'no-cover', label: '표지 없음' },
  { key: 'no-search', label: '검색 없음' },
  { key: 'error', label: '오류' },
];

const TITLES = [
  { title: '아몬드', author: '손원평' },
  { title: '데미안', author: '헤르만 헤세' },
  { title: '채식주의자', author: '한강' },
  { title: '미드나잇 라이브러리', author: '매트 헤이그' },
  { title: '아주 긴 한글 제목도 그리드에서 자연스럽게 보여야 하는 책', author: '북로그' },
  { title: '코스모스', author: '칼 세이건' },
  { title: '나미야 잡화점의 기적', author: '히가시노 게이고' },
  { title: '달러구트 꿈 백화점', author: '이미예' },
  { title: '어린 왕자', author: '생텍쥐페리' },
  { title: '1984', author: '조지 오웰' },
  { title: '연금술사', author: '파울로 코엘료' },
  { title: '죽은 시인의 사회', author: 'N. H. 클라인바움' },
  { title: '아주 작은 습관의 힘', author: '제임스 클리어' },
  { title: '서재의 오후', author: '북로그' },
  { title: '노란 노트', author: '북로그' },
  { title: '저녁의 페이지', author: '북로그' },
  { title: '읽지 않은 책', author: '북로그' },
  { title: '다시 펼친 책', author: '북로그' },
  { title: '작은 책방', author: '북로그' },
  { title: '표지 없는 책', author: '북로그' },
] as const;

function statusFor(index: number): BookStatus {
  if (index % 5 === 0) {
    return 'completed';
  }

  if (index % 3 === 0) {
    return 'wishlist';
  }

  return 'reading';
}

function sampleBooks(count: number, scenario: PreviewScenario): LibraryBook[] {
  const today = startOfToday();
  return TITLES.slice(0, count).map((item, index) => {
    const id = `preview-lib-${index + 1}`;
    const status =
      scenario === 'reading'
        ? 'reading'
        : scenario === 'completed'
          ? 'completed'
          : scenario === 'wishlist'
            ? 'wishlist'
            : statusFor(index);
    const totalPages = 200 + index * 17;
    const currentPage =
      status === 'completed' ? totalPages : status === 'reading' ? Math.round(totalPages * ((index % 7) + 2) * 0.1) : 0;
    return {
      id,
      userBookId: id,
      title: scenario === 'long-title' && index === 0 ? TITLES[4].title : item.title,
      author: item.author,
      coverColor: spinePaletteColorFor(id),
      spineColor: spinePaletteColorFor(id),
      coverImageUrl:
        scenario === 'no-cover' || index === 19 ? undefined : 'https://example.invalid/cover.jpg',
      totalPages,
      currentPage,
      status,
      rating: null,
      startedAt: toDateKey(addDays(today, -20 + index)),
      completedAt: status === 'completed' ? toDateKey(addDays(today, -index)) : null,
      lastReadAt: status === 'wishlist' ? null : toDateKey(addDays(today, -index)),
      createdAt: addDays(today, -30 + index).toISOString(),
    };
  });
}

function countFor(scenario: PreviewScenario): number {
  switch (scenario) {
    case 'empty':
    case 'error':
      return 0;
    case 'one':
    case 'long-title':
    case 'no-cover':
      return 1;
    case 'three':
      return 3;
    case 'nine':
      return 9;
    case 'reading':
    case 'completed':
    case 'wishlist':
    case 'no-search':
      return 8;
    default:
      return 20;
  }
}

export default function LibraryPreviewScreen() {
  const [scenario, setScenario] = useState<PreviewScenario>('nine');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<LibrarySort>('recent');
  const [viewMode, setViewMode] = useState<LibraryViewMode>('grid');

  const books = sampleBooks(countFor(scenario), scenario);
  const visibleBooks = filterLibraryBooks(
    books,
    filter,
    scenario === 'no-search' ? '존재하지않는검색어' : query,
    sort,
  );

  if (!__DEV__) {
    return <Redirect href="/(tabs)/library" />;
  }

  return (
    <Screen topInset backgroundColor={homeTheme.background} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: '서재 미리보기' }} />
      <Text style={styles.warning}>실제 서재 데이터가 아닙니다. 디자인 확인용 샘플입니다.</Text>
      <View style={styles.chips}>
        {SCENARIOS.map((item) => {
          const selected = item.key === scenario;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                setScenario(item.key);
                setQuery('');
                setFilter('all');
              }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <LibraryHeader onAdd={() => undefined} />

      {scenario === 'error' ? (
        <LibraryEmptyState title="서재를 불러오지 못했어요." description="미리보기용 오류 상태입니다." />
      ) : (
        <>
          <LibrarySearchField value={query} onChangeText={setQuery} />
          <LibraryFilters value={filter} onChange={setFilter} />
          {books.length > 0 ? (
            <LibraryToolbar sort={sort} viewMode={viewMode} onChangeSort={setSort} onChangeView={setViewMode} />
          ) : null}
          {books.length === 0 ? (
            <LibraryEmptyState
              title="아직 서재에 책이 없어요."
              description="첫 번째 책을 추가해 보세요."
              actionLabel="책 추가"
            />
          ) : visibleBooks.length === 0 ? (
            <LibraryEmptyState
              title="검색 결과가 없어요."
              description="다른 제목이나 저자로 검색해 보세요."
            />
          ) : viewMode === 'grid' ? (
            <LibraryBookGrid books={visibleBooks} onPressBook={() => undefined} />
          ) : (
            <View style={styles.list}>
              {visibleBooks.map((book) => (
                <LibraryListItem key={book.userBookId} book={book} onPress={() => undefined} />
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  warning: {
    fontSize: 12,
    lineHeight: 16,
    color: homeTheme.primary,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E8DED4',
    backgroundColor: homeTheme.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: homeTheme.primary,
    borderColor: homeTheme.primary,
  },
  chipLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: homeTheme.primary,
  },
  chipLabelSelected: {
    color: homeTheme.onPrimary,
  },
  list: {
    gap: 12,
  },
});
