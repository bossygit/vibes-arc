import { Identity, Habit } from '@/types';

// Client pour l'utilisation côté navigateur uniquement
// Utilise localStorage comme persistance

class BrowserDatabaseClient {
    private static instance: BrowserDatabaseClient;
    private readonly IDENTITIES_KEY = 'vibes-arc-identities';
    private readonly HABITS_KEY = 'vibes-arc-habits';

    private constructor() { }

    public static getInstance(): BrowserDatabaseClient {
        if (!BrowserDatabaseClient.instance) {
            BrowserDatabaseClient.instance = new BrowserDatabaseClient();
        }
        return BrowserDatabaseClient.instance;
    }

    // ===== IDENTITIES =====

    public createIdentity(name: string, description?: string, color: string = 'blue'): Identity {
        const identities = this.getIdentities();
        const newIdentity: Identity = {
            id: Date.now(),
            name,
            description,
            color,
            createdAt: new Date().toISOString()
        };

        identities.push(newIdentity);
        this.saveIdentities(identities);
        return newIdentity;
    }

    public getIdentities(): Identity[] {
        const stored = localStorage.getItem(this.IDENTITIES_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    public updateIdentity(id: number, name: string, description?: string): boolean {
        const identities = this.getIdentities();
        const index = identities.findIndex(i => i.id === id);

        if (index !== -1) {
            identities[index] = { ...identities[index], name, description };
            this.saveIdentities(identities);
            return true;
        }

        return false;
    }

    public deleteIdentity(id: number): boolean {
        const identities = this.getIdentities();
        const filtered = identities.filter(i => i.id !== id);
        this.saveIdentities(filtered);

        // Mettre à jour les habitudes pour retirer cette identité
        const habits = this.getHabits();
        const updatedHabits = habits.map(h => ({
            ...h,
            linkedIdentities: h.linkedIdentities.filter(iId => iId !== id)
        }));
        this.saveHabits(updatedHabits);

        return true;
    }

    // ===== HABITS =====

    public createHabit(name: string, type: 'start' | 'stop', totalDays: number, linkedIdentities: number[]): Habit {
        const habits = this.getHabits();
        const newHabit: Habit = {
            id: Date.now(),
            name,
            type,
            totalDays,
            linkedIdentities,
            progress: new Array(totalDays).fill(false),
            createdAt: new Date().toISOString()
        };

        habits.push(newHabit);
        this.saveHabits(habits);
        return newHabit;
    }

    public getHabits(): Habit[] {
        const stored = localStorage.getItem(this.HABITS_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    public updateHabit(id: number, updates: Partial<Habit>): boolean {
        const habits = this.getHabits();
        const index = habits.findIndex(h => h.id === id);

        if (index !== -1) {
            habits[index] = { ...habits[index], ...updates };
            this.saveHabits(habits);
            return true;
        }

        return false;
    }

    public deleteHabit(id: number): boolean {
        const habits = this.getHabits();
        const filtered = habits.filter(h => h.id !== id);
        this.saveHabits(filtered);
        return true;
    }

    public toggleHabitDay(habitId: number, dayIndex: number): boolean {
        const habits = this.getHabits();
        const habit = habits.find(h => h.id === habitId);

        if (habit) {
            // Si l'habitude est trop courte, l'étendre à la demande
            if (dayIndex >= habit.progress.length) {
                const missing = dayIndex + 1 - habit.progress.length;
                habit.progress = [...habit.progress, ...new Array(missing).fill(false)];
                habit.totalDays = habit.progress.length;
            }
            habit.progress[dayIndex] = !habit.progress[dayIndex];
            this.saveHabits(habits);
            return true;
        }

        return false;
    }

    // ===== UTILITY METHODS =====

    private saveIdentities(identities: Identity[]): void {
        localStorage.setItem(this.IDENTITIES_KEY, JSON.stringify(identities));
    }

    private saveHabits(habits: Habit[]): void {
        localStorage.setItem(this.HABITS_KEY, JSON.stringify(habits));
    }

    public getStats(): { identities: number; habits: number; totalProgress: number } {
        const identities = this.getIdentities();
        const habits = this.getHabits();
        const totalProgress = habits.reduce((sum, habit) => {
            return sum + habit.progress.filter(p => p).length;
        }, 0);

        return {
            identities: identities.length,
            habits: habits.length,
            totalProgress
        };
    }

    // ===== EXPORT/IMPORT =====

    public exportData(): string {
        const data = {
            identities: this.getIdentities(),
            habits: this.getHabits(),
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        return JSON.stringify(data, null, 2);
    }

    public importData(jsonData: string): boolean {
        try {
            const data = JSON.parse(jsonData);

            if (data.identities && Array.isArray(data.identities)) {
                this.saveIdentities(data.identities);
            }

            if (data.habits && Array.isArray(data.habits)) {
                this.saveHabits(data.habits);
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            return false;
        }
    }

    public clearAllData(): void {
        localStorage.removeItem(this.IDENTITIES_KEY);
        localStorage.removeItem(this.HABITS_KEY);
    }
}

export default BrowserDatabaseClient;
