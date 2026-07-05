export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function currentMonthRef(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function dateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayDay(year: number, month: number): number | null {
  const now = new Date();
  if (now.getFullYear() === year && now.getMonth() + 1 === month) {
    return now.getDate();
  }
  return null;
}

export function pctLabel(pct: number): string {
  return `${Math.round(pct * 100)}%`;
}
