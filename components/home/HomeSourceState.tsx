import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { HomeCard } from '@/components/home/HomeCard';
import { homeTheme } from '@/constants/homeTheme';

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
      <HomeCard>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={homeTheme.primary} accessibilityLabel={props.title ?? '불러오는 중'} />
          <View style={styles.loadingCopy}>
            <Text style={styles.title}>{props.title ?? '독서 정보를 불러오는 중이에요'}</Text>
          </View>
        </View>
      </HomeCard>
    );
  }

  if (props.kind === 'empty') {
    return (
      <HomeCard>
        <Text style={styles.title}>{props.title}</Text>
        {props.description ? <Text style={styles.description}>{props.description}</Text> : null}
        {props.onAction && props.actionLabel ? (
          <View style={styles.action}>
            <PrimaryButton
              label={props.actionLabel}
              onPress={props.onAction}
              primaryColor={homeTheme.primary}
              primaryPressedColor={homeTheme.accentLine}
              onPrimaryColor={homeTheme.onPrimary}
            />
          </View>
        ) : null}
      </HomeCard>
    );
  }

  const isError = props.kind === 'error';

  return (
    <HomeCard style={isError ? styles.errorCard : undefined}>
      <Text style={styles.title}>
        {props.title ?? (isError ? '독서 정보를 불러오지 못했어요.' : '독서 정보를 불러올 수 없습니다')}
      </Text>
      {props.description ? <Text style={styles.description}>{props.description}</Text> : null}
    </HomeCard>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingCopy: {
    flex: 1,
  },
  errorCard: {
    borderColor: homeTheme.date,
  },
  title: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    color: homeTheme.text,
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: homeTheme.textSecondary,
  },
  action: {
    marginTop: 12,
  },
});
