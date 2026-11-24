import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { fetchMyProfile } from '@/lib/api/profile';
import { clearBooklogNotifications } from '@/lib/notifications/clearBooklog';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/user';

export type AuthStatus = 'loading' | 'ready' | 'signedOut' | 'suspended' | 'admin' | 'error';

interface AuthContextValue {
  status: AuthStatus;
  userId: string | null;
  profile: Profile | null;
  errorMessage: string | null;
  retry: () => void;
  signIn: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const testAccountEmail = process.env.EXPO_PUBLIC_TEST_ACCOUNT_EMAIL?.trim();
const testAccountPassword = process.env.EXPO_PUBLIC_TEST_ACCOUNT_PASSWORD;

type AuthStage = 'session' | 'sign-in' | 'profile';

function logAuthFailure(stage: AuthStage, error: unknown) {
  if (!__DEV__) {
    return;
  }

  const details =
    typeof error === 'object' && error !== null
      ? (error as { name?: unknown; code?: unknown; status?: unknown })
      : {};
  const name = typeof details.name === 'string' ? details.name : 'unknown';
  const code = typeof details.code === 'string' ? details.code : 'none';
  const status = typeof details.status === 'number' ? String(details.status) : 'none';
  console.warn(`[auth] stage=${stage} name=${name} code=${code} status=${status}`);
}

function isUnreachableHostMessage(message: string): boolean {
  return (
    /hostname could not be found/i.test(message) ||
    /could not resolve host/i.test(message) ||
    /getaddrinfo/i.test(message) ||
    /ENOTFOUND/i.test(message) ||
    /network request failed/i.test(message)
  );
}

function authBootstrapFailureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (isUnreachableHostMessage(message)) {
    return [
      'Supabase 서버 주소(EXPO_PUBLIC_SUPABASE_URL)를 찾을 수 없습니다.',
      '대시보드 Project Settings → API의 Project URL이 사용 중인 프로젝트인지 확인한 뒤',
      '.env.local을 고치고 Expo를 재시작하세요.',
    ].join(' ');
  }

  return message || '로그인에 실패했습니다.';
}

function signInFailureMessage(error: { message: string; code?: string } | null): string {
  const code = error?.code ?? '';
  const message = error?.message ?? '';
  if (code === 'invalid_credentials' || /invalid login credentials|invalid_credentials/i.test(message)) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }

  if (code === 'email_not_confirmed') {
    return '이메일 인증이 끝나지 않은 계정입니다. Supabase에서 계정을 확인한 뒤 다시 로그인해 주세요.';
  }

  if (isUnreachableHostMessage(message)) {
    return authBootstrapFailureMessage(error);
  }

  return '로그인에 실패했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.';
}

async function resolveUserId(): Promise<string | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    logAuthFailure('session', sessionError);
    throw sessionError;
  }

  if (sessionData.session) {
    return sessionData.session.user.id;
  }

  if (!testAccountEmail || !testAccountPassword) {
    return null;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: testAccountEmail,
    password: testAccountPassword,
  });
  if (error) {
    logAuthFailure('sign-in', error);
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
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const previous = previousUserIdRef.current;
    previousUserIdRef.current = userId;
    if (previous && previous !== userId) {
      void clearBooklogNotifications();
    }
  }, [userId]);

  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      try {
        const id = await resolveUserId();
        if (!id) {
          if (isCancelled) {
            return;
          }
          setUserId(null);
          setProfile(null);
          setErrorMessage(null);
          setStatus('signedOut');
          return;
        }

        let loadedProfile: Profile;
        try {
          loadedProfile = await fetchMyProfile(id);
        } catch (profileError) {
          logAuthFailure('profile', profileError);
          throw profileError;
        }
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

        setErrorMessage(authBootstrapFailureMessage(error));
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

  const signIn = useCallback(async (email: string, password: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length === 0) {
      throw new Error('이메일과 비밀번호를 입력해 주세요.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    if (error || !data.user) {
      logAuthFailure('sign-in', error);
      throw new Error(signInFailureMessage(error));
    }

    try {
      const loadedProfile = await fetchMyProfile(data.user.id);
      setUserId(data.user.id);
      setProfile(loadedProfile);
      setErrorMessage(null);
      setStatus(statusOf(loadedProfile));
    } catch (profileError) {
      logAuthFailure('profile', profileError);
      setUserId(data.user.id);
      setProfile(null);
      setErrorMessage(profileError instanceof Error ? profileError.message : '프로필을 불러오지 못했습니다.');
      setStatus('error');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, userId, profile, errorMessage, retry, signIn }),
    [status, userId, profile, errorMessage, retry, signIn],
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
