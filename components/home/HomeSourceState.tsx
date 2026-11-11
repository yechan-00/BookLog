import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { libraryTheme } from '@/constants/libraryTheme';
import { radius, spacing, typography } from '@/constants/theme';

type HomeSourceStateProps =
  | {
      kind: 'loading';
      title?: string;
    }
  | {
      kind: 'empty';
      title: string;
      description?: string;
      actionLabel?: string;
      onAction?: () => void;
    }
  | {
      kind: 'error';
      title?: string;
      description?: string;
    }
  | {
      kind: 'unavailable';
      title: string;
      description?: string;
    };

export function HomeSourceState(props: HomeSourceStateProps) {
  if (props.kind === 'loading') {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color={libraryTheme.primaryBrown} accessibilityLabel={props.title ?? '불러오는 중'} />
        <Text style={styles.title}>{props.title ?? '독서 정보를 불러오는 중이에요'}</Text>
        <Text style={styles.description}>잠시만 기다려 주세요.</Text>
      </View>
    );
  }

  if (props.kind === 'empty') {
    return (
      <View style={styles.card}>
        <View style={styles.accentLine} />
        <Text style={styles.title}>{props.title}</Text>
        {props.description ? <Text style={styles.description}>{props.description}</Text> : null}
        {props.onAction && props.actionLabel ? (
          <PrimaryButton
            label={props.actionLabel}
            onPress={props.onAction}
            primaryColor={libraryTheme.primaryBrown}
            primaryPressedColor={libraryTheme.darkBrown}
            onPrimaryColor={libraryTheme.onPrimary}
          />
        ) : null}
      </View>
    );
  }

  const isError = props.kind === 'error';

  return (
    <View style={[styles.card, isError && styles.errorCard]}>
      <View style={styles.accentLine} />
      <Text style={styles.title}>
        {props.title ?? (isError ? '독서 정보를 불러오지 못했어요.' : '독서 정보를 불러올 수 없습니다')}
      </Text>
      {props.description ? <Text style={styles.description}>{props.description}</Text> : null}
      {isError ? <Text style={styles.errorHint}>오류 상태입니다. 예시 수치는 표시하지 않습니다.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: libraryTheme.surface,
    borderColor: libraryTheme.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loadingCard: {
    alignItems: 'flex-start',
  },
  errorCard: {
    borderColor: libraryTheme.secondaryBrown,
  },
  accentLine: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: libraryTheme.primaryBrown,
    marginBottom: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: libraryTheme.darkBrown,
  },
  description: {
    ...typography.caption,
    color: libraryTheme.textSecondary,
  },
  errorHint: {
    ...typography.caption,
    color: libraryTheme.secondaryBrown,
    fontWeight: '600',
  },
});
