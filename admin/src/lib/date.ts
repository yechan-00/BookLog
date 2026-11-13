/** 기기 로컬 날짜를 YYYY-MM-DD로 만든다. toISOString은 UTC라 자정 근처에 하루가 어긋난다. */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDate(value: string | null): string {
  if (!value) {
    return '-';
  }
  return value.slice(0, 10);
}
