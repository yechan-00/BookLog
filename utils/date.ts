export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year || 1970, (month || 1) - 1, day || 1);
}

export function dateKeyOffset(offset: number): string {
  return toDateKey(addDays(startOfToday(), offset));
}

export function atTime(dateKey: string, hours: number, minutes: number): string {
  const date = parseDateKey(dateKey);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function startOfWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = copy.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  copy.setDate(copy.getDate() + mondayOffset);
  return copy;
}

export function isDateKeyWithin(dateKey: string, start: Date, end: Date): boolean {
  return dateKey >= toDateKey(start) && dateKey <= toDateKey(end);
}

export function dateInPreviousMonth(dayOfMonth: number): string {
  const today = startOfToday();
  const previous = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDay = new Date(previous.getFullYear(), previous.getMonth() + 1, 0).getDate();
  const day = Math.min(Math.max(dayOfMonth, 1), lastDay);
  return toDateKey(new Date(previous.getFullYear(), previous.getMonth(), day));
}

export function isInMonth(dateKey: string | null, date: Date): boolean {
  if (!dateKey) {
    return false;
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  return dateKey.startsWith(`${date.getFullYear()}-${month}`);
}
