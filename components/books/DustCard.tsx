import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { dustReference, dustWipeStatus, type DustWipeStatus } from '@/utils/shelfDust';

type DustCardProps = {
  title: string;
  today: string;
  lastReadOn: string | null;
  addedOn: string | null;
  lastWipedOn: string | null;
};

export function DustCard({ title, today, lastReadOn, addedOn, lastWipedOn }: DustCardProps) {
  const dust = dustReference({ today, lastReadOn, addedOn, lastWipedOn });
  const [wipe, setWipe] = useState<DustWipeStatus>('idle');

  const wipeDust = () => {
    setWipe(dustWipeStatus(false));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>
        {dust.elapsedDays === null
          ? '마지막 독서일과 서재에 추가한 날이 없습니다.'
          : `기준일 ${dust.referenceOn} · ${dust.elapsedDays}일 경과`}
      </Text>
      <Text style={styles.note}>먼지 단계 기준일이 정해지지 않아 0~3단계를 표시하지 않습니다.</Text>
      <Pressable accessibilityRole="button" onPress={wipeDust} style={styles.action}>
        <Text style={styles.actionLabel}>먼지 털기</Text>
      </Pressable>
      {wipe === 'failed' ? (
        <Text style={styles.note}>먼지털이를 저장하지 않았습니다. 저장 API가 없고, 독서 기록은 바꾸지 않습니다.</Text>
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
