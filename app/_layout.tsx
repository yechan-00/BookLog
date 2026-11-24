import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { AuthGateScreen } from '@/components/auth/AuthGateScreen';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { OnboardingScreen } from '@/components/goals/OnboardingScreen';
import { ResumeSessionPrompt } from '@/components/reading/ResumeSessionPrompt';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth/AuthProvider';
import { GoalProvider, useGoal } from '@/lib/goals/GoalProvider';

export { ErrorBoundary } from 'expo-router';

function AuthGate() {
  const { status, errorMessage, retry } = useAuth();

  if (status !== 'ready') {
    return <AuthGateScreen status={status} errorMessage={errorMessage} onRetry={retry} />;
  }

  return (
    <GoalProvider>
      <GoalGate />
    </GoalProvider>
  );
}

function GoalGate() {
  const { status, errorMessage, refresh } = useGoal();

  if (status === 'loading') {
    return <AuthGateScreen status="loading" errorMessage={null} onRetry={refresh} />;
  }

  if (status === 'error') {
    return (
      <View style={styles.centered}>
        <EmptyState title="목표를 불러오지 못했어요" description={errorMessage ?? '잠시 후 다시 시도해 주세요.'} />
        <PrimaryButton label="다시 시도" onPress={refresh} />
      </View>
    );
  }

  if (status === 'needed') {
    return <OnboardingScreen />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <ResumeSessionPrompt />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AuthGate />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
});
