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

type BookSearchStage = 'config' | 'request' | 'parse' | 'abort';

function logBookSearchFailure(stage: BookSearchStage, status?: number) {
  if (!__DEV__) {
    return;
  }

  const statusText = typeof status === 'number' ? String(status) : 'none';
  console.warn(`[book-search] stage=${stage} status=${statusText}`);
}

function searchHttpFailureMessage(status: number): string {
  if (status === 401) {
    return '카카오 도서 검색 키가 올바르지 않습니다. .env.local을 확인한 뒤 개발 서버를 다시 시작하세요.';
  }

  if (status === 403) {
    return '카카오 도서 검색 권한이 없습니다. 카카오 개발자 콘솔에서 책 검색 API 사용 설정을 확인하세요.';
  }

  if (status === 429) {
    return '검색 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  }

  return `책 검색에 실패했습니다. (${status})`;
}

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
    logBookSearchFailure('config');
    throw new Error(
      '카카오 도서 검색 키가 비어 있습니다. .env.local에 REST API 키를 넣고 개발 서버를 다시 시작하세요.',
    );
  }

  const params = new URLSearchParams({
    query: trimmed,
    size: String(BOOK_SEARCH_PAGE_SIZE),
  });

  let response: Response;
  try {
    response = await fetch(`${KAKAO_BOOK_SEARCH_URL}?${params.toString()}`, {
      headers: { Authorization: `KakaoAK ${kakaoRestApiKey}` },
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logBookSearchFailure('abort');
      throw error;
    }

    logBookSearchFailure('request');
    throw error;
  }

  if (!response.ok) {
    logBookSearchFailure('request', response.status);
    throw new Error(searchHttpFailureMessage(response.status));
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    logBookSearchFailure('parse', response.status);
    throw new Error('책 검색 응답을 읽지 못했습니다. 다시 시도해 주세요.');
  }

  const documents =
    typeof body === 'object' && body !== null && 'documents' in body && Array.isArray(body.documents)
      ? (body.documents as KakaoBookDocument[])
      : [];

  return documents.flatMap((document) => {
    const result = toSearchResult(document);
    return result ? [result] : [];
  });
}
