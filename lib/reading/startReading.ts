import { router } from 'expo-router';
import { Alert } from 'react-native';

import { beginReadingSession, loadActiveSession } from '@/lib/reading/activeSession';
import type { BookStatus } from '@/types/book';
import { bookStatusLabel } from '@/utils/book';

function openReading(userBookId: string, currentPage: number): void {
  const result = beginReadingSession(userBookId, currentPage);

  if (result.kind === 'busy') {
    Alert.alert('이미 진행 중인 독서가 있어요', '진행 중인 독서를 먼저 마쳐 주세요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '진행 중인 독서로 이동',
        onPress: () =>
          router.push({ pathname: '/reading/session', params: { userBookId: result.userBookId } }),
      },
    ]);
    return;
  }

  router.push({ pathname: '/reading/session', params: { userBookId } });
}

/**
 * Starts or resumes the session, then opens the reading screen. Every "read" button goes through here.
 * Pass `status` when the book may not be "reading" yet: saving the session moves a wishlist or paused
 * book to "reading", so the reader is told first. Leave it out when the book is already being read.
 */
export function startReading(userBookId: string, currentPage: number, status?: BookStatus): void {
  const isResuming = loadActiveSession()?.userBookId === userBookId;
  const willChangeStatus = status === 'wishlist' || status === 'paused';

  if (!willChangeStatus || isResuming) {
    openReading(userBookId, currentPage);
    return;
  }

  Alert.alert(
    "'읽는 중'으로 바뀌어요",
    `지금은 '${bookStatusLabel[status]}' 상태예요. 독서를 저장하면 이 책이 '읽는 중'이 돼요.`,
    [
      { text: '취소', style: 'cancel' },
      { text: '시작하기', onPress: () => openReading(userBookId, currentPage) },
    ],
  );
}
