import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthGateScreen } from '@/components/auth/AuthGateScreen';
import { ResumeSessionPrompt } from '@/components/reading/ResumeSessionPrompt';
import { colors } from '@/constants/colors';
import { AuthProvider, useAuth } from '@/lib/auth/AuthProvider';

export { ErrorBoundary } from 'expo-router';

function AuthGate() {
  const { status, errorMessage, retry } = useAuth();

  if (status !== 'ready') {
    return <AuthGateScreen status={status} errorMessage={errorMessage} onRetry={retry} />;
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
