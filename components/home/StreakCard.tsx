import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { HomeCard, HomeCardTitle, homeTwinCardStyle } from '@/components/home/HomeCard';
import { homeTheme } from '@/constants/homeTheme';
import type { WeekDayDuration } from '@/utils/homeWeekStats';
import type { ReadingStreak } from '@/utils/readingStreak';

type StreakCardProps = {
  streak: ReadingStreak;
  weekDays?: readonly WeekDayDuration[];
};

export function StreakCard({ streak, weekDays }: StreakCardProps) {
  const hasStreak = streak.days > 0;
  const showDots = Boolean(weekDays && weekDays.some((day) => !day.isFuture && day.durationSeconds > 0));

  return (
    <HomeCard style={homeTwinCardStyle}>
      <HomeCardTitle title="연속 독서" />

      <View style={styles.hero}>
        <View style={styles.flameWrap}>
          <AppIcon name="streak" size={24} color={homeTheme.flame} />
        </View>
        {hasStreak ? (
          <View style={styles.heroCopy}>
            <Text style={styles.daysLine} numberOfLines={1}>
              <Text style={styles.daysNumber}>{streak.days}</Text>
              <Text style={styles.daysUnit}>일 연속</Text>
            </Text>
            <Text style={styles.cheer} numberOfLines={1}>
              멋져요!
            </Text>
          </View>
        ) : (
          <View style={styles.heroCopy}>
            <Text style={styles.emptyTitle} numberOfLines={2}>
              첫 독서를 시작해요
            </Text>
            <Text style={styles.cheer} numberOfLines={1}>
              오늘부터 시작해요
            </Text>
          </View>
        )}
      </View>

      {showDots && weekDays ? (
        <View style={styles.dots} accessibilityLabel="이번 주 독서 표시">
          {weekDays.map((day) => {
            const filled = !day.isFuture && day.durationSeconds > 0;
            return (
              <View
                key={day.dateKey}
                style={[styles.dot, filled ? styles.dotFilled : styles.dotEmpty, day.isToday && styles.dotToday]}
              />
            );
          })}
        </View>
      ) : null}

      <View style={styles.messageBox}>
        <Text style={styles.message} numberOfLines={1}>
          {hasStreak ? '꾸준함이 습관을 만들어요.' : '오늘도 한 페이지씩.'}
        </Text>
      </View>
    </HomeCard>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flameWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: homeTheme.softFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  daysLine: {
    color: homeTheme.text,
  },
  daysNumber: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  daysUnit: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: homeTheme.text,
  },
  cheer: {
    fontSize: 12,
    lineHeight: 16,
    color: homeTheme.textSecondary,
  },
  dots: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotFilled: {
    backgroundColor: homeTheme.primarySoft,
  },
  dotEmpty: {
    backgroundColor: homeTheme.progressTrack,
  },
  dotToday: {
    borderWidth: 1,
    borderColor: homeTheme.accentLine,
  },
  messageBox: {
    marginTop: 12,
    backgroundColor: homeTheme.softFill,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
    color: homeTheme.textSecondary,
  },
});
