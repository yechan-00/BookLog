import { router } from 'expo-router';
import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { CircularProgress } from '@/components/home/CircularProgress';
import { HomeCard, HomeCardTitle, homeTwinCardStyle } from '@/components/home/HomeCard';
import { homeTheme } from '@/constants/homeTheme';
import type { TodayGoalProgress } from '@/utils/readingSummary';

type TodayGoalCardProps = {
  goal: TodayGoalProgress;
};

function formatMinuteLabel(seconds: number): string {
  return `${Math.max(0, Math.round(seconds / 60))}분`;
}

function ringSizeForWidth(innerWidth: number): number {
  if (innerWidth <= 0) {
    return 104;
  }
  const sized = Math.round(innerWidth * 0.72);
  return Math.min(128, Math.max(96, sized));
}

export function TodayGoalCard({ goal }: TodayGoalCardProps) {
  const [innerWidth, setInnerWidth] = useState(0);
  const ringSize = ringSizeForWidth(innerWidth);
  const strokeWidth = ringSize >= 116 ? 11 : 10;

  const onBodyLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0 && next !== innerWidth) {
      setInnerWidth(next);
    }
  };

  if (goal.state === 'no_goal') {
    return (
      <HomeCard style={homeTwinCardStyle}>
        <HomeCardTitle title="오늘의 목표" onPress={() => router.push('/settings')} />
        <View style={styles.body} onLayout={onBodyLayout}>
          <CircularProgress percent={0} size={ringSize} strokeWidth={strokeWidth} color={homeTheme.progressTrack}>
            <Text style={styles.emptyRingLabel}>목표</Text>
            <Text style={styles.emptyRingSub}>없음</Text>
          </CircularProgress>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
          >
            <Text style={styles.linkLabel}>목표 설정</Text>
          </Pressable>
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

  const isTime = goal.goalType === 'time';
  const readLabel = isTime ? formatMinuteLabel(goal.readSeconds) : `${goal.readPages ?? 0}쪽`;
  const targetLabel = isTime
    ? `/ ${formatMinuteLabel(goal.targetSeconds ?? 0)}`
    : `/ ${goal.targetPages ?? 0}쪽`;
  const longValue = readLabel.length >= 5 || targetLabel.length >= 7;
  const readFontSize = longValue ? (ringSize < 104 ? 18 : 20) : ringSize < 104 ? 20 : 22;
  const targetFontSize = longValue ? 11 : 13;

  return (
    <HomeCard style={homeTwinCardStyle}>
      <HomeCardTitle title="오늘의 목표" onPress={() => router.push('/settings')} />
      <View style={styles.body} onLayout={onBodyLayout}>
        <CircularProgress percent={goal.percent} size={ringSize} strokeWidth={strokeWidth}>
          <Text
            style={[styles.readValue, { fontSize: readFontSize, lineHeight: readFontSize + 4 }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.15}
          >
            {readLabel}
          </Text>
          <Text
            style={[styles.targetValue, { fontSize: targetFontSize, lineHeight: targetFontSize + 3 }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.15}
          >
            {targetLabel}
          </Text>
        </CircularProgress>
      </View>
    </HomeCard>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  readValue: {
    fontWeight: '700',
    color: homeTheme.text,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  targetValue: {
    fontWeight: '500',
    color: homeTheme.textSecondary,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
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
