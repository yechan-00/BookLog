import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ShelfBookCover } from '@/components/books/ShelfBookCover';
import { ProgressBar } from '@/components/common/ProgressBar';
import { LibraryBookMenu } from '@/components/library/LibraryBookMenu';
import { homeTheme } from '@/constants/homeTheme';
import type { BookStatus, LibraryBook } from '@/types/book';
import { bookStatusLabel } from '@/utils/book';
import { libraryProgressPercent } from '@/utils/libraryView';

type LibraryListItemProps = {
  book: LibraryBook;
  onPress: (userBookId: string) => void;
  onChangeStatus?: (userBookId: string, next: Exclude<BookStatus, 'completed'>) => void;
  onComplete?: (userBookId: string) => void;
  statusBusy?: boolean;
};

export function LibraryListItem({
  book,
  onPress,
  onChangeStatus,
  onComplete,
  statusBusy = false,
}: LibraryListItemProps) {
  const percent = libraryProgressPercent(book);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={book.title}
      onPress={() => onPress(book.userBookId)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ShelfBookCover
        id={book.userBookId}
        title={book.title}
        author={book.author}
        color={book.coverColor || book.spineColor}
        width={68}
        height={102}
        imageUrl={book.coverImageUrl}
        onPress={() => onPress(book.userBookId)}
      />
      <View style={styles.body}>
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
        <Text style={styles.status}>{bookStatusLabel[book.status]}</Text>
        {percent !== null ? (
          <View style={styles.progress}>
            <ProgressBar
              current={percent}
              total={100}
              height={6}
              trackColor={homeTheme.progressTrack}
              fillColor={homeTheme.progress}
            />
            <Text style={styles.progressLabel}>{percent}%</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DED4',
    backgroundColor: homeTheme.surface,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  pressed: {
    opacity: 0.92,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: homeTheme.text,
  },
  author: {
    fontSize: 12,
    lineHeight: 16,
    color: homeTheme.textSecondary,
  },
  status: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: '#79543F',
  },
  progress: {
    marginTop: 4,
    gap: 4,
  },
  progressLabel: {
    alignSelf: 'flex-end',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: '#79543F',
    fontVariant: ['tabular-nums'],
  },
});
