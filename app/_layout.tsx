import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthGateScreen } from '@/components/auth/AuthGateScreen';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ResumeSessionPrompt } from '@/components/reading/ResumeSessionPrompt';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth/AuthProvider';
import { GoalOnboardingProvider, useGoalOnboarding } from '@/lib/onboarding/GoalOnboardingContext';

export { ErrorBoundary } from 'expo-router';

function GoalCheckLoading() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.accent} accessibilityLabel="목표 확인 중" />
    </View>
  );
}

function GoalCheckError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.centered}>
      <EmptyState title="목표를 확인하지 못했습니다" description={message} />
      <PrimaryButton label="다시 시도" onPress={onRetry} />
    </View>
  );
}

function OnboardingRedirect() {
  const { decision } = useGoalOnboarding();
  const segments = useSegments();
  const onOnboarding = segments[0] === 'onboarding';

  if (decision.action === 'show_onboarding' && !onOnboarding) {
    return <Redirect href="/onboarding/goal" />;
  }

  if (decision.action === 'enter_app' && onOnboarding) {
    return <Redirect href="/" />;
  }

  return null;
}

function AuthGate() {
  const { status, userId, errorMessage, retry } = useAuth();

  if (status !== 'ready') {
    return <AuthGateScreen status={status} errorMessage={errorMessage} onRetry={retry} />;
  }

  return (
    <GoalOnboardingProvider authStatus={status} userId={userId}>
      <ReadyAppShell />
    </GoalOnboardingProvider>
  );
}

function ReadyAppShell() {
  const { decision, refresh } = useGoalOnboarding();

  if (decision.action === 'wait' || decision.action === 'loading_goal') {
    return <GoalCheckLoading />;
  }

  if (decision.action === 'goal_error') {
    return <GoalCheckError message={decision.message} onRetry={refresh} />;
  }

  if (decision.action !== 'enter_app' && decision.action !== 'show_onboarding') {
    return <GoalCheckLoading />;
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
        <Stack.Screen
          name="onboarding/goal"
          options={{
            title: '목표 설정',
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
      </Stack>
      <OnboardingRedirect />
      {decision.action === 'enter_app' ? <ResumeSessionPrompt /> : null}
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
