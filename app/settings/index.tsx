import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { colors } from '@/constants/colors';
import { card, spacing, typography } from '@/constants/theme';
import { mockGoal } from '@/data/mockReadingData';

const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

export default function SettingsScreen() {
  const readingDays = mockGoal.daysOfWeek.map((day) => dayLabels[day] ?? '').join(' · ');
  const goalLabel =
    mockGoal.type === 'pages' ? `하루 ${mockGoal.targetValue}페이지` : `하루 ${mockGoal.targetValue}분`;

  return (
    <>
      <Stack.Screen options={{ title: '설정' }} />
      <Screen includeBottomInset>
        <Text style={styles.intro}>독서 목표와 알림에 쓸 기본 정보를 모아 둡니다.</Text>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>독서 목표</Text>
          <Row label="목표" value={goalLabel} />
          <Row label="요일" value={readingDays} />
          <Row label="상태" value={mockGoal.isActive ? '사용 중' : '꺼짐'} />
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>알림</Text>
          <Row label="예정 시각" value={mockGoal.reminderTime ?? '없음'} />
          <Text style={styles.note}>알림 발송은 아직 연결하지 않았습니다. 시각만 보관합니다.</Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>앱</Text>
          <Row label="이름" value="북로그" />
          <Row label="버전" value="1.0.0" />
        </View>
      </Screen>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...typography.body,
    color: colors.textSecondary,
  },
  group: {
    ...card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  groupTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  row: {
    gap: 4,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  value: {
    ...typography.body,
    color: colors.text,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
