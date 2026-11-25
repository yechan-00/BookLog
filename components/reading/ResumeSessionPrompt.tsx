import { router } from 'expo-router';
import { useState } from 'react';

import { ConfirmSheet } from '@/components/common/ConfirmSheet';
import { loadActiveSession } from '@/lib/reading/activeSession';

/**
 * Asks once per app launch what to do with a session left over from a killed app (READ-01).
 * Navigation happens only from the button handlers, after the navigator is mounted.
 */
export function ResumeSessionPrompt() {
  const [session] = useState(() => loadActiveSession());
  const [open, setOpen] = useState(() => session !== null);
  const userBookId = session?.userBookId ?? null;
  const params = userBookId ? { userBookId } : null;

  return (
    <ConfirmSheet
      visible={open && params !== null}
      title="진행 중인 독서가 있어요"
      message="이어서 읽거나, 지금 종료하고 기록을 남길 수 있어요."
      confirmLabel="이어하기"
      cancelLabel="종료하기"
      dismissOnBackdrop={false}
      onConfirm={() => {
        if (!params) {
          return;
        }
        setOpen(false);
        router.push({ pathname: '/reading/session', params });
      }}
      onCancel={() => {
        if (!params) {
          return;
        }
        setOpen(false);
        router.push({ pathname: '/reading/finish', params });
      }}
    />
  );
}
