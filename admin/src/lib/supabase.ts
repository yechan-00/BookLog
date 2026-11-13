import { createClient } from '@supabase/supabase-js';

import type { Database } from '../../../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigError: string | null =
  !supabaseUrl || !supabasePublishableKey
    ? 'admin/.env.local에 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 넣고 개발 서버를 다시 시작하세요. (admin/.env.example 참고)'
    : null;

// 설정이 없어도 import 단계에서 죽지 않도록 자리 값을 넣고, 화면에서 supabaseConfigError를 먼저 보여준다.
export const supabase = createClient<Database>(
  supabaseUrl || 'http://127.0.0.1:54321',
  supabasePublishableKey || 'missing-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
);
