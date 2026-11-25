import { router } from 'expo-router';

import { beginReadingSession, loadActiveSession } from '@/lib/reading/activeSession';
import { appConfirm } from '@/lib/ui/appDialog';
import type { BookStatus } from '@/types/book';
import { bookStatusLabel } from '@/utils/book';

async function openReading(userBookId: string, currentPage: number): Promise<void> {
  const result = beginReadingSession(userBookId, currentPage);

  if (result.kind === 'busy') {
    const go = await appConfirm({
      title: '이미 진행 중인 독서가 있어요',
      message: '진행 중인 독서를 먼저 마쳐 주세요.',
      confirmLabel: '진행 중인 독서로 이동',
      cancelLabel: '취소',
    });
    if (go) {
      router.push({ pathname: '/reading/session', params: { userBookId: result.userBookId } });
    }
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
  void startReadingAsync(userBookId, currentPage, status);
}

async function startReadingAsync(
  userBookId: string,
  currentPage: number,
  status?: BookStatus,
): Promise<void> {
  const isResuming = loadActiveSession()?.userBookId === userBookId;
  const willChangeStatus = status === 'wishlist' || status === 'paused';

  if (!willChangeStatus || isResuming) {
    await openReading(userBookId, currentPage);
    return;
  }

  const confirmed = await appConfirm({
    title: "'읽는 중'으로 바뀌어요",
    message: `지금은 '${bookStatusLabel[status]}' 상태예요. 독서를 저장하면 이 책이 '읽는 중'이 돼요.`,
    confirmLabel: '시작하기',
    cancelLabel: '취소',
  });
  if (confirmed) {
    await openReading(userBookId, currentPage);
  }
}
