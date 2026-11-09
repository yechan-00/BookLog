import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { loadActiveSession } from '@/lib/reading/activeSession';

/**
 * Asks once per app launch what to do with a session left over from a killed app (READ-01).
 * Navigation happens only from the button handlers, after the navigator is mounted.
 */
export function ResumeSessionPrompt() {
  useEffect(() => {
    const session = loadActiveSession();
    if (!session) {
      return;
    }

    const params = { userBookId: session.userBookId };
    Alert.alert(
      '진행 중인 독서가 있어요',
      '이어서 읽거나, 지금 종료하고 기록을 남길 수 있어요.',
      [
        { text: '종료하기', onPress: () => router.push({ pathname: '/reading/finish', params }) },
        { text: '이어하기', onPress: () => router.push({ pathname: '/reading/session', params }) },
      ],
      { cancelable: false },
    );
  }, []);

  return null;
}
