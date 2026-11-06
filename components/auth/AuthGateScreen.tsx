import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';
import type { AuthStatus } from '@/lib/auth/AuthProvider';

type BlockingStatus = Exclude<AuthStatus, 'ready'>;

type AuthGateScreenProps = {
  status: BlockingStatus;
  errorMessage: string | null;
  onRetry: () => void;
};

export function AuthGateScreen({ status, errorMessage, onRetry }: AuthGateScreenProps) {
  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.accent} accessibilityLabel="로그인 중" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {status === 'admin' ? (
        <EmptyState
          title="관리자 계정입니다"
          description="관리자 웹을 이용해 주세요. 앱은 일반 사용자 전용입니다."
        />
      ) : null}
      {status === 'suspended' ? (
        <EmptyState
          title="이용이 정지된 계정입니다"
          description="서비스 이용이 제한되었습니다. 문의가 필요하면 운영자에게 연락해 주세요."
        />
      ) : null}
      {status === 'error' ? (
        <>
          <EmptyState
            title="로그인에 실패했습니다"
            description={errorMessage ?? '잠시 후 다시 시도해 주세요.'}
          />
          <PrimaryButton label="다시 시도" onPress={onRetry} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
});
