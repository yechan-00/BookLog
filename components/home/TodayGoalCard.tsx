import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { CircularProgress } from '@/components/home/CircularProgress';
import { HomeCard, HomeCardTitle, homeTwinCardStyle } from '@/components/home/HomeCard';
import { homeTheme } from '@/constants/homeTheme';
import { formatDuration } from '@/utils/format';
import type { TodayGoalProgress } from '@/utils/readingSummary';

type TodayGoalCardProps = {
  goal: TodayGoalProgress;
};

function formatMinuteLabel(seconds: number): string {
  return `${Math.max(0, Math.round(seconds / 60))}분`;
}

export function TodayGoalCard({ goal }: TodayGoalCardProps) {
  const { width } = useWindowDimensions();
  const ringSize = width < 390 ? 82 : 92;

  if (goal.state === 'no_goal') {
    return (
      <HomeCard style={homeTwinCardStyle}>
        <HomeCardTitle title="오늘의 목표" onPress={() => router.push('/settings')} />
        <View style={styles.body}>
          <CircularProgress percent={0} size={ringSize} strokeWidth={9} color={homeTheme.progressTrack}>
            <Text style={styles.emptyRingLabel}>목표</Text>
            <Text style={styles.emptyRingSub}>없음</Text>
          </CircularProgress>
          <View style={styles.copyCol}>
            <Text style={styles.stateTitle} numberOfLines={2}>
              목표를 설정해 보세요.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
            >
              <Text style={styles.linkLabel}>목표 설정</Text>
            </Pressable>
          </View>
        </View>
      </HomeCard>
    );
  }

  if (goal.state === 'rest') {
    return (
      <HomeCard style={homeTwinCardStyle}>
        <HomeCardTitle title="오늘의 목표" />
        <Text style={styles.stateTitle} numberOfLines={2}>
          오늘은 쉬는 날이에요.
        </Text>
        <Text style={styles.caption} numberOfLines={2}>
          읽고 싶을 때 이어 읽을 수 있어요.
        </Text>
      </HomeCard>
    );
  }

  if (goal.state === 'unknown' || goal.percent === null) {
    return (
      <HomeCard style={homeTwinCardStyle}>
        <HomeCardTitle title="오늘의 목표" />
        <Text style={styles.stateTitle} numberOfLines={2}>
          진행률을 계산할 수 없어요.
        </Text>
        <Text style={styles.caption} numberOfLines={2}>
          목표량이나 기록이 부족합니다.
        </Text>
      </HomeCard>
    );
  }

  const achieved = goal.state === 'achieved';
  const isTime = goal.goalType === 'time';
  const readLabel = isTime ? formatMinuteLabel(goal.readSeconds) : `${goal.readPages ?? 0}쪽`;
  const targetLabel = isTime
    ? `/ ${formatMinuteLabel(goal.targetSeconds ?? 0)}`
    : `/ ${goal.targetPages ?? 0}쪽`;
  const encouragement = achieved ? '오늘 목표를\n채웠어요.' : '오늘도 꾸준히\n읽고 있어요.';
  const footer = isTime
    ? `하루 ${formatDuration(goal.targetSeconds ?? 0)}`
    : `하루 ${goal.targetPages ?? 0}쪽`;

  return (
    <HomeCard style={homeTwinCardStyle}>
      <HomeCardTitle title="오늘의 목표" onPress={() => router.push('/settings')} />
      <View style={styles.body}>
        <CircularProgress percent={goal.percent} size={ringSize} strokeWidth={10}>
          <Text style={styles.readValue}>{readLabel}</Text>
          <Text style={styles.targetValue}>{targetLabel}</Text>
        </CircularProgress>
        <View style={styles.copyCol}>
          <Text style={styles.encouragement}>{encouragement}</Text>
          <View style={styles.footer}>
            <AppIcon name="bookOpen" size={13} color={homeTheme.textSecondary} />
            <Text style={styles.footerText} numberOfLines={1}>
              {footer}
            </Text>
          </View>
        </View>
      </View>
    </HomeCard>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  readValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: homeTheme.text,
    fontVariant: ['tabular-nums'],
  },
  targetValue: {
    fontSize: 12,
    lineHeight: 15,
    color: homeTheme.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  emptyRingLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: homeTheme.textSecondary,
  },
  emptyRingSub: {
    fontSize: 11,
    lineHeight: 14,
    color: homeTheme.textSecondary,
  },
  encouragement: {
    fontSize: 13,
    lineHeight: 18,
    color: homeTheme.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    color: homeTheme.textSecondary,
  },
  stateTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: homeTheme.text,
  },
  caption: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: homeTheme.textSecondary,
  },
  linkButton: {
    minHeight: 28,
    justifyContent: 'center',
  },
  linkLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: homeTheme.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
