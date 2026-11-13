import { toError } from '@/lib/api/errors';
import { toBookIndex } from '@/lib/api/mappers';
import { supabase } from '@/lib/supabase';
import type { BookIndex } from '@/types/reading';
import { parseIndexColor, validateTags } from '@/utils/bookIndex';

interface AddIndexInput {
  userBookId: string;
  page: number;
  title: string;
  quote: string;
  color: string | null;
  tags: string[];
}

export async function addIndex(input: AddIndexInput): Promise<BookIndex> {
  const title = input.title.trim();
  if (title.length === 0) {
    throw new Error('짧은 제목을 입력해 주세요.');
  }

  if (!Number.isInteger(input.page) || input.page < 0) {
    throw new Error('페이지는 0 이상의 정수여야 합니다.');
  }

  if (input.color !== null && parseIndexColor(input.color) === null) {
    throw new Error('선택할 수 없는 색상입니다.');
  }

  const tags = validateTags(input.tags);
  const quote = input.quote.trim();
  const { data, error } = await supabase
    .from('book_indexes')
    .insert({
      user_book_id: input.userBookId,
      page: input.page,
      title,
      quote: quote.length > 0 ? quote : null,
      color: input.color,
      tags,
    })
    .select('*')
    .single();

  if (error) {
    throw toError(error);
  }

  return toBookIndex(data);
}

/** Page ascending, as INDEX-02 requires. */
export async function fetchIndexes(userBookId: string): Promise<BookIndex[]> {
  const { data, error } = await supabase
    .from('book_indexes')
    .select('*')
    .eq('user_book_id', userBookId)
    .order('page', { ascending: true });

  if (error) {
    throw toError(error);
  }

  return data.map(toBookIndex);
}

export async function deleteIndex(indexId: string): Promise<void> {
  const { data, error } = await supabase.from('book_indexes').delete().eq('id', indexId).select('id');

  if (error) {
    throw toError(error);
  }

  // RLS hides other users' rows instead of failing, so an empty result means nothing was deleted.
  if (data.length === 0) {
    throw new Error('삭제할 인덱스를 찾지 못했습니다.');
  }
}
