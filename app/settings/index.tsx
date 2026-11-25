import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/common/AppIcon';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Screen } from '@/components/common/Screen';
import { SheetModal } from '@/components/common/SheetModal';
import { CircularProgress } from '@/components/home/CircularProgress';
import { ReaderCard } from '@/components/reader/ReaderCard';
import { readerLayout, readerRadius, readerSpace, readerTheme } from '@/constants/readerTheme';
import { fetchActiveGoal, replaceGoal, setGoalNotificationsEnabled } from '@/lib/api/goals';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useGoal } from '@/lib/goals/GoalProvider';
import {
  describeEngagementSync,
  ensureNotificationPermissionGranted,
  getNotificationPermission,
  listScheduledEngagementReminders,
  openNotificationSettings,
  syncEngagementFromStoredGoal,
} from '@/lib/notifications';
import { scheduleTestNotificationPreview } from '@/lib/notifications/testPreview';
import type { NotificationPermissionResult } from '@/lib/notifications/types';
import type { StoredReadingGoal } from '@/types/goal';
import {
  draftFromStoredGoal,
  emptyGoalDraft,
  isSameGoalDraft,
  validateGoalDraft,
  type GoalDraft,
} from '@/utils/goalForm';
import { formatReminderDisplay } from '@/utils/insightDashboard';

const dayOptions = [
  { day: 0, label: '일' },
  { day: 1, label: '월' },
  { day: 2, label: '화' },
  { day: 3, label: '수' },
  { day: 4, label: '목' },
  { day: 5, label: '금' },
  { day: 6, label: '토' },
];

