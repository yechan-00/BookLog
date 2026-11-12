import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { GoalForm } from '@/components/goals/GoalForm';
import { colors } from '@/constants/colors';
import { DEFAULT_GOAL_DRAFT } from '@/constants/goal';
import { spacing, typography } from '@/constants/theme';
import { replaceGoal } from '@/lib/api/goals';
import { useGoal } from '@/lib/goals/GoalProvider';
import { getNotificationPermission, requestNotificationPermission } from '@/lib/notifications';
import { refreshEngagementReminder } from '@/lib/reading/reminders';

/** First-run goal setup. The app opens only after a goal is saved (GOAL-01). */
export function OnboardingScreen() {
  const { refresh } = useGoal();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <Screen topInset includeBottomInset>
      <View style={styles.header}>
        <Text style={styles.title}>하루 목표를 정해 볼까요?</Text>
        <Text style={styles.subtitle}>
          부담 없이 시작할 수 있는 양으로 정하세요. 나중에 설정에서 언제든 바꿀 수 있어요.
        </Text>
      </View>

      <GoalForm
        initialDraft={DEFAULT_GOAL_DRAFT}
        submitLabel="시작하기"
        isSubmitting={isSaving}
        errorMessage={errorMessage}
        onEdit={() => setErrorMessage(null)}
        onSubmit={async (goal) => {
          setIsSaving(true);
          setErrorMessage(null);

          try {
            await replaceGoal({
              type: goal.type,
              targetValue: goal.targetValue,
              daysOfWeek: goal.daysOfWeek,
              reminderTime: goal.reminderTime,
            });
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : '목표를 저장하지 못했습니다.');
            setIsSaving(false);
            return;
          }

          // The goal is saved. A denied permission only means no reminders (NOTI-01), not a failed setup.
          const permission = await getNotificationPermission();
          if (permission.state === 'undetermined') {
            await requestNotificationPermission();
          }
          await refreshEngagementReminder();

          setIsSaving(false);
          refresh();
        }}
      />

      <Text style={styles.footnote}>알림 권한은 목표를 저장한 뒤 요청해요. 거부해도 설정에서 다시 켤 수 있어요.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  title: {
    ...typography.greeting,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footnote: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
