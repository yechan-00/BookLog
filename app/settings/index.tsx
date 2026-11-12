import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/colors';
import { card, radius, spacing, typography } from '@/constants/theme';
import { replaceGoal, setGoalNotificationsEnabled } from '@/lib/api/goals';
import { useGoal } from '@/lib/goals/GoalProvider';
import {
  getNotificationPermission,
  listScheduledEngagementReminders,
  openNotificationSettings,
  requestNotificationPermission,
  syncEngagementReminder,
} from '@/lib/notifications';
import type { NotificationPermissionResult } from '@/lib/notifications/types';
import { refreshEngagementReminder } from '@/lib/reading/reminders';
import { validateGoalDraft, type GoalDraft } from '@/utils/goalForm';
import { describeGoal } from '@/utils/goalText';

const dayOptions = [
  { day: 0, label: '일' },
  { day: 1, label: '월' },
  { day: 2, label: '화' },
  { day: 3, label: '수' },
  { day: 4, label: '목' },
  { day: 5, label: '금' },
  { day: 6, label: '토' },
];

const permissionLabel: Record<NotificationPermissionResult['state'], string> = {
  granted: '허용',
  denied: '거부',
  undetermined: '미결정',
  error: '조회 오류',
};

const emptyDraft: GoalDraft = {
  type: 'time',
  target: '',
  days: [],
  reminderTime: '',
};