type GoalLoadState =
  | { status: 'loading'; goal: StoredReadingGoal | null }
  | { status: 'ready'; goal: StoredReadingGoal | null }
  | { status: 'error'; message: string; goal: StoredReadingGoal | null };

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = readerLayout(width);
  const { status: authStatus, userId } = useAuth();
  const { refresh: refreshGoalProvider } = useGoal();
  const [draft, setDraft] = useState<GoalDraft>(emptyGoalDraft);
  const dirtyRef = useRef(false);
  const [goalLoad, setGoalLoad] = useState<GoalLoadState>({ status: 'loading', goal: null });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [permission, setPermission] = useState<NotificationPermissionResult | null>(null);
  const [engagementMessage, setEngagementMessage] = useState<string | null>(null);
  const [isEngagementBusy, setIsEngagementBusy] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const parsed = validateGoalDraft(draft);
  const savedGoal = goalLoad.goal;
  const daySize = Math.min(
    layout.dayMax,
    Math.floor((Math.min(width, layout.maxContent) - layout.pad * 2 - layout.cardPad * 2 - 6 * 8) / 7),
  );

  const markDirty = useCallback((value: boolean) => {
    dirtyRef.current = value;
  }, []);
  const draftOwnerRef = useRef<string | null>(userId);

  const refreshDeviceState = useCallback(async () => {
    const [nextPermission, scheduled] = await Promise.all([
      getNotificationPermission(),
      listScheduledEngagementReminders(),
    ]);
    setPermission(nextPermission);
    return scheduled.length;
  }, []);

  const loadGoal = useCallback(
    async (options?: { forceDraft?: boolean }) => {
      if (draftOwnerRef.current !== userId) {
        draftOwnerRef.current = userId;
        dirtyRef.current = false;
        setDraft(emptyGoalDraft);
        setGoalLoad({ status: 'loading', goal: null });
        setSaveMessage(null);
      }

      if (authStatus !== 'ready' || !userId) {
        setGoalLoad({ status: 'ready', goal: null });
        if (!dirtyRef.current || options?.forceDraft) {
          setDraft(emptyGoalDraft);
          markDirty(false);
        }
        return;
      }

      setGoalLoad((current) => ({ status: 'loading', goal: current.goal }));

      try {
        const goal = await fetchActiveGoal();
        setGoalLoad({ status: 'ready', goal });
        if (!dirtyRef.current || options?.forceDraft) {
          setDraft(goal ? draftFromStoredGoal(goal) : emptyGoalDraft);
          markDirty(false);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '목표를 불러오지 못했습니다.';
        setGoalLoad((current) => ({
          status: 'error',
          message,
          goal: current.goal,
        }));
      }
    },
    [authStatus, markDirty, userId],
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      void (async () => {
        await refreshDeviceState();
        if (!isActive) {
          return;
        }
      })();
      void loadGoal();
      return () => {
        isActive = false;
      };
    }, [loadGoal, refreshDeviceState]),
  );

  const updateDraft = (patch: Partial<GoalDraft>) => {
    setSaveMessage(null);
    markDirty(true);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleSave = async () => {
    if (savingRef.current || isSaving) {
      return;
    }
    if (goalLoad.status === 'loading') {
      setSaveMessage('목표를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    if (goalLoad.status === 'error' && !savedGoal) {
      setSaveMessage('목표 정보를 확인하지 못해 저장할 수 없습니다. 다시 불러온 뒤 시도해 주세요.');
      return;
    }
    if (authStatus !== 'ready' || !userId) {
      setSaveMessage('로그인이 필요합니다.');
      return;
    }
    if (!parsed.valid) {
      setSaveMessage(parsed.message);
      return;
    }
    if (isSameGoalDraft(parsed, savedGoal)) {
      setSaveMessage('변경된 내용이 없어 저장하지 않았습니다.');
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const saved = await replaceGoal({
        type: parsed.type,
        targetValue: parsed.targetValue,
        daysOfWeek: parsed.daysOfWeek,
        reminderTime: parsed.reminderTime,
        notificationsEnabled: savedGoal?.notificationsEnabled ?? true,
      });
      setGoalLoad({ status: 'ready', goal: saved });
      refreshGoalProvider();
      setDraft(draftFromStoredGoal(saved));
      markDirty(false);
      const sync = await syncEngagementFromStoredGoal(saved);
      await refreshDeviceState();
      setSaveMessage(`목표를 저장했습니다. ${describeEngagementSync(sync)}`);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '목표를 저장하지 못했습니다.');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (isEngagementBusy) {
      return;
    }
    setIsEngagementBusy(true);
    setEngagementMessage(null);

    try {
      if (!enabled) {
        let goal = savedGoal;
        if (goal) {
          goal = await setGoalNotificationsEnabled(goal.id, false);
          setGoalLoad({ status: 'ready', goal });
          refreshGoalProvider();
        }
        const result = await syncEngagementFromStoredGoal(
          goal ? { ...goal, notificationsEnabled: false } : null,
        );
        await refreshDeviceState();
        setIsEngagementBusy(false);
        if (result.status === 'failed') {
          setEngagementMessage(result.reason ?? '알림을 끄지 못했습니다.');
          return;
        }
        setEngagementMessage('독서 알림을 껐습니다.');
        return;
      }

      // Android may report denied+canAskAgain before the first prompt; always request when allowed.
      const next = await ensureNotificationPermissionGranted();
      setPermission(next);
      if (next.state !== 'granted') {
        setIsEngagementBusy(false);
        if (next.state === 'denied') {
          const message = next.canAskAgain
            ? '알림 권한이 필요해요. 허용을 선택하면 독서 알림을 받을 수 있어요.'
            : '알림 권한이 필요해요. 휴대전화 설정에서 알림을 허용해 주세요.';
          setEngagementMessage(message);
          if (!next.canAskAgain) {
            Alert.alert('알림 권한이 필요해요', '휴대전화 설정에서 BookLog 알림을 허용해 주세요.', [
              { text: '닫기', style: 'cancel' },
              {
                text: '설정 열기',
                onPress: () => {
                  void openNotificationSettings();
                },
              },
            ]);
          }
          return;
        }
        setEngagementMessage('알림 권한을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }

      let goal = savedGoal ?? (await fetchActiveGoal());
      if (!goal || !goal.reminderTime) {
        setIsEngagementBusy(false);
        setEngagementMessage('저장된 목표가 없어 알림을 켤 수 없습니다. 목표를 먼저 저장해 주세요.');
        return;
      }

      try {
        goal = await setGoalNotificationsEnabled(goal.id, true);
      } catch (error) {
        setIsEngagementBusy(false);
        setEngagementMessage(
          error instanceof Error ? error.message : '알림 설정을 저장하지 못했습니다.',
        );
        return;
      }
      setGoalLoad({ status: 'ready', goal });
      refreshGoalProvider();
      const result = await syncEngagementFromStoredGoal(goal);
      await refreshDeviceState();
      setIsEngagementBusy(false);
      if (result.status === 'failed' || result.status === 'permission_denied') {
        setEngagementMessage(
          result.status === 'permission_denied'
            ? '권한은 허용됐지만 알림을 예약하지 못했습니다. 다시 시도해 주세요.'
            : (result.reason ?? '알림을 예약하지 못했습니다. 설정 저장은 완료됐어요.'),
        );
        return;
      }
      setEngagementMessage(describeEngagementSync(result));
    } catch (error) {
      setIsEngagementBusy(false);
      setEngagementMessage(error instanceof Error ? error.message : '알림 설정을 바꾸지 못했습니다.');
    }
  };

  const handleTestPreview = async () => {
    setPreviewMessage(null);
    const result = await scheduleTestNotificationPreview();
    if (result.status === 'scheduled') {
      setPreviewMessage('잠시 후 테스트 알림이 도착합니다.');
      return;
    }
    if (result.status === 'permission_denied') {
      setPreviewMessage('알림 권한이 없어 미리보기를 보낼 수 없습니다.');
      return;
    }
    setPreviewMessage(result.reason);
  };

  const notificationStatusLabel = (() => {
    if (!savedGoal) {
      return '목표 없음';
    }
    if (!savedGoal.notificationsEnabled) {
      return '알림 꺼짐';
    }
    if (permission?.state === 'denied') {
      return '알림 권한 필요';
    }
    if (permission?.state === 'granted') {
      return '알림 허용됨';
    }
    if (isEngagementBusy) {
      return '알림 설정 중';
    }
    return '알림 상태 확인 중';
  })();

  const savedDayCount = savedGoal?.daysOfWeek.length ?? 0;
  const ringPercent = savedGoal ? (savedDayCount / 7) * 100 : 0;
  const overviewTitle = !savedGoal
    ? '아직 목표가 없어요'
    : savedGoal.type === 'time'
      ? `하루 ${savedGoal.targetValue}분 읽기`
      : `하루 ${savedGoal.targetValue}페이지 읽기`;
  const saveDisabled =
    isSaving || goalLoad.status === 'loading' || (goalLoad.status === 'error' && !savedGoal) || !parsed.valid;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen
        topInset
        includeBottomInset
        backgroundColor={readerTheme.background}
        contentContainerStyle={[styles.content, { paddingHorizontal: layout.pad, paddingBottom: insets.bottom + 28 }]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            hitSlop={8}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
                return;
              }
              router.replace('/');
            }}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <AppIcon name="chevronLeft" size={18} color={readerTheme.primary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.screenTitle}>독서 목표</Text>
            <Text style={styles.screenSubtitle}>나에게 맞는 꾸준한 독서 습관을 설정해요.</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {goalLoad.status === 'error' ? (
          <ReaderCard padding={layout.cardPad}>
            <Text style={styles.note}>{goalLoad.message}</Text>
            <PrimaryButton
              label="다시 불러오기"
              variant="secondary"
              onPress={() => void loadGoal({ forceDraft: !dirtyRef.current })}
              primaryColor={readerTheme.primary}
              onPrimaryColor={readerTheme.onPrimary}
            />
          </ReaderCard>
        ) : null}

        <ReaderCard padding={layout.cardPad} style={styles.overviewCard}>
          <View style={[styles.overviewRow, layout.compact && styles.overviewStacked]}>
            <View style={styles.overviewCopy}>
              <Text style={styles.cardEyebrow}>나의 목표</Text>
              {goalLoad.status === 'loading' ? (
                <Text style={styles.overviewTitle}>목표를 불러오는 중이에요</Text>
              ) : (
                <>
                  <Text style={styles.overviewTitle}>{overviewTitle}</Text>
                  <Text style={styles.overviewMeta}>
                    {savedGoal ? `주 ${savedDayCount}일 실천` : '아래에서 새 목표를 저장해 보세요'}
                  </Text>
                  <Text style={styles.quote}>“오늘도, 더 나은 내가 되는 시간.”</Text>
                </>
              )}
            </View>
            <CircularProgress
              percent={ringPercent}
              size={layout.goalRing}
              strokeWidth={10}
              color={readerTheme.primary}
              trackColor={readerTheme.progressTrack}
              holeColor={readerTheme.surface}
            >
              <Text style={styles.ringCaption}>하루 목표</Text>
              <Text style={styles.ringValue}>
                {savedGoal
                  ? `${savedGoal.targetValue}${savedGoal.type === 'time' ? '분' : 'p'}`
                  : '—'}
              </Text>
              <Text style={styles.ringCaption}>주 {savedGoal ? savedDayCount : 0}일</Text>
            </CircularProgress>
          </View>
        </ReaderCard>

        <ReaderCard padding={layout.cardPad}>
          <Text style={styles.cardTitle}>목표 설정</Text>
          <Text style={styles.fieldLabel}>하루 목표량</Text>
          <View style={styles.segment}>
            <SegmentOption
              label="시간"
              icon="clock"
              selected={draft.type === 'time'}
              onPress={() => updateDraft({ type: 'time' })}
            />
            <SegmentOption
              label="페이지"
              icon="document"
              selected={draft.type === 'pages'}
              onPress={() => updateDraft({ type: 'pages' })}
            />
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={draft.target}
              onChangeText={(target) => updateDraft({ target })}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor={readerTheme.textMuted}
              style={styles.targetInput}
              accessibilityLabel={draft.type === 'time' ? '하루 목표 분' : '하루 목표 페이지'}
            />
            <Text style={styles.unit}>{draft.type === 'time' ? '분' : '페이지'}</Text>
          </View>
          {!parsed.valid ? <Text style={styles.error}>{parsed.message}</Text> : null}

          <Text style={[styles.fieldLabel, styles.sectionGap]}>목표 요일</Text>
          <View style={styles.days}>
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
                  style={[
                    styles.dayChip,
                    {
                      width: Math.max(32, daySize),
                      height: Math.max(32, daySize),
                      borderRadius: Math.max(16, daySize / 2),
                    },
                    selected && styles.dayChipSelected,
                  ]}
                >
                  <Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.caption}>선택한 요일에 목표를 실천할 거예요.</Text>
        </ReaderCard>

        <ReaderCard padding={layout.cardPad}>
          <View style={styles.reminderHeader}>
            <View style={styles.reminderIcon}>
              <AppIcon name="bell" size={18} color={readerTheme.primary} />
            </View>
            <View style={styles.reminderCopy}>
              <Text style={styles.cardTitle}>독서 알림</Text>
              <Text style={styles.caption}>설정한 시간에 독서를 시작할 수 있도록 알려드려요.</Text>
            </View>
            <Switch
              accessibilityLabel="독서 알림"
              value={Boolean(savedGoal?.notificationsEnabled && permission?.state === 'granted')}
              onValueChange={(value) => void handleToggleNotifications(value)}
              disabled={isEngagementBusy || goalLoad.status === 'loading'}
              trackColor={{ false: readerTheme.border, true: readerTheme.primarySoft }}
              thumbColor={readerTheme.surface}
            />
          </View>
          <View style={styles.statusPill}>
            <AppIcon name="checkmark" size={12} color={readerTheme.success} />
            <Text style={styles.statusPillText}>{notificationStatusLabel}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!savedGoal?.notificationsEnabled}
            onPress={() => setTimeSheetOpen(true)}
            style={[styles.settingRow, !savedGoal?.notificationsEnabled && styles.settingDisabled]}
          >
            <Text style={styles.settingLabel}>알림 시간</Text>
            <View style={styles.settingValue}>
              <AppIcon name="clock" size={14} color={readerTheme.primary} />
              <Text style={styles.settingValueText}>
                {formatReminderDisplay(draft.reminderTime || savedGoal?.reminderTime || null)}
              </Text>
              <AppIcon name="chevronRight" size={14} color={readerTheme.textMuted} />
            </View>
          </Pressable>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>알림 반복</Text>
            <Text style={styles.settingValueText}>목표 요일에만</Text>
          </View>
          {engagementMessage ? <Text style={styles.note}>{engagementMessage}</Text> : null}
        </ReaderCard>

        <PrimaryButton
          label={isSaving ? '저장 중…' : '목표 저장하기'}
          onPress={() => void handleSave()}
          disabled={saveDisabled}
          loading={isSaving}
          primaryColor={readerTheme.primaryDeep}
          primaryPressedColor={readerTheme.primary}
          onPrimaryColor={readerTheme.onPrimary}
          style={{ minHeight: layout.buttonHeight, borderRadius: readerRadius.control }}
        />
        {saveMessage ? <Text style={styles.note}>{saveMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => void handleTestPreview()}
          style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}
        >
          <AppIcon name="play" size={14} color={readerTheme.primary} />
          <Text style={styles.previewLabel}>테스트 알림 보내기</Text>
        </Pressable>
        {previewMessage ? <Text style={styles.note}>{previewMessage}</Text> : null}

        {__DEV__ ? (
          <PrimaryButton
            label="서재 미리보기"
            variant="secondary"
            onPress={() => router.push('/dev/library-preview')}
          />
        ) : null}
      </Screen>

      <SheetModal visible={timeSheetOpen} title="알림 시간" onClose={() => setTimeSheetOpen(false)} avoidKeyboard>
        <Text style={styles.caption}>HH:mm 형식으로 입력해 주세요. 예: 21:00</Text>
        <TextInput
          value={draft.reminderTime}
          onChangeText={(reminderTime) => updateDraft({ reminderTime })}
          placeholder="21:00"
          placeholderTextColor={readerTheme.textMuted}
          style={[styles.targetInput, styles.timeField]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton
          label="확인"
          onPress={() => setTimeSheetOpen(false)}
          primaryColor={readerTheme.primary}
          onPrimaryColor={readerTheme.onPrimary}
        />
      </SheetModal>
    </>
  );
}

