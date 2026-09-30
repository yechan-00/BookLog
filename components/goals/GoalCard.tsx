import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/common/ProgressBar';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';

type GoalCardProps = {
  title: string;
  current: number;
  target: number;
  unit: string;
  achieved: boolean;
};

export function GoalCard({ title, current, target, unit, achieved }: GoalCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.progressText}>
        {current}
        {unit} / {target}
        {unit}
      </Text>
      <ProgressBar current={current} total={target} />
      <Text style={[styles.status, achieved && styles.achieved]}>
        {achieved ? '오늘 목표를 채웠어요' : '아직 조금 남아 있어요'}
      </Text>
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
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  status: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  achieved: {
    color: colors.positive,
  },
});
