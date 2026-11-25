import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/colors';
import { card, radius, spacing, typography } from '@/constants/theme';
import { replaceGoal, setGoalNotificationsEnabled } from '@/lib/api/goals';
import { useGoal } from '@/lib/goals/GoalProvider';
import {
  describeEngagementSync,
  ensureNotificationPermissionGranted,
  syncEngagementFromStoredGoal,
} from '@/lib/notifications';
import {
  ONBOARDING_INITIAL_DRAFT,
  validateOnboardingGoalDraft,
  type OnboardingGoalDraft,
} from '@/utils/onboardingGoal';

const dayOptions = [
  { day: 0, label: '일' },
  { day: 1, label: '월' },
  { day: 2, label: '화' },
  { day: 3, label: '수' },
  { day: 4, label: '목' },
  { day: 5, label: '금' },
  { day: 6, label: '토' },
];

export function OnboardingScreen() {
  const { refresh } = useGoal();
  const [draft, setDraft] = useState<OnboardingGoalDraft>(ONBOARDING_INITIAL_DRAFT);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const parsed = validateOnboardingGoalDraft(draft);

  const updateDraft = (patch: Partial<OnboardingGoalDraft>) => {
    setMessage(null);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleStart = async () => {
    if (savingRef.current || isSaving) {
      return;
    }

    if (!parsed.valid) {
      setMessage(parsed.message);
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setMessage(null);

    let notificationsEnabled = draft.notificationsEnabled;
    let permissionNote: string | null = null;
    if (notificationsEnabled) {
      const permission = await ensureNotificationPermissionGranted();
      if (permission.state !== 'granted') {
        notificationsEnabled = false;
        permissionNote = permission.canAskAgain
          ? '알림 권한이 없어 알림은 끈 상태로 목표만 저장합니다. 설정에서 다시 허용할 수 있어요.'
          : '알림 권한이 없어 알림은 끈 상태로 목표만 저장합니다. 휴대전화 설정에서 알림을 허용해 주세요.';
      }
    }

    try {
      let saved = await replaceGoal({
        type: parsed.type,
        targetValue: parsed.targetValue,
        daysOfWeek: parsed.daysOfWeek,
        reminderTime: parsed.reminderTime,
      });

      if (saved.notificationsEnabled !== notificationsEnabled) {
        try {
          saved = await setGoalNotificationsEnabled(saved.id, notificationsEnabled);
        } catch {
          permissionNote =
            (permissionNote ? `${permissionNote} ` : '') +
            (notificationsEnabled
              ? '알림 켜기에 실패했습니다. 설정에서 다시 시도할 수 있어요.'
              : '알림 끄기에 실패했습니다. 설정에서 다시 시도할 수 있어요.');
        }
      }

      const sync = await syncEngagementFromStoredGoal({
        ...saved,
        notificationsEnabled,
      });

      if (notificationsEnabled && sync.status !== 'synced' && sync.status !== 'cleared') {
        permissionNote = (permissionNote ? `${permissionNote} ` : '') + describeEngagementSync(sync);
      }

      refresh();
      if (permissionNote) {
        setMessage(`목표는 저장했습니다. ${permissionNote}`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목표를 저장하지 못했습니다.');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <Screen includeBottomInset topInset>
        <Text style={styles.title}>나만의 독서 목표를 설정해 보세요</Text>
        <Text style={styles.subtitle}>매일 조금씩 읽는 습관을 만들어 보세요.</Text>

        <View style={styles.group}>
          <Text style={styles.label}>목표 유형</Text>
          <View style={styles.choices}>
            <ChoiceChip
              label="시간"
              selected={draft.type === 'time'}
              onPress={() => updateDraft({ type: 'time' })}
            />
            <ChoiceChip
              label="페이지"
              selected={draft.type === 'pages'}
              onPress={() => updateDraft({ type: 'pages' })}
            />
          </View>

          <TextField
            label={draft.type === 'time' ? '하루 목표(분)' : '하루 목표(페이지)'}
            value={draft.target}
            onChangeText={(target) => updateDraft({ target })}
            keyboardType="number-pad"
            placeholder="15"
          />

          <Text style={styles.label}>독서 요일</Text>
          <View style={styles.choices}>
            {dayOptions.map((option) => {
              const selected = draft.days.includes(option.day);
              return (
                <ChoiceChip
                  key={option.day}
                  label={option.label}
                  selected={selected}
                  onPress={() =>
                    updateDraft({
                      days: selected
                        ? draft.days.filter((day) => day !== option.day)
                        : [...draft.days, option.day],
                    })
                  }
                />
              );
            })}
          </View>

          <Text style={styles.label}>독서 알림</Text>
          <View style={styles.choices}>
            <ChoiceChip
              label="켜기"
              selected={draft.notificationsEnabled}
              onPress={() => updateDraft({ notificationsEnabled: true })}
            />
            <ChoiceChip
              label="끄기"
              selected={!draft.notificationsEnabled}
              onPress={() => updateDraft({ notificationsEnabled: false })}
            />
          </View>
          {draft.notificationsEnabled ? (
            <TextField
              label="알림 시간"
              value={draft.reminderTime}
              onChangeText={(reminderTime) => updateDraft({ reminderTime })}
              placeholder="21:00"
            />
          ) : (
            <Text style={styles.note}>나중에 설정에서 알림을 켤 수 있어요.</Text>
          )}
        </View>

        {!parsed.valid ? <Text style={styles.note}>{parsed.message}</Text> : null}
        {message ? <Text style={styles.note}>{message}</Text> : null}

        <PrimaryButton
          label="독서 시작하기"
          onPress={() => {
            void handleStart();
          }}
          disabled={isSaving || !parsed.valid}
          loading={isSaving}
        />
      </Screen>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  group: {
    ...card,
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceMuted,
  },
  chipLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  chipLabelSelected: {
    color: colors.accent,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
});
