import DatabaseService from './database';

// Client pour l'utilisation côté navigateur
// SQLite ne fonctionne pas directement dans le navigateur, 
// nous utilisons donc une approche hybride avec localStorage comme fallback

class DatabaseClient {
    private static instance: DatabaseClient;
    private dbService: DatabaseService | null = null;
    private isServer: boolean;

    private constructor() {
        this.isServer = typeof window === 'undefined';

        if (this.isServer) {
            this.dbService = DatabaseService.getInstance();
        }
    }

    public static getInstance(): DatabaseClient {
        if (!DatabaseClient.instance) {
            DatabaseClient.instance = new DatabaseClient();
        }
        return DatabaseClient.instance;
    }

    // ===== IDENTITIES =====

    public createIdentity(name: string, description?: string) {
        if (this.isServer && this.dbService) {
            return this.dbService.createIdentity(name, description);
        }

        // Fallback localStorage pour le navigateur
        return this.createIdentityLocal(name, description);
    }

    public getIdentities() {
        if (this.isServer && this.dbService) {
            return this.dbService.getIdentities();
        }

        return this.getIdentitiesLocal();
    }

    public updateIdentity(id: number, name: string, description?: string) {
        if (this.isServer && this.dbService) {
            return this.dbService.updateIdentity(id, name, description);
        }

        return this.updateIdentityLocal(id, name, description);
    }

    public deleteIdentity(id: number) {
        if (this.isServer && this.dbService) {
            return this.dbService.deleteIdentity(id);
        }

        return this.deleteIdentityLocal(id);
    }

    // ===== HABITS =====

    public createHabit(name: string, type: 'start' | 'stop', totalDays: number, linkedIdentities: number[]) {
        if (this.isServer && this.dbService) {
            return this.dbService.createHabit(name, type, totalDays, linkedIdentities);
        }

        return this.createHabitLocal(name, type, totalDays, linkedIdentities);
    }

    public getHabits() {
        if (this.isServer && this.dbService) {
            return this.dbService.getHabits();
        }

        return this.getHabitsLocal();
    }

    public updateHabit(id: number, updates: any) {
        if (this.isServer && this.dbService) {
            return this.dbService.updateHabit(id, updates);
        }

        return this.updateHabitLocal(id, updates);
    }

    public deleteHabit(id: number) {
        if (this.isServer && this.dbService) {
            return this.dbService.deleteHabit(id);
        }

        return this.deleteHabitLocal(id);
    }

    public toggleHabitDay(habitId: number, dayIndex: number) {
        if (this.isServer && this.dbService) {
            return this.dbService.toggleHabitDay(habitId, dayIndex);
        }

        return this.toggleHabitDayLocal(habitId, dayIndex);
    }

    // ===== LOCAL STORAGE FALLBACKS =====

    private createIdentityLocal(name: string, description?: string) {
        const identities = this.getIdentitiesLocal();
        const newIdentity = {
            id: Date.now(),
            name,
            description,
            createdAt: new Date().toISOString()
        };

        identities.push(newIdentity);
        localStorage.setItem('vibes-arc-identities', JSON.stringify(identities));
        return newIdentity;
    }

    private getIdentitiesLocal() {
        const stored = localStorage.getItem('vibes-arc-identities');
        return stored ? JSON.parse(stored) : [];
    }

    private updateIdentityLocal(id: number, name: string, description?: string) {
        const identities = this.getIdentitiesLocal();
        const index = identities.findIndex((i: any) => i.id === id);

        if (index !== -1) {
            identities[index] = { ...identities[index], name, description };
            localStorage.setItem('vibes-arc-identities', JSON.stringify(identities));
            return true;
        }

        return false;
    }

    private deleteIdentityLocal(id: number) {
        const identities = this.getIdentitiesLocal();
        const filtered = identities.filter((i: any) => i.id !== id);
        localStorage.setItem('vibes-arc-identities', JSON.stringify(filtered));

        // Mettre à jour les habitudes pour retirer cette identité
        const habits = this.getHabitsLocal();
        const updatedHabits = habits.map((h: any) => ({
            ...h,
            linkedIdentities: h.linkedIdentities.filter((iId: number) => iId !== id)
        }));
        localStorage.setItem('vibes-arc-habits', JSON.stringify(updatedHabits));

        return true;
    }

    private createHabitLocal(name: string, type: 'start' | 'stop', totalDays: number, linkedIdentities: number[]) {
        const habits = this.getHabitsLocal();
        const newHabit = {
            id: Date.now(),
            name,
            type,
            totalDays,
            linkedIdentities,
            progress: new Array(totalDays).fill(false),
            createdAt: new Date().toISOString()
        };

        habits.push(newHabit);
        localStorage.setItem('vibes-arc-habits', JSON.stringify(habits));
        return newHabit;
    }

    private getHabitsLocal() {
        const stored = localStorage.getItem('vibes-arc-habits');
        return stored ? JSON.parse(stored) : [];
    }

    private updateHabitLocal(id: number, updates: any) {
        const habits = this.getHabitsLocal();
        const index = habits.findIndex((h: any) => h.id === id);

        if (index !== -1) {
            habits[index] = { ...habits[index], ...updates };
            localStorage.setItem('vibes-arc-habits', JSON.stringify(habits));
            return true;
        }

        return false;
    }

    private deleteHabitLocal(id: number) {
        const habits = this.getHabitsLocal();
        const filtered = habits.filter((h: any) => h.id !== id);
        localStorage.setItem('vibes-arc-habits', JSON.stringify(filtered));
        return true;
    }

    private toggleHabitDayLocal(habitId: number, dayIndex: number) {
        const habits = this.getHabitsLocal();
        const habit = habits.find((h: any) => h.id === habitId);

        if (habit && habit.progress[dayIndex] !== undefined) {
            habit.progress[dayIndex] = !habit.progress[dayIndex];
            localStorage.setItem('vibes-arc-habits', JSON.stringify(habits));
            return true;
        }

        return false;
    }

    public getStats() {
        if (this.isServer && this.dbService) {
            return this.dbService.getStats();
        }

        const identities = this.getIdentitiesLocal();
        const habits = this.getHabitsLocal();
        const totalProgress = habits.reduce((sum: number, habit: any) => {
            return sum + habit.progress.filter((p: boolean) => p).length;
        }, 0);

        return {
            identities: identities.length,
            habits: habits.length,
            totalProgress
        };
    }
}

export default DatabaseClient;
