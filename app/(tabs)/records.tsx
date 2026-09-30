import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { MonthCalendar } from '@/components/reading/MonthCalendar';
import { ReadingSessionCard } from '@/components/reading/ReadingSessionCard';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { getReadingDates, getSessionsForDate } from '@/data/selectors';
import { startOfToday, toDateKey } from '@/utils/date';
import { formatKoreanDateKey } from '@/utils/format';

export default function RecordsScreen() {
  const today = startOfToday();
  const todayKey = toDateKey(today);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const readingDates = useMemo(() => getReadingDates(), []);
  const sessions = getSessionsForDate(selectedDate);

  return (
    <Screen topInset>
      <View style={styles.header}>
        <Text style={styles.title}>기록</Text>
        <Text style={styles.subtitle}>독서한 날을 달력에서 다시 열어 봅니다.</Text>
      </View>

      <View style={styles.calendarCard}>
        <MonthCalendar
          visibleMonth={visibleMonth}
          selectedDate={selectedDate}
          todayKey={todayKey}
          readingDates={readingDates}
          onSelectDate={setSelectedDate}
          onChangeMonth={setVisibleMonth}
        />
      </View>

      <SectionHeader title={formatKoreanDateKey(selectedDate)} />
      {sessions.length === 0 ? (
        <EmptyState title="이 날의 독서 기록이 없어요" />
      ) : (
        sessions.map((session) => (
          <ReadingSessionCard
            key={session.id}
            session={session}
            onPress={() => router.push(`/book/${session.bookId}`)}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    ...typography.greeting,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  calendarCard: {
    ...card,
    padding: spacing.lg,
  },
});
