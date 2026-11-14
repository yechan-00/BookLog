import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { checkAdminRole } from './api';
import { supabase, supabaseConfigError } from './supabase';

type AuthStatus = 'loading' | 'signedOut' | 'admin';

interface AuthContextValue {
  status: AuthStatus;
  email: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(supabaseConfigError ? 'signedOut' : 'loading');
  const [email, setEmail] = useState<string | null>(null);

  // 저장된 세션이 있어도 admin인지 다시 확인한다. admin이 아니면 세션을 버린다.
  useEffect(() => {
    if (supabaseConfigError) {
      return;
    }

    let isCancelled = false;
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const user = data.session?.user;
        if (!user) {
          return null;
        }
        const check = await checkAdminRole(user.id);
        if (!check.ok) {
          await supabase.auth.signOut();
          return null;
        }
        return user.email ?? null;
      })
      .catch(() => null)
      .then((adminEmail) => {
        if (isCancelled) {
          return;
        }
        setEmail(adminEmail);
        setStatus(adminEmail === null ? 'signedOut' : 'admin');
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const signIn = useCallback(async (emailInput: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailInput, password });
    if (error || !data.user) {
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }

    const check = await checkAdminRole(data.user.id);
    if (!check.ok) {
      await supabase.auth.signOut();
      return check.message;
    }

    setEmail(data.user.email ?? emailInput);
    setStatus('admin');
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setEmail(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(() => ({ status, email, signIn, signOut }), [status, email, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있습니다.');
  }
  return value;
}
