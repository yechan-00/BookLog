import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DUST_LEVEL_CUTS, DUST_LEVEL_LABELS } from '@/constants/dustPolicy';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { saveDustWipe } from '@/lib/api/dust';
import { dustLevel, dustReference, type DustLevel, type DustWipeStatus } from '@/utils/shelfDust';

type DustCardProps = {
  title: string;
  userBookId: string;
  today: string;
  lastReadOn: string | null;
  addedOn: string | null;
  lastWipedOn: string | null;
  onWiped?: (wipedOn: string) => void;
};

export function DustCard({
  title,
  userBookId,
  today,
  lastReadOn,
  addedOn,
  lastWipedOn,
  onWiped,
}: DustCardProps) {
  const dust = dustReference({ today, lastReadOn, addedOn, lastWipedOn });
  const level: DustLevel | null =
    dust.elapsedDays === null ? null : dustLevel(dust.elapsedDays, DUST_LEVEL_CUTS);
  const [wipe, setWipe] = useState<DustWipeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);

  const wipeDust = async () => {
    if (lock.current || level === null || level === 0) {
      return;
    }
    lock.current = true;
    setWipe('saving');
    setError(null);
    try {
      const saved = await saveDustWipe({ userBookId, dustLevel: level });
      setWipe('saved');
      onWiped?.(saved.wipedOn);
    } catch (caught) {
      setWipe('failed');
      setError(caught instanceof Error ? caught.message : '먼지털이를 저장하지 못했어요.');
    } finally {
      lock.current = false;
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>
        {dust.elapsedDays === null
          ? '마지막 독서일과 서재에 추가한 날이 없습니다.'
          : `기준일 ${dust.referenceOn} · ${dust.elapsedDays}일 경과 · ${DUST_LEVEL_LABELS[level ?? 0]}`}
      </Text>
      {(level ?? 0) > 0 ? (
        <Pressable
          accessibilityRole="button"
          disabled={wipe === 'saving'}
          onPress={() => {
            void wipeDust();
          }}
          style={styles.action}
        >
          <Text style={styles.actionLabel}>{wipe === 'saving' ? '저장 중…' : '먼지 털기'}</Text>
        </Pressable>
      ) : (
        <Text style={styles.note}>먼지가 없어요.</Text>
      )}
      {wipe === 'saved' ? <Text style={styles.note}>책이 다시 깨끗해졌어요.</Text> : null}
      {wipe === 'failed' ? (
        <Text style={styles.error}>{error ?? '먼지털이를 저장하지 못했습니다.'}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
  action: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.bodyStrong,
    color: colors.accent,
  },
});
