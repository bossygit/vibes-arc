import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, differenceInCalendarDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export const startDate = new Date(2025, 9, 1); // October 1, 2025
export const endDate = new Date(2026, 11, 31); // December 31, 2026
export const totalDays = differenceInCalendarDays(endDate, startDate) + 1;

export const getDateForDay = (dayIndex: number): Date => {
    return addDays(startDate, dayIndex);
};

export const formatDate = (date: Date): string => {
    return format(date, 'dd/MM', { locale: fr });
};

export const formatDateFull = (date: Date): string => {
    return format(date, 'dd MMMM yyyy', { locale: fr });
};

export const getMonthDays = (month: number, year: number) => {
    const monthStart = startOfMonth(new Date(year, month));
    const monthEnd = endOfMonth(new Date(year, month));
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
};

export const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay();
};

export const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

export const isFuture = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
};

/**
 * Date locale (fuseau du navigateur) au format YYYY-MM-DD.
 * À utiliser pour dater les entrées liées à la journée vécue (journal, check-ins)
 * — contrairement à `toISOString().slice(0,10)` qui renvoie la date UTC.
 */
export const todayLocalISO = (date: Date = new Date()): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
