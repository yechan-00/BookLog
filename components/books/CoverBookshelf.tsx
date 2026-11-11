import { useState, type ReactNode } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { ShelfBookCover } from '@/components/books/ShelfBookCover';
import { libraryTheme } from '@/constants/libraryTheme';
import { spacing } from '@/constants/theme';
import { spinePaletteColorFor, stableHash } from '@/utils/spineStyle';

export type CoverShelfBook = {
  id: string;
  bookId: string;
  title: string;
  author: string;
  color?: string;
  imageUrl?: string | null;
  totalPages?: number | null;
};

type CoverBookshelfProps = {
  books: CoverShelfBook[];
  onPressBook: (bookId: string) => void;
};

const GAP = 10;
const SIDE_PAD = 6;
const FALLBACK_WIDTH = 320;

function booksPerShelf(availableWidth: number): number {
  if (availableWidth < 320) {
    return 3;
  }
  if (availableWidth < 390) {
    return 4;
  }
  return 5;
}

function coverSize(availableWidth: number): { width: number; baseHeight: number; perShelf: number } {
  const usable = Math.max(availableWidth - SIDE_PAD * 2, 180);
  const perShelf = booksPerShelf(usable);
  const width = Math.floor((usable - GAP * (perShelf - 1)) / perShelf);
  return {
    width: Math.max(56, width),
    baseHeight: Math.round(Math.max(56, width) * 1.5),
    perShelf,
  };
}

function packRows(books: CoverShelfBook[], perShelf: number): CoverShelfBook[][] {
  if (books.length === 0) {
    return [];
  }

  const rows: CoverShelfBook[][] = [];
  for (let index = 0; index < books.length; index += perShelf) {
    rows.push(books.slice(index, index + perShelf));
  }
  return rows;
}

function heightForBook(book: CoverShelfBook, baseHeight: number): number {
  const variance = stableHash(book.id) % 17;
  return baseHeight - 8 + variance;
}

function colorForBook(book: CoverShelfBook): string {
  return book.color?.trim() || spinePaletteColorFor(book.id);
}

export function CoverBookshelf({ books, onPressBook }: CoverBookshelfProps) {
  const [shelfWidth, setShelfWidth] = useState(FALLBACK_WIDTH);
  const { width, baseHeight, perShelf } = coverSize(shelfWidth);
  const rows = packRows(books, perShelf);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0 && next !== shelfWidth) {
      setShelfWidth(next);
    }
  };

  return (
    <View style={styles.unit} onLayout={onLayout}>
      {rows.length === 0 ? (
        <ShelfBoard>
          <View style={[styles.row, { minHeight: baseHeight }]} />
        </ShelfBoard>
      ) : (
        rows.map((row, index) => (
          <ShelfBoard key={`cover-shelf-${index}`}>
            <View style={[styles.row, { minHeight: baseHeight + 8 }]}>
              {row.map((book) => (
                <ShelfBookCover
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  author={book.author}
                  color={colorForBook(book)}
                  width={width}
                  height={heightForBook(book, baseHeight)}
                  imageUrl={book.imageUrl}
                  onPress={() => onPressBook(book.bookId)}
                />
              ))}
            </View>
          </ShelfBoard>
        ))
      )}
    </View>
  );
}

function ShelfBoard({ children }: { children: ReactNode }) {
  return (
    <View style={styles.shelf}>
      <View style={styles.bay}>{children}</View>
      <View style={styles.board}>
        <View style={styles.boardTop} />
        <View style={styles.boardFront} />
      </View>
      <View style={styles.boardShadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  unit: {
    gap: spacing.lg,
  },
  shelf: {
    gap: 0,
  },
  bay: {
    paddingHorizontal: SIDE_PAD,
    paddingTop: spacing.sm,
    justifyContent: 'flex-end',
    backgroundColor: libraryTheme.bayShade,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'flex-end',
    gap: GAP,
  },
  board: {
    height: 18,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: libraryTheme.wood,
  },
  boardTop: {
    height: 5,
    backgroundColor: libraryTheme.woodLight,
    opacity: 0.55,
  },
  boardFront: {
    flex: 1,
    borderBottomWidth: 3,
    borderBottomColor: libraryTheme.woodDark,
  },
  boardShadow: {
    height: 8,
    marginHorizontal: 10,
    marginTop: -2,
    borderRadius: 8,
    backgroundColor: libraryTheme.woodDark,
    opacity: 0.18,
  },
});
