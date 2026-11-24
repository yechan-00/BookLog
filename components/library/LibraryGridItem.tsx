import { StyleSheet, Text, View } from 'react-native';

import { ShelfBookCover } from '@/components/books/ShelfBookCover';
import { AppIcon } from '@/components/common/AppIcon';
import { LibraryBookMenu } from '@/components/library/LibraryBookMenu';
import { homeTheme } from '@/constants/homeTheme';
import type { BookStatus, LibraryBook } from '@/types/book';
import { libraryProgressPercent } from '@/utils/libraryView';

type LibraryGridItemProps = {
  book: LibraryBook;
  width: number;
  onPress: (userBookId: string) => void;
  onChangeStatus?: (userBookId: string, next: Exclude<BookStatus, 'completed'>) => void;
  onComplete?: (userBookId: string) => void;
  statusBusy?: boolean;
};

export function LibraryGridItem({
  book,
  width,
  onPress,
  onChangeStatus,
  onComplete,
  statusBusy = false,
}: LibraryGridItemProps) {
  const thickness = Math.max(3, Math.round(width * 0.055));
  const coverWidth = Math.max(48, width - thickness);
  const coverHeight = Math.round(coverWidth * 1.5);
  const percent = libraryProgressPercent(book);

  return (
    <View style={{ width }}>
      <View style={[styles.coverFrame, styles.coverPress, { width, height: coverHeight }]}>
        <ShelfBookCover
          id={book.userBookId}
          title={book.title}
          author={book.author}
          color={book.coverColor || book.spineColor}
          width={coverWidth}
          height={coverHeight}
          imageUrl={book.coverImageUrl}
          onPress={() => onPress(book.userBookId)}
        />

        {percent !== null ? (
          <View style={styles.progressBadge} pointerEvents="none" accessibilityLabel={`진행률 ${percent}%`}>
            <Text style={styles.progressText}>{percent}%</Text>
          </View>
        ) : null}

        {book.status === 'completed' ? (
          <View style={styles.completedBadge} pointerEvents="none" accessibilityLabel="완독">
            <AppIcon name="checkmark" size={12} color={homeTheme.primary} />
            <Text style={styles.completedText}>완독</Text>
          </View>
        ) : null}

        {book.status === 'wishlist' ? (
          <View style={styles.wishlistBadge} pointerEvents="none" accessibilityLabel="읽고 싶음">
            <AppIcon name="bookmark" size={14} color={homeTheme.primary} />
          </View>
        ) : null}
      </View>

      <View style={styles.meta}>
        <View style={styles.titleRow}>
          <Text numberOfLines={2} style={styles.title}>
            {book.title}
          </Text>
          <LibraryBookMenu
            book={book}
            onOpenDetail={onPress}
            onChangeStatus={onChangeStatus}
            onComplete={onComplete}
            busy={statusBusy}
          />
        </View>
        <Text numberOfLines={1} style={styles.author}>
          {book.author}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  coverPress: {
    marginBottom: 8,
  },
  coverFrame: {
    overflow: 'hidden',
    position: 'relative',
  },
  progressBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: homeTheme.primary,
    backgroundColor: homeTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  progressText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    color: '#79543F',
    fontVariant: ['tabular-nums'],
  },
  completedBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    borderRadius: 999,
    backgroundColor: homeTheme.surface,
    borderWidth: 1,
    borderColor: '#E8DED4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  completedText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
    color: '#79543F',
  },
  wishlistBadge: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: homeTheme.surface,
    borderWidth: 1,
    borderColor: '#E8DED4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    minHeight: 54,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
  },
  title: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: homeTheme.text,
  },
  author: {
    fontSize: 11,
    lineHeight: 15,
    color: homeTheme.textSecondary,
    paddingRight: 24,
  },
});
