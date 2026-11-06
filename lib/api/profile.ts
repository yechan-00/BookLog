import { toError } from '@/lib/api/errors';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/user';

export async function fetchMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, email, role, is_suspended')
    .eq('id', userId)
    .single();

  if (error) {
    throw toError(error);
  }

  if (data.role !== 'user' && data.role !== 'admin') {
    throw new Error(`알 수 없는 역할입니다: ${data.role}`);
  }

  return {
    id: data.id,
    nickname: data.nickname,
    email: data.email,
    role: data.role,
    isSuspended: data.is_suspended,
  };
}
