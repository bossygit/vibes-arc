import { Identity, Habit, SkipsByHabit, GamificationState } from '@/types';
import { calculateHabitStats } from './habitUtils';

export interface WeeklyReport {
    weekStart: Date;
    weekEnd: Date;
    habits: {
        total: number;
        completed: number;
        completionRate: number;
        topPerforming: Habit[];
        struggling: Habit[];
        newStreaks: number;
        brokenStreaks: number;
    };
    identities: {
        total: number;
        active: number;
        progress: Array<{
            identity: Identity;
            habitsCount: number;
            completionRate: number;
        }>;
    };
    gamification: {
        pointsEarned: number;
        rewardsClaimed: number;
        challengesCompleted: number;
        currentPoints: number;
    };
    insights: string[];
    nextWeekGoals: string[];
}

export function generateWeeklyReport(
    identities: Identity[],
    habits: Habit[],
    skipsByHabit: SkipsByHabit,
    gamification: GamificationState,
    weekStart: Date = getWeekStart(new Date())
): WeeklyReport {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Calculer les statistiques des habitudes
    const habitStats = habits.map(habit => {
        const stats = calculateHabitStats(habit, skipsByHabit[habit.id] || []);
        return { habit, stats };
    });

    const totalHabits = habits.length;
    const completedHabits = habitStats.filter(h => h.stats.percentage > 0).length;
    const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

    // Top habitudes performantes (completion rate > 80%)
    const topPerforming = habitStats
        .filter(h => h.stats.percentage >= 80)
        .sort((a, b) => b.stats.percentage - a.stats.percentage)
        .slice(0, 3)
        .map(h => h.habit);

    // Habitudes en difficulté (completion rate < 30%)
    const struggling = habitStats
        .filter(h => h.stats.percentage < 30)
        .sort((a, b) => a.stats.percentage - b.stats.percentage)
        .slice(0, 3)
        .map(h => h.habit);

    // Nouvelles séries et séries cassées
    const newStreaks = habitStats.filter(h => h.stats.currentStreak >= 3).length;
    const brokenStreaks = habitStats.filter(h => h.stats.currentStreak === 0 && h.stats.longestStreak > 0).length;

    // Statistiques des identités
    const identityProgress = identities.map(identity => {
        const identityHabits = habits.filter(h => h.linkedIdentities.includes(identity.id));
        const identityStats = identityHabits.map(habit => 
            calculateHabitStats(habit, skipsByHabit[habit.id] || [])
        );
        const avgCompletionRate = identityStats.length > 0 
            ? identityStats.reduce((sum, stats) => sum + stats.percentage, 0) / identityStats.length
            : 0;

        return {
            identity,
            habitsCount: identityHabits.length,
            completionRate: avgCompletionRate
        };
    });

    const activeIdentities = identityProgress.filter(ip => ip.habitsCount > 0).length;

    // Statistiques de gamification
    const pointsEarned = gamification.points; // Simplification - en réalité il faudrait calculer la différence
    const rewardsClaimed = gamification.rewards.filter(r => r.claimedAt).length;
    const challengesCompleted = gamification.challenges.filter(c => c.completedAt).length;

    // Générer des insights
    const insights = generateInsights(completionRate, topPerforming, struggling, newStreaks, brokenStreaks);
    
    // Objectifs pour la semaine suivante
    const nextWeekGoals = generateNextWeekGoals(struggling, completionRate, newStreaks);

    return {
        weekStart,
        weekEnd,
        habits: {
            total: totalHabits,
            completed: completedHabits,
            completionRate,
            topPerforming,
            struggling,
            newStreaks,
            brokenStreaks
        },
        identities: {
            total: identities.length,
            active: activeIdentities,
            progress: identityProgress
        },
        gamification: {
            pointsEarned,
            rewardsClaimed,
            challengesCompleted,
            currentPoints: gamification.points
        },
        insights,
        nextWeekGoals
    };
}

function getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Lundi = 1
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
}

function generateInsights(
    completionRate: number,
    topPerforming: Habit[],
    struggling: Habit[],
    newStreaks: number,
    brokenStreaks: number
): string[] {
    const insights: string[] = [];

    if (completionRate >= 80) {
        insights.push("🎉 Excellente semaine ! Vous avez maintenu un taux de réussite exceptionnel.");
    } else if (completionRate >= 60) {
        insights.push("👍 Bon travail cette semaine ! Vous êtes sur la bonne voie.");
    } else if (completionRate >= 40) {
        insights.push("💪 Continuez vos efforts ! Chaque petit pas compte.");
    } else {
        insights.push("🌱 Cette semaine a été difficile, mais c'est normal. Concentrez-vous sur 1-2 habitudes importantes.");
    }

    if (topPerforming.length > 0) {
        insights.push(`⭐ Vos meilleures habitudes : ${topPerforming.map(h => h.name).join(', ')}`);
    }

    if (struggling.length > 0) {
        insights.push(`🎯 Habitudes à améliorer : ${struggling.map(h => h.name).join(', ')}`);
    }

    if (newStreaks > 0) {
        insights.push(`🔥 ${newStreaks} nouvelle(s) série(s) en cours !`);
    }

    if (brokenStreaks > 0) {
        insights.push(`💔 ${brokenStreaks} série(s) cassée(s) cette semaine. Pas de panique, recommencez !`);
    }

    return insights;
}

function generateNextWeekGoals(
    struggling: Habit[],
    completionRate: number,
    newStreaks: number
): string[] {
    const goals: string[] = [];

    if (completionRate < 50) {
        goals.push("Se concentrer sur 1-2 habitudes essentielles");
        goals.push("Réduire la complexité des habitudes");
    } else if (completionRate < 80) {
        goals.push("Maintenir les habitudes actuelles");
        goals.push("Ajouter 1 nouvelle habitude simple");
    } else {
        goals.push("Consolider les habitudes existantes");
        goals.push("Explorer de nouveaux défis");
    }

    if (struggling.length > 0) {
        goals.push(`Améliorer : ${struggling[0].name}`);
    }

    if (newStreaks > 0) {
        goals.push("Maintenir les séries en cours");
    }

    return goals;
}
