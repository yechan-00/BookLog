import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/colors';
import { WEEKDAY_OPTIONS } from '@/constants/goal';
import { radius, spacing, typography } from '@/constants/theme';
import { validateGoalDraft, type GoalDraft, type GoalDraftResult } from '@/utils/goalForm';

export type ValidGoal = Extract<GoalDraftResult, { valid: true }>;

type GoalFormProps = {
  initialDraft: GoalDraft;
  submitLabel: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (goal: ValidGoal) => void;
  onEdit?: () => void;
};

/** Goal unit, amount, weekdays and reminder time. Shared by onboarding and settings. */
export function GoalForm({ initialDraft, submitLabel, isSubmitting, errorMessage, onSubmit, onEdit }: GoalFormProps) {
  const [draft, setDraft] = useState<GoalDraft>(initialDraft);
  const parsed = validateGoalDraft(draft);

  const updateDraft = (patch: Partial<GoalDraft>) => {
    onEdit?.();
    setDraft((current) => ({ ...current, ...patch }));
  };

  return (
    <View style={styles.form}>
      <Text style={styles.label}>목표 단위</Text>
      <View style={styles.choices}>
        <Choice label="시간" selected={draft.type === 'time'} onPress={() => updateDraft({ type: 'time' })} />
        <Choice label="페이지" selected={draft.type === 'pages'} onPress={() => updateDraft({ type: 'pages' })} />
      </View>
      <TextField
        label={draft.type === 'time' ? '하루 목표(분)' : '하루 목표(페이지)'}
        value={draft.target}
        onChangeText={(target) => updateDraft({ target })}
        keyboardType="number-pad"
        placeholder="15"
      />
      <Text style={styles.label}>목표 요일</Text>
      <View style={styles.choices}>
        {WEEKDAY_OPTIONS.map((option) => {
          const selected = draft.days.includes(option.day);
          return (
            <Choice
              key={option.day}
              label={option.label}
              selected={selected}
              onPress={() =>
                updateDraft({
                  days: selected ? draft.days.filter((day) => day !== option.day) : [...draft.days, option.day],
                })
              }
            />
          );
        })}
      </View>
      <TextField
        label="알림 시간"
        value={draft.reminderTime}
        onChangeText={(reminderTime) => updateDraft({ reminderTime })}
        placeholder="21:00"
      />
      {!parsed.valid ? <Text style={styles.note}>{parsed.message}</Text> : null}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <PrimaryButton
        label={submitLabel}
        onPress={() => {
          if (parsed.valid) {
            onSubmit(parsed);
          }
        }}
        disabled={!parsed.valid || isSubmitting}
        loading={isSubmitting}
      />
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
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
  form: {
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.warning,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    minWidth: 44,
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
