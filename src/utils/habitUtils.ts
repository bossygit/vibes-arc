import { Habit, HabitStats, Streak } from '@/types';
import { getDateForDay, formatDate } from './dateUtils';

export const calculateHabitStats = (habit: Habit): HabitStats => {
    const completed = habit.progress.filter(Boolean).length;
    const percentage = Math.round((completed / habit.totalDays) * 100);

    // Calculate current streak (from the beginning)
    let currentStreak = 0;
    for (let i = 0; i < habit.progress.length; i++) {
        if (habit.progress[i]) currentStreak++;
        else break;
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < habit.progress.length; i++) {
        if (habit.progress[i]) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            tempStreak = 0;
        }
    }

    // Calculate all streaks
    const streaks: Streak[] = [];
    let currentStreakStart: number | null = null;
    tempStreak = 0;

    for (let i = 0; i < habit.progress.length; i++) {
        if (habit.progress[i]) {
            if (tempStreak === 0) {
                currentStreakStart = i;
            }
            tempStreak++;
        } else {
            if (tempStreak > 0) {
                const startDate = getDateForDay(currentStreakStart!);
                const endDate = getDateForDay(currentStreakStart! + tempStreak - 1);
                streaks.push({
                    length: tempStreak,
                    startDate: formatDate(startDate),
                    endDate: formatDate(endDate)
                });
                tempStreak = 0;
            }
        }
    }

    // Add the last streak if it exists
    if (tempStreak > 0) {
        const startDate = getDateForDay(currentStreakStart!);
        const endDate = getDateForDay(currentStreakStart! + tempStreak - 1);
        streaks.push({
            length: tempStreak,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
        });
    }

    return { completed, percentage, currentStreak, longestStreak, streaks, totalDays: habit.totalDays };
};

export const calculateIdentityScore = (identityId: number, habits: Habit[]): number => {
    const linkedHabits = habits.filter(h =>
        h.linkedIdentities.includes(identityId)
    );
    if (linkedHabits.length === 0) return 0;

    const avgPercentage = linkedHabits.reduce((sum, h) => {
        return sum + calculateHabitStats(h).percentage;
    }, 0) / linkedHabits.length;

    return Math.round(avgPercentage);
};

export const getHabitProgressForMonth = (habit: Habit, month: number, year: number): boolean[] => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const startIndex = Math.max(0, Math.floor((monthStart.getTime() - new Date(2025, 9, 1).getTime()) / (1000 * 60 * 60 * 24)));
    const endIndex = Math.min(habit.progress.length - 1, Math.floor((monthEnd.getTime() - new Date(2025, 9, 1).getTime()) / (1000 * 60 * 60 * 24)));

    return habit.progress.slice(startIndex, endIndex + 1);
};
