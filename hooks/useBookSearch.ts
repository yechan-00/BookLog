import { useEffect, useRef, useState } from 'react';

import { BOOK_SEARCH_DEBOUNCE_MS } from '@/constants/kakao';
import { searchBooks } from '@/lib/api/kakaoBooks';
import type { BookSearchResult } from '@/types/book';
import { publicErrorMessage } from '@/utils/publicError';

export type BookSearchPhase = 'idle' | 'loading' | 'ready' | 'error';

const SEARCH_FAILURE = '책 검색에 실패했습니다. 다시 시도해 주세요.';

export function useBookSearch(query: string) {
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [phase, setPhase] = useState<BookSearchPhase>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const generation = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const trimmedRef = useRef('');
  const seenRetry = useRef(0);
  const inFlightEpoch = useRef<number | null>(null);
  const settledQuery = useRef<string | null>(null);
  const phaseRef = useRef<BookSearchPhase>('idle');
  phaseRef.current = phase;

  useEffect(() => {
    const trimmed = query.trim();
    const trimChanged = trimmed !== trimmedRef.current;
    const retryChanged = retryCount !== seenRetry.current;
    trimmedRef.current = trimmed;
    seenRetry.current = retryCount;

    if (trimChanged || retryChanged) {
      generation.current += 1;
      abortRef.current?.abort();
      inFlightEpoch.current = null;
    }

    const epoch = generation.current;

    if (!trimmed) {
      settledQuery.current = null;
      setResults([]);
      setPhase('idle');
      setErrorMessage(null);
      return;
    }

    const timer = setTimeout(() => {
      if (epoch !== generation.current) {
        return;
      }
      if (settledQuery.current === trimmed && phaseRef.current === 'ready') {
        return;
      }
      if (inFlightEpoch.current === epoch && phaseRef.current === 'loading') {
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      inFlightEpoch.current = epoch;
      settledQuery.current = trimmed;
      setPhase('loading');
      setErrorMessage(null);

      searchBooks(trimmed, controller.signal)
        .then((items) => {
          if (epoch !== generation.current) {
            return;
          }
          inFlightEpoch.current = null;
          setResults(items);
          setPhase('ready');
        })
        .catch((error: unknown) => {
          if (epoch !== generation.current) {
            return;
          }
          inFlightEpoch.current = null;
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          setResults([]);
          setErrorMessage(publicErrorMessage(error, SEARCH_FAILURE));
          setPhase('error');
        });
    }, BOOK_SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query, retryCount]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      generation.current += 1;
    };
  }, []);

  return {
    results,
    phase,
    errorMessage,
    retry: () => setRetryCount((count) => count + 1),
  };
}
