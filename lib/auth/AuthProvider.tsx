import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchMyProfile } from '@/lib/api/profile';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/user';

export type AuthStatus = 'loading' | 'ready' | 'suspended' | 'admin' | 'error';

interface AuthContextValue {
  status: AuthStatus;
  userId: string | null;
  profile: Profile | null;
  errorMessage: string | null;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const testAccountEmail = process.env.EXPO_PUBLIC_TEST_ACCOUNT_EMAIL?.trim();
const testAccountPassword = process.env.EXPO_PUBLIC_TEST_ACCOUNT_PASSWORD;

async function resolveUserId(): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw sessionError;
  }

  if (sessionData.session) {
    return sessionData.session.user.id;
  }

  if (!testAccountEmail || !testAccountPassword) {
    throw new Error(
      '테스트 계정 환경변수(EXPO_PUBLIC_TEST_ACCOUNT_EMAIL, EXPO_PUBLIC_TEST_ACCOUNT_PASSWORD)가 비어 있습니다.',
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: testAccountEmail,
    password: testAccountPassword,
  });
  if (error) {
    throw error;
  }

  return data.user.id;
}

function statusOf(profile: Profile): AuthStatus {
  if (profile.role === 'admin') {
    return 'admin';
  }

  return profile.isSuspended ? 'suspended' : 'ready';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      try {
        const id = await resolveUserId();
        const loadedProfile = await fetchMyProfile(id);
        if (isCancelled) {
          return;
        }

        setUserId(id);
        setProfile(loadedProfile);
        setErrorMessage(null);
        setStatus(statusOf(loadedProfile));
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : '로그인에 실패했습니다.');
        setStatus('error');
      }
    }

    void bootstrap();

    return () => {
      isCancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((count) => count + 1);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, userId, profile, errorMessage, retry }),
    [status, userId, profile, errorMessage, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.');
  }

  return value;
}
