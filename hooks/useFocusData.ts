import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

type FocusDataState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };

/**
 * Loads on every screen focus, so data is fresh after coming back from another screen.
 * `load` must be stable (wrap it in useCallback).
 */
export function useFocusData<T>(
  load: () => Promise<T>,
): FocusDataState<T> & { reload: () => void; refresh: () => void } {
  const [state, setState] = useState<FocusDataState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;

      load().then(
        (data) => {
          if (!isCancelled) {
            setState({ status: 'ready', data });
          }
        },
        (error: unknown) => {
          if (!isCancelled) {
            setState({
              status: 'error',
              message: error instanceof Error ? error.message : '불러오지 못했습니다.',
            });
          }
        },
      );

      return () => {
        isCancelled = true;
      };
      // attempt re-runs the load when the user taps retry.
    }, [load, attempt]),
  );

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((count) => count + 1);
  }, []);

  // Loads again but keeps showing the current data, for changes the user just made on the same screen.
  const refresh = useCallback(() => setAttempt((count) => count + 1), []);

  return { ...state, reload, refresh };
}
