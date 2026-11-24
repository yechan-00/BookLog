import { toError } from '@/lib/api/errors';
import { supabase } from '@/lib/supabase';
import { toDateKey } from '@/utils/date';
import type { DustLevel } from '@/utils/shelfDust';

export interface DustWipeRecord {
  userBookId: string;
  /** Local YYYY-MM-DD from wiped_at. */
  wipedOn: string;
  wipedAt: string;
  dustLevel: DustLevel;
}

function toDustLevel(value: number): DustLevel | null {
  if (value === 0 || value === 1 || value === 2 || value === 3) {
    return value;
  }
  return null;
}

/** Latest wipe per user book for the signed-in user (RLS). */
export async function fetchDustWipes(): Promise<DustWipeRecord[]> {
  const { data, error } = await supabase
    .from('dust_wipe_logs')
    .select('user_book_id, wiped_at, dust_level')
    .order('wiped_at', { ascending: false });

  if (error) {
    throw toError(error);
  }

  const latest = new Map<string, DustWipeRecord>();
  for (const row of data ?? []) {
    if (latest.has(row.user_book_id)) {
      continue;
    }
    const level = toDustLevel(row.dust_level);
    if (level === null) {
      continue;
    }
    const wipedAt = row.wiped_at;
    latest.set(row.user_book_id, {
      userBookId: row.user_book_id,
      wipedAt,
      wipedOn: toDateKey(new Date(wipedAt)),
      dustLevel: level,
    });
  }

  return [...latest.values()];
}

export async function saveDustWipe(input: {
  userBookId: string;
  dustLevel: DustLevel;
  wipedAt?: string;
}): Promise<DustWipeRecord> {
  if (!input.userBookId.trim()) {
    throw new Error('책 정보가 없습니다.');
  }

  const wipedAt = input.wipedAt ?? new Date().toISOString();
  const { data, error } = await supabase
    .from('dust_wipe_logs')
    .insert({
      user_book_id: input.userBookId,
      dust_level: input.dustLevel,
      wiped_at: wipedAt,
    })
    .select('user_book_id, wiped_at, dust_level')
    .single();

  if (error) {
    throw toError(error);
  }

  const level = toDustLevel(data.dust_level);
  if (level === null) {
    throw new Error('먼지 단계가 올바르지 않습니다.');
  }

  return {
    userBookId: data.user_book_id,
    wipedAt: data.wiped_at,
    wipedOn: toDateKey(new Date(data.wiped_at)),
    dustLevel: level,
  };
}
