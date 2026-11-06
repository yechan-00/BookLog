import { BOOK_SEARCH_PAGE_SIZE, KAKAO_BOOK_SEARCH_URL } from '@/constants/kakao';
import type { BookSearchResult } from '@/types/book';

interface KakaoBookDocument {
  title?: unknown;
  authors?: unknown;
  publisher?: unknown;
  isbn?: unknown;
  thumbnail?: unknown;
}

const kakaoRestApiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY?.trim();

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toSearchResult(document: KakaoBookDocument): BookSearchResult | null {
  const title = asString(document.title).trim();
  if (!title) {
    return null;
  }

  const authors = Array.isArray(document.authors)
    ? document.authors.filter((author): author is string => typeof author === 'string')
    : [];
  const thumbnail = asString(document.thumbnail);

  return {
    isbn: asString(document.isbn).trim(),
    title,
    author: authors.join(', '),
    publisher: asString(document.publisher),
    coverImageUrl: thumbnail || null,
  };
}

/** Searches Kakao books by title. Pass the screen's AbortSignal so stale requests are cancelled. */
export async function searchBooks(query: string, signal?: AbortSignal): Promise<BookSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  if (!kakaoRestApiKey) {
    throw new Error(
      'EXPO_PUBLIC_KAKAO_REST_API_KEY가 비어 있습니다. .env.local에 카카오 REST API 키를 넣고 개발 서버를 다시 시작하세요.',
    );
  }

  const params = new URLSearchParams({
    query: trimmed,
    size: String(BOOK_SEARCH_PAGE_SIZE),
  });
  const response = await fetch(`${KAKAO_BOOK_SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${kakaoRestApiKey}` },
    signal,
  });

  if (!response.ok) {
    throw new Error(`책 검색에 실패했습니다. (${response.status})`);
  }

  const body: unknown = await response.json();
  const documents =
    typeof body === 'object' && body !== null && 'documents' in body && Array.isArray(body.documents)
      ? (body.documents as KakaoBookDocument[])
      : [];

  return documents.flatMap((document) => {
    const result = toSearchResult(document);
    return result ? [result] : [];
  });
}
