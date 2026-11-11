import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ProgressBar } from '@/components/common/ProgressBar';
import { libraryTheme } from '@/constants/libraryTheme';
import { radius, spacing, typography } from '@/constants/theme';
import { formatDuration } from '@/utils/format';
import type { TodayGoalProgress } from '@/utils/readingSummary';

type TodayGoalCardProps = {
  goal: TodayGoalProgress;
};

export function TodayGoalCard({ goal }: TodayGoalCardProps) {
  if (goal.state === 'no_goal') {
    return (
      <View style={styles.card}>
        <Text style={styles.stateTitle}>나만의 독서 목표를 설정해 보세요.</Text>
        <Text style={styles.note}>오늘부터 작은 목표로 독서를 이어 갈 수 있어요.</Text>
        <PrimaryButton
          label="목표 설정하기"
          onPress={() => router.push('/settings')}
          primaryColor={libraryTheme.primaryBrown}
          primaryPressedColor={libraryTheme.darkBrown}
          onPrimaryColor={libraryTheme.onPrimary}
        />
      </View>
    );
  }

  if (goal.state === 'rest') {
    return (
      <View style={styles.card}>
        <Text style={styles.stateTitle}>오늘은 쉬는 날입니다</Text>
        <Text style={styles.note}>목표 요일이 아닙니다. 읽고 싶은 책은 언제든 이어 읽을 수 있어요.</Text>
      </View>
    );
  }

  if (goal.state === 'unknown' || goal.percent === null) {
    return (
      <View style={styles.card}>
        <Text style={styles.stateTitle}>목표 진행을 계산할 수 없습니다</Text>
        <Text style={styles.note}>목표량이나 페이지 기록이 없어 0으로 채우지 않았습니다.</Text>
      </View>
    );
  }

  const achieved = goal.state === 'achieved';
  const isTime = goal.goalType === 'time';
  const progressLabel = isTime
    ? `${formatDuration(goal.readSeconds)} / ${formatDuration(goal.targetSeconds ?? 0)}`
    : `${goal.readPages ?? 0} / ${goal.targetPages ?? 0}페이지`;
  const remainingLabel = isTime
    ? `목표까지 ${formatDuration(goal.remainingSeconds ?? 0)}`
    : `목표까지 ${goal.remainingPages ?? 0}페이지`;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{isTime ? '시간 목표' : '페이지 목표'}</Text>
      <Text style={styles.progressValue}>{progressLabel}</Text>
      <Text style={styles.percent}>{goal.percent}%</Text>
      <ProgressBar
        current={goal.percent}
        total={100}
        trackColor={libraryTheme.border}
        fillColor={libraryTheme.primaryBrown}
      />
      <Text style={[styles.note, achieved && styles.achieved]}>
        {achieved ? '오늘 목표를 채웠습니다. 독서는 계속할 수 있어요.' : remainingLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: libraryTheme.surface,
    borderColor: libraryTheme.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: libraryTheme.darkBrown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  eyebrow: {
    ...typography.caption,
    color: libraryTheme.secondaryBrown,
    fontWeight: '700',
  },
  stateTitle: {
    ...typography.bodyStrong,
    color: libraryTheme.darkBrown,
  },
  progressValue: {
    ...typography.title,
    color: libraryTheme.darkBrown,
  },
  percent: {
    ...typography.bodyStrong,
    color: libraryTheme.primaryBrown,
  },
  note: {
    ...typography.caption,
    color: libraryTheme.textSecondary,
  },
  achieved: {
    color: libraryTheme.success,
    fontWeight: '600',
  },
});
