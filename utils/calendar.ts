export interface CalendarCell {
  date: Date | null;
  dateKey: string | null;
}

export function getMonthGrid(year: number, monthIndex: number): CalendarCell[] {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ date: null, dateKey: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    const month = String(monthIndex + 1).padStart(2, '0');
    const dayText = String(day).padStart(2, '0');
    cells.push({ date, dateKey: `${year}-${month}-${dayText}` });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, dateKey: null });
  }

  return cells;
}

export function shiftMonth(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}
