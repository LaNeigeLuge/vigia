import { format, startOfWeek, addDays, isToday, isPast, isSameDay, parseISO, getISOWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
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

export function formatWeekLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  return `Semaine du ${format(weekStart, 'd MMMM', { locale: fr })} au ${format(end, 'd MMMM yyyy', { locale: fr })}`;
}

export function getDayLabel(date: Date): string {
  return format(date, 'EEE', { locale: fr });
}

export function getDayNumber(date: Date): string {
  return format(date, 'd');
}

export function getMonthLabel(date: Date): string {
  return format(date, 'MMM', { locale: fr });
}

export function addWeeks(date: Date, count: number): Date {
  return addDays(date, count * 7);
}

// ─── French labels (Today screen) ───────────────────────────────────────────

export function getWeekdayLabelFr(date: Date): string {
  return format(date, 'EEEE', { locale: fr });
}

export function getMonthYearLabelFr(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: fr });
}

export function getISOWeekNumber(date: Date): number {
  return getISOWeek(date);
}
