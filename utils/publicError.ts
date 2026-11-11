const SENSITIVE = /expo_public_|api[_ -]?key|kakaoak|authorization|bearer |password|secret|service[_ ]?role|eyJ/i;

/** Turns an unknown failure into a message that is safe to show in the UI. */
export function publicErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (!message || SENSITIVE.test(message)) {
    return fallback;
  }

  if (error.name === 'TypeError' || /network request failed|failed to fetch|network error/i.test(message)) {
    return '네트워크 연결을 확인해 주세요.';
  }

  if (/row-level security|42501|permission denied/i.test(message)) {
    return '이 책을 서재에 저장할 권한이 없습니다.';
  }

  return message;
}