export default function SettingsScreen() {
  const { goal, refresh: refreshGoal } = useGoal();
  const [draft, setDraft] = useState<GoalDraft>(() =>
    goal
      ? {
          type: goal.type,
          target: String(goal.targetValue),
          days: goal.daysOfWeek,
          reminderTime: goal.reminderTime ?? '',
        }
      : emptyDraft,
  );
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermissionResult | null>(null);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [isPermissionBusy, setIsPermissionBusy] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [engagementMessage, setEngagementMessage] = useState<string | null>(null);
  const [isEngagementBusy, setIsEngagementBusy] = useState(false);
  const parsed = validateGoalDraft(draft);

  const refreshDeviceState = useCallback(async () => {
    const [nextPermission, scheduled] = await Promise.all([
      getNotificationPermission(),
      listScheduledEngagementReminders(),
    ]);
    setPermission(nextPermission);
    setScheduledCount(scheduled.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      void (async () => {
        const [nextPermission, scheduled] = await Promise.all([
          getNotificationPermission(),
          listScheduledEngagementReminders(),
        ]);
        if (!isActive) {
          return;
        }
        setPermission(nextPermission);
        setScheduledCount(scheduled.length);
      })();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const updateDraft = (patch: Partial<GoalDraft>) => {
    setSaveMessage(null);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleSave = async () => {
    if (!parsed.valid) {
      setSaveMessage(parsed.message);
      return;
    }

    if (isSavingGoal) {
      return;
    }

    setIsSavingGoal(true);
    setSaveMessage(null);

    try {
      await replaceGoal({
        type: parsed.type,
        targetValue: parsed.targetValue,
        daysOfWeek: parsed.daysOfWeek,
        reminderTime: parsed.reminderTime,
      });
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '목표를 저장하지 못했습니다.');
      setIsSavingGoal(false);
      return;
    }

    const reminder = await refreshEngagementReminder();
    await refreshDeviceState();
    refreshGoal();
    setIsSavingGoal(false);
    setSaveMessage(
      reminder.status === 'failed'
        ? `목표는 저장했어요. 알림은 갱신하지 못했어요: ${reminder.reason ?? '알 수 없는 오류'}`
        : '목표를 저장했어요. 지난 날짜의 달성률은 당시 목표로 계산돼요.',
    );
  };

  const handleRequestPermission = async () => {
    if (isPermissionBusy) {
      return;
    }

    setIsPermissionBusy(true);
    setPermissionMessage(null);
    const next = await requestNotificationPermission();
    setPermission(next);
    setIsPermissionBusy(false);
    if (next.state === 'error') {
      setPermissionMessage('알림 권한을 확인하지 못했습니다.');
    }
  };

  const handleOpenSettings = async () => {
    const opened = await openNotificationSettings();
    if (!opened) {
      setPermissionMessage('설정 화면을 열지 못했습니다.');
    }
  };

  const handleDisableEngagement = async () => {
    if (isEngagementBusy) {
      return;
    }

    setIsEngagementBusy(true);
    setEngagementMessage(null);

    // Saved too, so a later goal save does not switch the reminder back on.
    if (goal) {
      try {
        await setGoalNotificationsEnabled(goal.id, false);
      } catch (error) {
        setIsEngagementBusy(false);
        setEngagementMessage(error instanceof Error ? error.message : '알림 설정을 저장하지 못했습니다.');
        return;
      }
    }

    const result = await syncEngagementReminder({ goal: null, achievedDates: [] });
    await refreshDeviceState();
    refreshGoal();
    setIsEngagementBusy(false);

    if (result.status === 'failed') {
      setEngagementMessage(result.reason ?? '참여 유도 알림을 끄지 못했습니다.');
      return;
    }

    setEngagementMessage('참여 유도 알림 예약을 취소했습니다. 목표 도달 알림은 그대로입니다.');
  };

  const handleEnableEngagement = async () => {
    if (isEngagementBusy) {
      return;
    }

    setIsEngagementBusy(true);
    setEngagementMessage(null);
    let next = await getNotificationPermission();
    if (next.state === 'undetermined') {
      next = await requestNotificationPermission();
    }
    setPermission(next);

    if (next.state !== 'granted') {
      setIsEngagementBusy(false);
      setEngagementMessage(
        next.state === 'error'
          ? '알림 권한을 확인하지 못했습니다.'
          : '알림 권한이 없어 참여 유도 알림을 켜지 못했습니다.',
      );
      return;
    }

    if (!goal) {
      setIsEngagementBusy(false);
      setEngagementMessage('저장된 목표가 없어 알림을 예약하지 않았습니다. 목표를 먼저 저장해 주세요.');
      return;
    }

    try {
      await setGoalNotificationsEnabled(goal.id, true);
    } catch (error) {
      setIsEngagementBusy(false);
      setEngagementMessage(error instanceof Error ? error.message : '알림 설정을 저장하지 못했습니다.');
      return;
    }

    const result = await refreshEngagementReminder();
    await refreshDeviceState();
    refreshGoal();
    setIsEngagementBusy(false);
    setEngagementMessage(
      result.status === 'failed' ? (result.reason ?? '참여 유도 알림을 예약하지 못했습니다.') : '참여 유도 알림을 켰어요.',
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: '설정' }} />
      <Screen includeBottomInset>
        <Text style={styles.intro}>독서 목표와 알림에 쓸 기본 정보를 모아 둡니다.</Text>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>현재 목표</Text>
          <Text style={styles.note}>{goal ? describeGoal(goal) : '설정된 목표가 없어요.'}</Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>목표 수정</Text>
          <View style={styles.choices}>
            <TypeChoice label="시간" selected={draft.type === 'time'} onPress={() => updateDraft({ type: 'time' })} />
            <TypeChoice
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
            placeholder="30"
          />
          <Text style={styles.label}>목표 요일</Text>
          <View style={styles.choices}>
            {dayOptions.map((option) => {
              const selected = draft.days.includes(option.day);
              return (
                <Pressable
                  key={option.day}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() =>
                    updateDraft({
                      days: selected
                        ? draft.days.filter((day) => day !== option.day)
                        : [...draft.days, option.day],
                    })
                  }
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextField
            label="알림 시간"
            value={draft.reminderTime}
            onChangeText={(reminderTime) => updateDraft({ reminderTime })}
            placeholder="21:00"
          />
          <PrimaryButton
            label="목표 저장"
            onPress={() => {
              void handleSave();
            }}
            disabled={!parsed.valid || isSavingGoal}
            loading={isSavingGoal}
          />
          {!parsed.valid ? <Text style={styles.note}>{parsed.message}</Text> : null}
          {saveMessage ? <Text style={styles.note}>{saveMessage}</Text> : null}
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>알림 권한</Text>
          <Row label="상태" value={permission ? permissionLabel[permission.state] : '확인 중'} />
          {permission?.state === 'undetermined' ? (
            <PrimaryButton
              label="알림 권한 요청"
              onPress={() => {
                void handleRequestPermission();
              }}
              disabled={isPermissionBusy}
              loading={isPermissionBusy}
            />
          ) : null}
          {permission?.state === 'denied' ? (
            <PrimaryButton label="설정 열기" variant="secondary" onPress={() => void handleOpenSettings()} />
          ) : null}
          {permission?.state === 'error' ? (
            <PrimaryButton
              label="다시 확인"
              variant="secondary"
              onPress={() => void refreshDeviceState()}
            />
          ) : null}
          {permissionMessage ? <Text style={styles.note}>{permissionMessage}</Text> : null}
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>참여 유도 알림</Text>
          <Row label="기기 예약" value={scheduledCount > 0 ? `${scheduledCount}건` : '없음'} />
          {scheduledCount > 0 ? (
            <PrimaryButton
              label="알림 끄기"
              variant="secondary"
              onPress={() => {
                void handleDisableEngagement();
              }}
              disabled={isEngagementBusy}
              loading={isEngagementBusy}
            />
          ) : (
            <PrimaryButton
              label="알림 켜기"
              onPress={() => {
                void handleEnableEngagement();
              }}
              disabled={isEngagementBusy}
              loading={isEngagementBusy}
            />
          )}
          <Text style={styles.note}>끄면 참여 유도 알림만 취소합니다. 목표 도달 알림은 취소하지 않습니다.</Text>
          {engagementMessage ? <Text style={styles.note}>{engagementMessage}</Text> : null}
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>앱</Text>
          <Row label="이름" value="북로그" />
          <Row label="버전" value="1.0.0" />
        </View>

        {__DEV__ ? (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>개발</Text>
            <PrimaryButton
              label="홈 미리보기"
              variant="secondary"
              onPress={() => router.push('/dev/home-preview')}
            />
          </View>
        ) : null}
      </Screen>
    </>
  );
}

function TypeChoice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
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
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: colors.onAccent,
  },
});
