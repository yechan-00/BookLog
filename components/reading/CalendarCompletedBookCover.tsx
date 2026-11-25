import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { colors } from '@/constants/colors';
import type { CalendarCompletedBook } from '@/utils/calendarCompletions';

type CalendarCompletedBookCoverProps = {
  book: CalendarCompletedBook;
  width: number;
  height: number;
  extraCount?: number;
};

export function CalendarCompletedBookCover({
  book,
  width,
  height,
  extraCount = 0,
}: CalendarCompletedBookCoverProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(book.coverImageUrl) && !failed;

  return (
    <View style={[styles.wrap, { width, height }]}>
      <View
        style={[
          styles.cover,
          {
            width,
            height,
            backgroundColor: showImage ? colors.surfaceMuted : book.coverColor || colors.surfaceMuted,
          },
        ]}
      >
        {showImage ? (
          <Image
            source={{ uri: book.coverImageUrl }}
            style={styles.image}
            onError={() => setFailed(true)}
          />
        ) : (
          <AppIcon name="bookClosed" color={colors.textMuted} size={Math.max(12, Math.round(width * 0.45))} />
        )}
      </View>
      {extraCount > 0 ? (
        <View style={styles.badge} accessibilityElementsHidden>
          <Text style={styles.badgeText}>+{extraCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  cover: {
    borderRadius: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  badge: {
    position: 'absolute',
    right: -4,
    bottom: -3,
    minWidth: 16,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.onAccent,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
});
