import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

function missingSupabaseEnvMessage(): string {
  const missing: string[] = [];

  if (!supabaseUrl) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
  }

  if (!supabasePublishableKey) {
    missing.push('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }

  return [
    `Supabase 환경변수가 비어 있습니다: ${missing.join(', ')}.`,
    '프로젝트 루트의 .env.local에 Publishable Key와 Project URL을 넣은 뒤 개발 서버를 다시 시작하세요.',
    'service_role 키, secret key, 데이터베이스 비밀번호는 사용하지 않습니다.',
  ].join(' ');
}

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(missingSupabaseEnvMessage());
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const authRefreshFlag = '__booklogSupabaseAuthRefreshBound';

type AuthRefreshGlobal = typeof globalThis & {
  [authRefreshFlag]?: boolean;
};

const runtimeGlobal = globalThis as AuthRefreshGlobal;

if (!runtimeGlobal[authRefreshFlag]) {
  runtimeGlobal[authRefreshFlag] = true;

  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
      return;
    }

    void supabase.auth.stopAutoRefresh();
  });
}
