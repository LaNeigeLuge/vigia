import { format, startOfWeek, addDays, isToday, isPast, isSameDay, parseISO, getISOWeek } from 'date-fns';
export { addDays } from 'date-fns';

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
}

export function getWeekStartKey(date: Date = new Date()): string {
  return format(getWeekStart(date), 'yyyy-MM-dd');
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatDayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDayKey(key: string): Date {
  return parseISO(key);
}

export function isDateToday(date: Date): boolean {
  return isToday(date);
}

export function isDatePast(date: Date): boolean {
  return isPast(date) && !isToday(date);
}

export function isSameDate(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}

export function getDayNumber(date: Date): string {
  return format(date, 'd');
}

export function addWeeks(date: Date, count: number): Date {
  return addDays(date, count * 7);
}

export function getISOWeekNumber(date: Date): number {
  return getISOWeek(date);
}
