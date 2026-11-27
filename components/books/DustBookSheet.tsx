import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';

import { BookCover } from '@/components/books/BookCover';
import { DustOverlay } from '@/components/books/DustOverlay';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SheetModal } from '@/components/common/SheetModal';
import { colors } from '@/constants/colors';
import { DUST_LEVEL_LABELS } from '@/constants/dustPolicy';
import { spacing, typography } from '@/constants/theme';
import type { DustBookView } from '@/utils/bookshelfView';
import { formatKoreanDateKey } from '@/utils/format';
import type { DustLevel } from '@/utils/shelfDust';

type DustBookSheetProps = {
  book: DustBookView | null;
  busy: boolean;
  errorMessage: string | null;
  wipeSucceeded: boolean;
  onClose: () => void;
  onWipe: () => void;
  onOpenBook: () => void;
  onContinueReading: () => void;
};

export function DustBookSheet({
  book,
  busy,
  errorMessage,
  wipeSucceeded,
  onClose,
  onWipe,
  onOpenBook,
  onContinueReading,
}: DustBookSheetProps) {
  const [puff] = useState(() => new Animated.Value(0));
  const [dustFade] = useState(() => new Animated.Value(1));
  const level = (book?.dustLevel ?? 0) as DustLevel;
  const dusty = level > 0;
  // Keeps the last dusty level of this book so the dust can fade out after a wipe instead of vanishing.
  const bookId = book?.userBookId ?? null;
  const [overlay, setOverlay] = useState({ bookId, level });
  if (overlay.bookId !== bookId || (dusty && overlay.level !== level)) {
    setOverlay({ bookId, level });
  }

  useEffect(() => {
    if (!wipeSucceeded) {
      puff.setValue(0);
      dustFade.setValue(1);
      return;
    }
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) {
        return;
      }
      // The puff rises and fades away so the clean cover is left uncovered.
      const duration = reduce ? 1 : 600;
      Animated.parallel([
        Animated.timing(puff, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(dustFade, { toValue: 0, duration, useNativeDriver: true }),
      ]).start();
    });
    return () => {
      cancelled = true;
    };
  }, [wipeSucceeded, puff, dustFade]);

  return (
    <SheetModal visible={book !== null} title="책 상태" onClose={onClose}>
      {book ? (
        <View style={styles.body}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.meta}>{book.author || '저자 미상'}</Text>
          <Text style={styles.meta}>
            상태 · {statusLabel(book.status)}
            {book.lastReadOn ? ` · 마지막 독서 ${formatKoreanDateKey(book.lastReadOn)}` : ''}
          </Text>
          <Text style={styles.meta}>
            {book.elapsedDays === null
              ? '먼지 기준일을 확인할 수 없어요.'
              : book.elapsedDays === 0
                ? `오늘 손이 닿은 책이에요 · ${DUST_LEVEL_LABELS[level]}`
                : `${book.elapsedDays}일째 손이 가지 않았어요 · ${DUST_LEVEL_LABELS[level]}`}
          </Text>

          <View style={styles.dustPreview}>
            <View style={styles.previewCover}>
              <BookCover
                title={book.title}
                color={book.coverColor}
                imageUrl={book.coverImageUrl}
                width={PREVIEW_COVER_WIDTH}
              />
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: dustFade }]}>
                <DustOverlay level={overlay.level} />
              </Animated.View>
            </View>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.puff,
                {
                  opacity: puff.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.7, 0] }),
                  transform: [
                    {
                      translateY: puff.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }),
                    },
                  ],
                },
              ]}
            />
          </View>

          {wipeSucceeded && !dusty ? (
            <Text style={styles.success}>책이 다시 깨끗해졌어요.</Text>
          ) : null}
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          {dusty ? (
            <PrimaryButton label={busy ? '먼지 털는 중…' : '먼지털기'} onPress={onWipe} disabled={busy} />
          ) : (
            <Text style={styles.hint}>먼지가 없어요. 언제든 다시 펼쳐 보세요.</Text>
          )}

          <PrimaryButton
            label={book.status === 'reading' || book.status === 'paused' ? '이어 읽기' : '책 상세 보기'}
            variant="secondary"
            onPress={book.status === 'reading' || book.status === 'paused' ? onContinueReading : onOpenBook}
          />
          {book.status === 'reading' || book.status === 'paused' ? (
            <PrimaryButton label="책 상세 보기" variant="secondary" onPress={onOpenBook} />
          ) : null}
        </View>
      ) : null}
    </SheetModal>
  );
}

function statusLabel(status: DustBookView['status']): string {
  switch (status) {
    case 'reading':
      return '읽는 중';
    case 'paused':
      return '중단';
    case 'completed':
      return '완독';
    default:
      return '읽고 싶음';
  }
}

const PREVIEW_COVER_WIDTH = 76;

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  title: {
    ...typography.section,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dustPreview: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCover: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  puff: {
    position: 'absolute',
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(230, 222, 210, 0.8)',
  },
  success: {
    ...typography.bodyStrong,
    color: colors.positive,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
