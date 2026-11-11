export type TotalPagesResult =
  | { valid: true; pages: number }
  | { valid: false; message: string };

const INVALID_MESSAGE = '1 이상의 정수를 입력해 주세요.';

/** Accepts a required integer of 1 or more. Rejects blanks, decimals, signs, and leading zeros. */
export function parseTotalPages(value: string): TotalPagesResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, message: '총 페이지를 입력해 주세요.' };
  }

  if (!/^[1-9]\d*$/.test(trimmed)) {
    return { valid: false, message: INVALID_MESSAGE };
  }

  const pages = Number(trimmed);
  if (!Number.isSafeInteger(pages) || pages < 1) {
    return { valid: false, message: INVALID_MESSAGE };
  }

  return { valid: true, pages };
}
