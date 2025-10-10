import { Habit, HabitStats, Streak } from '@/types';
import { getDateForDay, formatDate, startDate } from './dateUtils';

export interface Badge {
    name: string;
    level: number;
    minDays: number;
    color: string;
    emoji: string;
}

export const badges: Badge[] = [
    { name: 'Saiyan', level: 1, minDays: 3, color: 'bg-yellow-100 text-yellow-700', emoji: '⚡' },
    { name: 'Super Saiyan', level: 2, minDays: 7, color: 'bg-amber-100 text-amber-700', emoji: '🔥' },
    { name: 'Super Saiyan 2', level: 3, minDays: 21, color: 'bg-orange-100 text-orange-700', emoji: '⭐' },
    { name: 'Super Saiyan 3', level: 4, minDays: 45, color: 'bg-red-100 text-red-700', emoji: '💫' },
    { name: 'Super Saiyan 4', level: 5, minDays: 60, color: 'bg-purple-100 text-purple-700', emoji: '👑' },
];

export const getBadgeForStreak = (streakDays: number): Badge | null => {
    // Retourne le badge le plus élevé atteint
    for (let i = badges.length - 1; i >= 0; i--) {
        if (streakDays >= badges[i].minDays) {
            return badges[i];
        }
    }
    return null;
};

export const getCurrentDayIndex = (): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
};

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

    // Calculer la progression basée sur le nombre de cases cochées
    const totalDays = linkedHabits.reduce((sum, h) => sum + h.totalDays, 0);
    const completedDays = linkedHabits.reduce((sum, h) => {
        return sum + h.progress.filter(Boolean).length;
    }, 0);

    if (totalDays === 0) return 0;

    return Math.round((completedDays / totalDays) * 100);
};

export const getHabitProgressForMonth = (habit: Habit, month: number, year: number): boolean[] => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const startIndex = Math.max(0, Math.floor((monthStart.getTime() - new Date(2025, 9, 1).getTime()) / (1000 * 60 * 60 * 24)));
    const endIndex = Math.min(habit.progress.length - 1, Math.floor((monthEnd.getTime() - new Date(2025, 9, 1).getTime()) / (1000 * 60 * 60 * 24)));

    return habit.progress.slice(startIndex, endIndex + 1);
};