function SegmentOption({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: 'clock' | 'document';
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.segmentItem, selected && styles.segmentItemSelected]}
    >
      <AppIcon name={icon} size={16} color={selected ? readerTheme.onPrimary : readerTheme.primary} />
      <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: readerSpace.md,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: readerTheme.border,
    backgroundColor: readerTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingTop: 4,
  },
  headerSpacer: {
    width: 44,
  },
  screenTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: readerTheme.text,
  },
  screenSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: readerTheme.textSecondary,
    textAlign: 'center',
  },
  overviewCard: {
    overflow: 'hidden',
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overviewStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  overviewCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  cardEyebrow: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: readerTheme.primary,
  },
  overviewTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: readerTheme.text,
  },
  overviewMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: readerTheme.textSecondary,
  },
  quote: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    color: readerTheme.textMuted,
  },
  ringCaption: {
    fontSize: 11,
    lineHeight: 14,
    color: readerTheme.textMuted,
    textAlign: 'center',
  },
  ringValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: readerTheme.text,
    fontVariant: ['tabular-nums'],
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: readerTheme.text,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: readerTheme.textSecondary,
    marginBottom: 8,
  },
  sectionGap: {
    marginTop: 18,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  segmentItem: {
    flex: 1,
    minHeight: 46,
    borderRadius: readerRadius.pill,
    borderWidth: 1,
    borderColor: readerTheme.border,
    backgroundColor: readerTheme.soft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentItemSelected: {
    backgroundColor: readerTheme.primary,
    borderColor: readerTheme.primary,
  },
  segmentLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: readerTheme.primary,
  },
  segmentLabelSelected: {
    color: readerTheme.onPrimary,
  },
  inputRow: {
    minHeight: 52,
    borderRadius: readerRadius.input,
    borderWidth: 1,
    borderColor: readerTheme.border,
    backgroundColor: readerTheme.soft,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: readerTheme.text,
    fontVariant: ['tabular-nums'],
    paddingVertical: 12,
  },
  timeField: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: readerTheme.border,
    borderRadius: readerRadius.input,
    backgroundColor: readerTheme.soft,
    paddingHorizontal: 14,
  },
  unit: {
    fontSize: 15,
    lineHeight: 20,
    color: readerTheme.textSecondary,
    fontWeight: '600',
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayChip: {
    borderWidth: 1,
    borderColor: readerTheme.border,
    backgroundColor: readerTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: {
    backgroundColor: readerTheme.primary,
    borderColor: readerTheme.primary,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: readerTheme.textSecondary,
  },
  dayLabelSelected: {
    color: readerTheme.onPrimary,
  },
  caption: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 16,
    color: readerTheme.textMuted,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: readerTheme.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderCopy: {
    flex: 1,
    minWidth: 0,
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF2E6',
    borderRadius: readerRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 12,
    lineHeight: 16,
    color: readerTheme.success,
    fontWeight: '600',
  },
  settingRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: readerTheme.border,
  },
  settingDisabled: {
    opacity: 0.45,
  },
  settingLabel: {
    fontSize: 15,
    lineHeight: 20,
    color: readerTheme.text,
    fontWeight: '600',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValueText: {
    fontSize: 14,
    lineHeight: 18,
    color: readerTheme.textSecondary,
    fontWeight: '600',
  },
  previewButton: {
    alignSelf: 'center',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  previewLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: readerTheme.primary,
    fontWeight: '600',
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    color: readerTheme.textSecondary,
  },
  error: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: readerTheme.error,
  },
  pressed: {
    opacity: 0.88,
  },
});
