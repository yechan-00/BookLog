import { Redirect, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoverBookshelf, type CoverShelfBook } from '@/components/books/CoverBookshelf';
import { EmptyBookshelf } from '@/components/books/EmptyBookshelf';
import { Screen } from '@/components/common/Screen';
import { libraryTheme } from '@/constants/libraryTheme';
import { radius, spacing, typography } from '@/constants/theme';
import { spinePaletteColorFor } from '@/utils/spineStyle';

const COUNT_OPTIONS = [0, 1, 4, 8, 20] as const;

const SAMPLE_TITLES = [
  { title: '아몬드', author: '손원평' },
  { title: '데미안', author: '헤르만 헤세' },
  { title: '채식주의자', author: '한강' },
  { title: '미드나잇 라이브러리', author: '매트 헤이그' },
  { title: '아주 긴 한글 제목이라도 표지에 안전하게 보여야 하는 책', author: '북로그' },
  { title: '코스모스', author: '칼 세이건' },
  { title: '나미야 잡화점의 기적', author: '히가시노 게이고' },
  { title: '달러구트 꿈 백화점', author: '이미예' },
  { title: '어린 왕자', author: '생텍쥐페리' },
  { title: '1984', author: '조지 오웰' },
  { title: '연금술사', author: '파울로 코엘료' },
  { title: '죽은 시인의 사회', author: 'N. H. 클라인바움' },
  { title: '나미야의 오후', author: '북로그' },
  { title: '서재의 먼지', author: '북로그' },
  { title: '작은 책방', author: '북로그' },
  { title: '노란 노트', author: '북로그' },
  { title: '저녁의 페이지', author: '북로그' },
  { title: '읽지 않은 책', author: '북로그' },
  { title: '다시 펼친 책', author: '북로그' },
  { title: '표지 실패 샘플', author: '북로그' },
] as const;

function buildSamples(count: number): CoverShelfBook[] {
  return SAMPLE_TITLES.slice(0, count).map((item, index) => {
    const id = `preview-${index + 1}`;
    return {
      id,
      bookId: `preview-book-${index + 1}`,
      title: item.title,
      author: item.author,
      color: spinePaletteColorFor(id),
      imageUrl: index === 19 ? 'https://invalid.booklog.local/missing-cover.png' : null,
      totalPages: 120 + index * 37,
    };
  });
}

export default function BookshelfPreviewScreen() {
  const [count, setCount] = useState<(typeof COUNT_OPTIONS)[number]>(8);
  const books = buildSamples(count);

  if (!__DEV__) {
    return <Redirect href="/(tabs)/library" />;
  }

  return (
    <Screen topInset backgroundColor={libraryTheme.background}>
      <Stack.Screen options={{ title: '책꽂이 미리보기' }} />
      <Text style={styles.warning}>실제 서재 데이터가 아닙니다. 디자인 확인용 샘플입니다.</Text>
      <View style={styles.counts}>
        {COUNT_OPTIONS.map((option) => {
          const selected = option === count;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setCount(option)}
              style={[styles.countChip, selected && styles.countChipSelected]}
            >
              <Text style={[styles.countLabel, selected && styles.countLabelSelected]}>{option}권</Text>
            </Pressable>
          );
        })}
      </View>
      {count === 0 ? (
        <EmptyBookshelf />
      ) : (
        <CoverBookshelf books={books} onPressBook={() => undefined} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  warning: {
    ...typography.caption,
    color: libraryTheme.primaryBrown,
  },
  counts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  countChip: {
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: libraryTheme.border,
    backgroundColor: libraryTheme.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countChipSelected: {
    backgroundColor: libraryTheme.primaryBrown,
    borderColor: libraryTheme.primaryBrown,
  },
  countLabel: {
    ...typography.caption,
    color: libraryTheme.primaryBrown,
    fontWeight: '700',
  },
  countLabelSelected: {
    color: libraryTheme.onPrimary,
  },
});
