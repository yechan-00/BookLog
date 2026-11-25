import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppIcon } from '@/components/common/AppIcon';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { SheetModal } from '@/components/common/SheetModal';
import { CircularProgress } from '@/components/home/CircularProgress';
import { ReadingTrendChart } from '@/components/insights/ReadingTrendChart';
import { ReaderCard } from '@/components/reader/ReaderCard';
import { readerLayout, readerRadius, readerSpace, readerTheme } from '@/constants/readerTheme';
import { useFocusData } from '@/hooks/useFocusData';
import { startOfToday, toDateKey } from '@/utils/date';
import {
  achievementMessage,
  completedBooksInRange,
  formatLongDuration,
  insightDashboard,
  weekAchievedLabel,
  type InsightRangeDays,
} from '@/utils/insightDashboard';
import { loadLibraryBooks, loadReadingHistory } from '@/utils/readingSource';

type DetailKind = 'achievement' | 'streak' | 'summary' | null;
type TrendMetric = 'time' | 'pages';

export default function InsightsScreen() {
  const { width } = useWindowDimensions();
  const layout = readerLayout(width);
  const todayKey = toDateKey(startOfToday());
  const [dayCount, setDayCount] = useState<InsightRangeDays>(30);
  const [metric, setMetric] = useState<TrendMetric>('time');
  const [detail, setDetail] = useState<DetailKind>(null);
  const [rangeOpen, setRangeOpen] = useState(false);

  const loadHistory = useCallback(() => loadReadingHistory(), []);
  const loadBooks = useCallback(() => loadLibraryBooks(), []);
  const historySource = useFocusData(loadHistory);
  const booksSource = useFocusData(loadBooks);

  const dashboard =
    historySource.status === 'ready'
      ? insightDashboard(todayKey, dayCount, historySource.data)
      : null;
  const completedCount =
    booksSource.status === 'ready'
      ? completedBooksInRange(todayKey, dayCount, booksSource.data)
      : null;

  const periodLabel = `최근 ${dayCount}일`;
  const chartHeight = layout.compact ? 155 : layout.roomy ? 190 : 172;

  const trendBadge = useMemo(() => {
    if (!dashboard || dashboard.rateDeltaPoints === null) {
      return { text: '비교할 기록이 부족해요', tone: 'neutral' as const };
    }
    if (dashboard.rateDeltaPoints > 0) {
      return { text: `지난 기간보다 ${dashboard.rateDeltaPoints}%p 높아요`, tone: 'up' as const };
    }
    if (dashboard.rateDeltaPoints < 0) {
      return {
        text: `지난 기간보다 ${Math.abs(dashboard.rateDeltaPoints)}%p 낮아요`,
        tone: 'down' as const,
      };
    }
    return { text: '지난 기간과 같아요', tone: 'neutral' as const };
  }, [dashboard]);

  return (
    <Screen
      topInset
      backgroundColor={readerTheme.background}
      contentContainerStyle={[styles.content, { paddingHorizontal: layout.pad }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>인사이트</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`기간 ${periodLabel}`}
          onPress={() => setRangeOpen(true)}
          style={({ pressed }) => [styles.rangeButton, pressed && styles.pressed]}
        >
          <Text style={styles.rangeLabel}>{periodLabel}</Text>
          <AppIcon name="chevronDown" size={14} color={readerTheme.primary} />
        </Pressable>
      </View>

      {historySource.status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator color={readerTheme.primary} />
          <Text style={styles.note}>인사이트를 불러오는 중이에요.</Text>
        </View>
      ) : null}

      {historySource.status === 'error' ? (
        <ReaderCard padding={layout.cardPad}>
          <Text style={styles.cardTitle}>인사이트를 불러오지 못했어요</Text>
          <Text style={styles.note}>{historySource.message}</Text>
          <PrimaryButton label="다시 시도" onPress={historySource.reload} primaryColor={readerTheme.primary} />
        </ReaderCard>
      ) : null}

      {dashboard ? (
        <>
          <ReaderCard padding={layout.cardPad}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{periodLabel} 달성률</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDetail('achievement')}
                style={styles.detailLink}
              >
                <Text style={styles.detailText}>자세히 보기</Text>
                <AppIcon name="chevronRight" size={12} color={readerTheme.primarySoft} />
              </Pressable>
            </View>

            <View style={[styles.achievementBody, layout.compact && styles.achievementStacked]}>
              <CircularProgress
                percent={dashboard.achievement.rate ?? 0}
                size={layout.insightRing}
                strokeWidth={14}
                color={readerTheme.primary}
                trackColor={readerTheme.progressTrack}
                holeColor={readerTheme.surface}
              >
                <Text style={styles.rateValue}>
                  {dashboard.achievement.rate === null ? '—' : `${dashboard.achievement.rate}%`}
                </Text>
                <Text style={styles.rateCaption}>목표 달성률</Text>
              </CircularProgress>

              <View style={styles.achievementSide}>
                <View
                  style={[
                    styles.trendPill,
                    trendBadge.tone === 'down' && styles.trendDown,
                    trendBadge.tone === 'neutral' && styles.trendNeutral,
                  ]}
                >
                  <AppIcon
                    name={trendBadge.tone === 'down' ? 'trendDown' : 'trendUp'}
                    size={12}
                    color={readerTheme.primary}
                  />
                  <Text style={styles.trendText}>{trendBadge.text}</Text>
                </View>
                <Text style={styles.quote}>
                  “{achievementMessage(dashboard.achievement.rate, dashboard.period.readingDayCount > 0)}”
                </Text>
                <Text style={styles.weekLabel}>주간 달성 현황</Text>
                <Text style={styles.weekCount}>{weekAchievedLabel(dashboard.week)}</Text>
                <View style={styles.weekDots}>
                  {dashboard.week.days.map((day) => (
                    <View
                      key={day.dateKey}
                      style={[
                        styles.weekDot,
                        (day.achievement === 'achieved' || day.achievement === 'exceeded') &&
                          styles.weekDotOn,
                        day.achievement === 'missed' && styles.weekDotMissed,
                      ]}
                      accessibilityLabel={`${day.label} ${day.achievement}`}
                    />
                  ))}
                </View>
                <View style={styles.weekLabels}>
                  {dashboard.week.days.map((day) => (
                    <Text key={day.dateKey} style={styles.weekDay}>
                      {day.label}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </ReaderCard>

          <ReaderCard padding={layout.cardPad}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>연속 목표 달성일</Text>
              <Pressable accessibilityRole="button" onPress={() => setDetail('streak')} style={styles.detailLink}>
                <Text style={styles.detailText}>자세히 보기</Text>
                <AppIcon name="chevronRight" size={12} color={readerTheme.primarySoft} />
              </Pressable>
            </View>
            <View style={[styles.streakRow, layout.compact && styles.streakStacked]}>
              <View style={styles.streakMain}>
                <View style={styles.iconBubble}>
                  <AppIcon name="bookOpen" size={18} color={readerTheme.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.streakValue}>{dashboard.streak.days}일 연속</Text>
                  <Text style={styles.note}>목표 요일 기준 · 지금도 좋은 습관이 이어지고 있어요.</Text>
                </View>
              </View>
              <View style={styles.bestBox}>
                <View style={styles.bestRow}>
                  <AppIcon name="crown" size={14} color={readerTheme.warning} />
                  <Text style={styles.bestValue}>{dashboard.bestStreak.days}일</Text>
                </View>
                <Text style={styles.bestLabel}>최고 기록</Text>
              </View>
            </View>

            <Text style={[styles.weekLabel, { marginTop: 16 }]}>최근 7일 독서 현황</Text>
            <View style={styles.recentRow}>
              {dashboard.recentDays.map((day) => (
                <View key={day.dateKey} style={styles.recentItem}>
                  <View
                    style={[
                      styles.recentBubble,
                      day.hasReading && styles.recentBubbleOn,
                      day.isToday && styles.recentToday,
                    ]}
                    accessibilityLabel={day.hasReading ? '독서함' : '독서 없음'}
                  >
                    {day.hasReading ? (
                      <AppIcon name="bookOpen" size={14} color={readerTheme.onPrimary} />
                    ) : (
                      <View style={styles.recentEmpty} />
                    )}
                  </View>
                  <Text style={styles.recentDate}>{day.monthDay}</Text>
                  <Text style={styles.recentWeekday}>{day.weekday}</Text>
                </View>
              ))}
            </View>
          </ReaderCard>

          <ReaderCard padding={layout.cardPad}>
            <View style={[styles.cardHeader, layout.compact && styles.trendHeaderStacked]}>
              <Text style={styles.cardTitle}>기간별 독서 추이</Text>
              <View style={styles.metricSegment}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: metric === 'time' }}
                  onPress={() => setMetric('time')}
                  style={[styles.metricItem, metric === 'time' && styles.metricItemOn]}
                >
                  <Text style={[styles.metricText, metric === 'time' && styles.metricTextOn]}>독서 시간</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: metric === 'pages' }}
                  onPress={() => setMetric('pages')}
                  style={[styles.metricItem, metric === 'pages' && styles.metricItemOn]}
                >
                  <Text style={[styles.metricText, metric === 'pages' && styles.metricTextOn]}>읽은 페이지</Text>
                </Pressable>
              </View>
            </View>
            {dashboard.period.readingDayCount === 0 ? (
              <Text style={styles.note}>이 기간의 독서 기록이 없습니다.</Text>
            ) : (
              <ReadingTrendChart days={dashboard.period.days} metric={metric} height={chartHeight} />
            )}
          </ReaderCard>

          <ReaderCard padding={layout.cardPad}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{periodLabel} 독서 기록</Text>
              <Pressable accessibilityRole="button" onPress={() => setDetail('summary')} style={styles.detailLink}>
                <Text style={styles.detailText}>자세히 보기</Text>
                <AppIcon name="chevronRight" size={12} color={readerTheme.primarySoft} />
              </Pressable>
            </View>
            <View style={[styles.summaryRow, layout.compact && styles.summaryStacked]}>
              <SummaryStat
                icon="clock"
                label="총 독서 시간"
                value={formatLongDuration(dashboard.period.totalDurationSeconds)}
              />
              <View style={styles.summaryDivider} />
              <SummaryStat
                icon="bookOpen"
                label="읽은 페이지"
                value={
                  dashboard.period.totalPages === null ? '집계 불가' : `${dashboard.period.totalPages}p`
                }
              />
              <View style={styles.summaryDivider} />
              <SummaryStat
                icon="books"
                label="완독"
                value={
                  booksSource.status === 'error'
                    ? '조회 실패'
                    : completedCount === null
                      ? '—'
                      : `${completedCount}권`
                }
              />
            </View>
          </ReaderCard>
        </>
      ) : null}

      <SheetModal visible={rangeOpen} title="기간 선택" onClose={() => setRangeOpen(false)}>
        {([7, 30] as const).map((range) => (
          <Pressable
            key={range}
            accessibilityRole="button"
            onPress={() => {
              setDayCount(range);
              setRangeOpen(false);
            }}
            style={styles.sheetOption}
          >
            <Text style={styles.sheetOptionText}>최근 {range}일</Text>
          </Pressable>
        ))}
      </SheetModal>

      <SheetModal
        visible={detail !== null}
        title={
          detail === 'achievement'
            ? '달성률 자세히'
            : detail === 'streak'
              ? '연속 목표 달성일 자세히'
              : '독서 기록 자세히'
        }
        onClose={() => setDetail(null)}
      >
        {dashboard && detail === 'achievement' ? (
          <View style={styles.detailBody}>
            <DetailLine label="집계 기간" value={periodLabel} />
            <DetailLine label="목표 적용 일수" value={`${dashboard.achievement.scheduledCount}일`} />
            <DetailLine label="달성" value={`${dashboard.achievement.achievedCount}일`} />
            <DetailLine
              label="미달성"
              value={`${Math.max(0, dashboard.achievement.decidedCount - dashboard.achievement.achievedCount)}일`}
            />
            <DetailLine
              label="달성률"
              value={dashboard.achievement.rate === null ? '—' : `${dashboard.achievement.rate}%`}
            />
            <DetailLine
              label="직전 기간 대비"
              value={
                dashboard.rateDeltaPoints === null
                  ? '비교 불가'
                  : `${dashboard.rateDeltaPoints > 0 ? '+' : ''}${dashboard.rateDeltaPoints}%p`
              }
            />
          </View>
        ) : null}
        {dashboard && detail === 'streak' ? (
          <View style={styles.detailBody}>
            <DetailLine label="현재 연속" value={`${dashboard.streak.days}일`} />
            <DetailLine label="최고 기록" value={`${dashboard.bestStreak.days}일`} />
            <DetailLine label="계산 기준" value="목표 요일 달성일" />
            <Text style={styles.note}>목표 적용이 아닌 날과 미래 날짜는 연속 계산에서 건너뜁니다.</Text>
          </View>
        ) : null}
        {dashboard && detail === 'summary' ? (
          <View style={styles.detailBody}>
            <DetailLine label="총 독서 시간" value={formatLongDuration(dashboard.period.totalDurationSeconds)} />
            <DetailLine label="독서한 날" value={`${dashboard.period.readingDayCount}일`} />
            <DetailLine
              label="하루 평균(기간 기준)"
              value={formatLongDuration(dashboard.period.averageDurationSeconds)}
            />
            <DetailLine
              label="읽은 페이지"
              value={dashboard.period.totalPages === null ? '집계 불가' : `${dashboard.period.totalPages}p`}
            />
            <DetailLine
              label="완독"
              value={completedCount === null ? '—' : `${completedCount}권`}
            />
          </View>
        ) : null}
      </SheetModal>
    </Screen>
  );
}

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: 'clock' | 'bookOpen' | 'books';
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <View style={styles.iconBubble}>
        <AppIcon name={icon} size={16} color={readerTheme.primary} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: readerSpace.md,
    paddingBottom: 28,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: readerTheme.text,
  },
  rangeButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  rangeLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: readerTheme.primary,
  },
  loading: {
    gap: 10,
    paddingVertical: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  trendHeaderStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  cardTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: readerTheme.text,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
  },
  detailText: {
    fontSize: 13,
    color: readerTheme.primarySoft,
    fontWeight: '600',
  },
  achievementBody: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  achievementStacked: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  achievementSide: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  rateValue: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: readerTheme.text,
    fontVariant: ['tabular-nums'],
  },
  rateCaption: {
    fontSize: 12,
    lineHeight: 16,
    color: readerTheme.textMuted,
    textAlign: 'center',
  },
  trendPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: readerTheme.trendUpBg,
    borderRadius: readerRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trendDown: {
    backgroundColor: '#F3E4E1',
  },
  trendNeutral: {
    backgroundColor: readerTheme.soft,
  },
  trendText: {
    fontSize: 12,
    lineHeight: 16,
    color: readerTheme.primary,
    fontWeight: '600',
  },
  quote: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    color: readerTheme.textSecondary,
  },
  weekLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: readerTheme.text,
  },
  weekCount: {
    fontSize: 13,
    lineHeight: 18,
    color: readerTheme.textSecondary,
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 4,
  },
  weekDot: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: readerTheme.progressTrack,
  },
  weekDotOn: {
    backgroundColor: readerTheme.primary,
  },
  weekDotMissed: {
    backgroundColor: '#D9C9BA',
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: readerTheme.textMuted,
  },
  streakRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  streakStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  streakMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: readerTheme.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: readerTheme.text,
    fontVariant: ['tabular-nums'],
  },
  bestBox: {
    borderRadius: 14,
    backgroundColor: readerTheme.soft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 96,
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bestValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: readerTheme.text,
    fontVariant: ['tabular-nums'],
  },
  bestLabel: {
    marginTop: 2,
    fontSize: 12,
    color: readerTheme.textSecondary,
  },
  recentRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  recentItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  recentBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: readerTheme.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentBubbleOn: {
    backgroundColor: readerTheme.primary,
  },
  recentEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: readerTheme.border,
  },
  recentToday: {
    borderWidth: 1.5,
    borderColor: readerTheme.primary,
  },
  recentDate: {
    fontSize: 11,
    color: readerTheme.text,
    fontWeight: '600',
  },
  recentWeekday: {
    fontSize: 10,
    color: readerTheme.textMuted,
  },
  metricSegment: {
    flexDirection: 'row',
    backgroundColor: readerTheme.soft,
    borderRadius: readerRadius.pill,
    padding: 3,
  },
  metricItem: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: readerRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricItemOn: {
    backgroundColor: readerTheme.primary,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: readerTheme.textSecondary,
  },
  metricTextOn: {
    color: readerTheme.onPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  summaryStacked: {
    flexDirection: 'column',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 6,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: readerTheme.border,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: readerTheme.textSecondary,
  },
  summaryValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: readerTheme.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  sheetOption: {
    minHeight: 48,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: readerTheme.border,
  },
  sheetOptionText: {
    fontSize: 16,
    color: readerTheme.text,
    fontWeight: '600',
  },
  detailBody: {
    gap: 10,
  },
  detailLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: readerTheme.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: readerTheme.text,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    color: readerTheme.textSecondary,
  },
  pressed: {
    opacity: 0.88,
  },
});
