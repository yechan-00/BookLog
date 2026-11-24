import { INDEX_COLOR_OPTIONS, MAX_INDEX_TAG_LENGTH, MAX_INDEX_TAGS } from '@/constants/bookIndex';

export type AddTagResult = { tags: string[]; error: null } | { tags: string[]; error: string };

/** 앞의 '#'과 여분의 공백을 걷어 낸다. 비어 있으면 빈 문자열이 된다. */
export function normalizeTag(raw: string): string {
  return raw.replace(/^#+/, '').replace(/\s+/g, ' ').trim();
}

/** 입력 하나를 태그 목록에 더한다. 빈 값과 중복은 조용히 무시하고, 길이·개수 초과만 오류로 돌려준다. */
export function addTag(tags: readonly string[], raw: string): AddTagResult {
  const tag = normalizeTag(raw);
  const current = [...tags];

  if (tag.length === 0) {
    return { tags: current, error: null };
  }

  if (tag.length > MAX_INDEX_TAG_LENGTH) {
    return { tags: current, error: `태그는 ${MAX_INDEX_TAG_LENGTH}자 이하로 입력해 주세요.` };
  }

  if (current.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
    return { tags: current, error: null };
  }

  if (current.length >= MAX_INDEX_TAGS) {
    return { tags: current, error: `태그는 최대 ${MAX_INDEX_TAGS}개까지 넣을 수 있어요.` };
  }

  return { tags: [...current, tag], error: null };
}

/** 저장 직전 검증. 문제가 있으면 사용자에게 보여 줄 문장으로 던진다. */
export function validateTags(tags: readonly string[]): string[] {
  let result: string[] = [];

  for (const raw of tags) {
    const next = addTag(result, raw);
    if (next.error !== null) {
      throw new Error(next.error);
    }
    result = next.tags;
  }

  return result;
}

/** 저장된 색상이 선택 가능한 팔레트에 있을 때만 쓴다. 외부에서 온 값은 믿지 않는다. */
export function parseIndexColor(value: unknown): string | null {
  return typeof value === 'string' && INDEX_COLOR_OPTIONS.includes(value) ? value : null;
}

/** 저장된 태그를 문자열 배열로 좁힌다. 형식이 어긋난 항목은 버린다. */
export function parseStoredTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}
