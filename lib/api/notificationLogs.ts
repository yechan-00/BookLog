import { supabase } from '@/lib/supabase';

/** Postgres codes where retrying the same row can never work: foreign key (goal not yours) and invalid input. */
const PERMANENT_ERROR_CODES = ['23503', '22P02', '22007'];

export class NotificationLogError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code: string | undefined) {
    super(message);
    this.name = 'NotificationLogError';
    this.code = code;
  }
}

export function isPermanentNotificationLogError(error: unknown): boolean {
  return error instanceof NotificationLogError && error.code !== undefined && PERMANENT_ERROR_CODES.includes(error.code);
}

/** Records one engagement reminder whose scheduled time has passed (NOTI-02). user_id comes from the session. */
export async function insertEngagementLog(input: { goalId: string; sentAt: string }): Promise<void> {
  const { error } = await supabase
    .from('notification_logs')
    .insert({ goal_id: input.goalId, kind: 'engagement', sent_at: input.sentAt });

  if (error) {
    throw new NotificationLogError(error.message, error.code);
  }
}
