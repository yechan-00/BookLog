import { syncEngagementReminder } from '@/lib/notifications/engagement';
import type { SyncEngagementReminderResult } from '@/lib/notifications/types';
import type { StoredReadingGoal } from '@/types/goal';
import { startOfToday, toDateKey } from '@/utils/date';
import { engagementInputFromGoal, listAchievedDateKeys } from '@/utils/notificationGoals';
import { loadReadingHistory } from '@/utils/readingSource';

/** Rebuilds engagement schedules from a stored goal, excluding already-achieved days. */
export async function syncEngagementFromStoredGoal(
  goal: StoredReadingGoal | null,
): Promise<SyncEngagementReminderResult> {
  if (!goal) {
    return syncEngagementReminder({ goal: null, achievedDates: [] });
  }

  const engagement = engagementInputFromGoal(goal);
  if (!engagement) {
    return {
      status: 'failed',
      scheduled: [],
      cancelledIds: [],
      reason: '알림 시간이 없어 예약을 만들지 못했습니다.',
    };
  }

  if (!engagement.enabled) {
    return syncEngagementReminder({ goal: engagement, achievedDates: [] });
  }

  try {
    const history = await loadReadingHistory();
    const todayKey = toDateKey(startOfToday());
    const achievedDates = listAchievedDateKeys({
      todayKey,
      goals: history.goals,
      activities: history.activities,
    });
    return syncEngagementReminder({ goal: engagement, achievedDates });
  } catch {
    // Goal save should still succeed; schedule without achieved-day filtering if history fails.
    return syncEngagementReminder({ goal: engagement, achievedDates: [] });
  }
}

export function describeEngagementSync(result: SyncEngagementReminderResult): string {
  switch (result.status) {
    case 'synced':
      return result.scheduled.length > 0
        ? `참여 유도 알림 ${result.scheduled.length}건을 예약했습니다.`
        : '참여 유도 알림을 갱신했습니다. 예약할 일정이 없습니다.';
    case 'cleared':
      return '참여 유도 알림 예약을 취소했습니다.';
    case 'permission_denied':
      return '알림 권한이 없어 참여 유도 알림을 예약하지 못했습니다.';
    case 'failed':
      return result.reason ?? '참여 유도 알림을 예약하지 못했습니다.';
    default:
      return '참여 유도 알림 상태를 확인하지 못했습니다.';
  }
}
