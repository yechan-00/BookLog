import { router, useNavigation } from 'expo-router';
import { useCallback } from 'react';

const BOOK_DETAIL_ROUTE = 'book/[id]';

function routeBookId(params: unknown): string | null {
  if (typeof params !== 'object' || params === null || !('id' in params)) {
    return null;
  }
  const { id } = params as { id: unknown };
  return typeof id === 'string' ? id : null;
}

/**
 * Leaves the reading flow (session → finish → complete) for the book detail screen.
 * When the reading started from detail, it pops back to that screen. When it started elsewhere
 * (home card), `dismissTo` would only replace the top screen and leave the finished session
 * screen underneath, so the flow is cleared first and detail opens on top of the tabs.
 */
export function useReturnToBookDetail(): (userBookId: string) => void {
  const navigation = useNavigation();

  return useCallback(
    (userBookId: string) => {
      const routes = navigation.getState()?.routes ?? [];
      const hasDetail = routes.some(
        (route) => route.name === BOOK_DETAIL_ROUTE && routeBookId(route.params) === userBookId,
      );

      if (hasDetail) {
        router.dismissTo({ pathname: '/book/[id]', params: { id: userBookId } });
        return;
      }

      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.push({ pathname: '/book/[id]', params: { id: userBookId } });
    },
    [navigation],
  );
}
