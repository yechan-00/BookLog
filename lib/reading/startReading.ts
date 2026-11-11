import { router } from 'expo-router';
import { Alert } from 'react-native';

import { beginReadingSession } from '@/lib/reading/activeSession';

/** Starts or resumes the session, then opens the reading screen. Every "read" button goes through here. */
export function startReading(userBookId: string, currentPage: number): void {
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
