import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ShelfBookCover } from '@/components/books/ShelfBookCover';
import { AppIcon } from '@/components/common/AppIcon';
import { ProgressBar } from '@/components/common/ProgressBar';
import { HomeCard, HomeCardTitle } from '@/components/home/HomeCard';
import { homeTheme } from '@/constants/homeTheme';
import type { LibraryBook } from '@/types/book';
import { clampPercent, formatKoreanDateKey } from '@/utils/format';

type CurrentReadingCardProps = {
  book: LibraryBook;
};

export function CurrentReadingCard({ book }: CurrentReadingCardProps) {
  const { width } = useWindowDimensions();
  const narrow = width < 390;
  const coverWidth = narrow ? 88 : 100;
  const coverHeight = Math.round(coverWidth * 1.5);
  const hasProgress = book.totalPages > 0 && book.currentPage >= 0;
  const percent = hasProgress ? clampPercent(book.currentPage, book.totalPages) : null;
  const lastReadNote = book.lastReadAt ? `마지막 독서 ${formatKoreanDateKey(book.lastReadAt)}` : null;
  const meta = [book.author].filter(Boolean).join(' · ');

  return (
    <HomeCard>
      <HomeCardTitle
        title="지금 읽는 책"
        onPress={() => router.push(`/book/${book.userBookId}`)}
        accessibilityLabel="책 상세 보기"
      />

      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${book.title} 상세`}
          onPress={() => router.push(`/book/${book.userBookId}`)}
          style={({ pressed }) => [styles.coverWrap, pressed && styles.pressed]}
        >
          <ShelfBookCover
            id={book.userBookId}
            title={book.title}
            author={book.author}
            color={book.coverColor || book.spineColor}
            width={coverWidth}
            height={coverHeight}
            imageUrl={book.coverImageUrl}
          />
        </Pressable>

        <View style={styles.body}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${book.title} 상세`}
            onPress={() => router.push(`/book/${book.userBookId}`)}
            style={({ pressed }) => [styles.info, pressed && styles.pressed]}
          >
            <Text numberOfLines={2} style={styles.bookTitle}>
              {book.title}
            </Text>
            {meta ? (
              <Text numberOfLines={1} style={styles.meta}>
                {meta}
              </Text>
            ) : null}

            {percent !== null ? (
              <View style={styles.progressBlock}>
                <Text style={styles.percent}>{percent}%</Text>
                <ProgressBar
                  current={percent}
                  total={100}
                  height={6}
                  trackColor={homeTheme.progressTrack}
                  fillColor={homeTheme.primarySoft}
                />
              </View>
            ) : null}

            {lastReadNote ? (
              <View style={styles.noteRow}>
                <AppIcon name="timer" size={12} color={homeTheme.textSecondary} />
                <Text numberOfLines={1} style={styles.note}>
                  {lastReadNote}
                </Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="독서 기록하기"
            onPress={() =>
              router.push({ pathname: '/reading/session', params: { userBookId: book.userBookId } })
            }
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <AppIcon name="note" size={15} color={homeTheme.onPrimary} />
            <Text style={styles.ctaLabel}>독서 기록하기</Text>
            {!narrow ? <AppIcon name="chevronRight" size={14} color={homeTheme.onPrimary} /> : null}
          </Pressable>
        </View>
      </View>
    </HomeCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
  },
  pressed: {
    opacity: 0.92,
  },
  coverWrap: {
    shadowColor: homeTheme.shadow,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    gap: 10,
  },
  info: {
    gap: 6,
  },
  bookTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: homeTheme.text,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    color: homeTheme.textSecondary,
  },
  progressBlock: {
    gap: 4,
    marginTop: 2,
  },
  percent: {
    alignSelf: 'flex-end',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    color: homeTheme.primarySoft,
    fontVariant: ['tabular-nums'],
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  note: {
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
    color: homeTheme.textSecondary,
  },
  cta: {
    minHeight: 42,
    borderRadius: 20,
    backgroundColor: homeTheme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: homeTheme.onPrimary,
  },
});
