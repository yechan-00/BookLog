import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Calls `onReturn` when the app goes background → active.
 * iOS passes through `inactive` (e.g. control center), which must not count as leaving.
 */
export function useFocusReturn(onReturn: () => void): void {
  const handlerRef = useRef(onReturn);

  useEffect(() => {
    handlerRef.current = onReturn;
  });

  useEffect(() => {
    let wasInBackground = false;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        wasInBackground = true;
        return;
      }

      if (state === 'active' && wasInBackground) {
        wasInBackground = false;
        handlerRef.current();
      }
    });

    return () => subscription.remove();
  }, []);
}
