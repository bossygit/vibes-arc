import { createClient } from '@supabase/supabase-js';
import { Identity, Habit, Reward, Challenge, UserPrefs, SkipsByHabit } from '@/types';

// Types pour Supabase
interface SupabaseIdentity {
    id: number;
    name: string;
    description?: string;
    color?: string;
    created_at: string;
    user_id: string;
}

class SupabaseDatabaseClient {
    private static instance: SupabaseDatabaseClient;
    private supabase;

    private constructor() {
        const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
        const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Variables d\'environnement Supabase manquantes');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    public static getInstance(): SupabaseDatabaseClient {
        if (!SupabaseDatabaseClient.instance) {
            SupabaseDatabaseClient.instance = new SupabaseDatabaseClient();
        }
        return SupabaseDatabaseClient.instance;
    }

    // ===== AUTHENTIFICATION =====

    async signUp(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
        });
        return { data, error };
    }

    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        return { error };
    }

    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }

    // ===== IDENTITIES =====

    async createIdentity(name: string, description?: string, color: string = 'blue'): Promise<Identity> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const { data, error } = await this.supabase
            .from('identities')
            .insert({
                name,
                description,
                color,
                user_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            color: data.color,
            createdAt: data.created_at,
        };
    }

    async getIdentities(): Promise<Identity[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];

        const { data, error } = await this.supabase
            .from('identities')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((item: SupabaseIdentity) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            color: item.color || 'blue',
            createdAt: item.created_at,
        }));
    }

    async updateIdentity(id: number, name: string, description?: string): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const { error } = await this.supabase
            .from('identities')
            .update({
                name,
                description,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user.id);

        return !error;
    }

    async deleteIdentity(id: number): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const { error } = await this.supabase
            .from('identities')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        return !error;
    }

    // ===== HABITS =====

    async createHabit(
        name: string,
        type: 'start' | 'stop',
        totalDays: number,
        linkedIdentities: number[]
    ): Promise<Habit> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        // Créer l'habitude
        const { data: habitData, error: habitError } = await this.supabase
            .from('habits')
            .insert({
                name,
                type,
                total_days: totalDays,
                user_id: user.id,
            })
            .select()
            .single();

        if (habitError) throw habitError;

        // Lier aux identités
        if (linkedIdentities.length > 0) {
            const links = linkedIdentities.map(identityId => ({
                habit_id: habitData.id,
                identity_id: identityId,
            }));

            const { error: linkError } = await this.supabase
                .from('habit_identities')
                .insert(links);

            if (linkError) throw linkError;
        }

        // Initialiser la progression
        const progressData = Array.from({ length: totalDays }, (_, i) => ({
            habit_id: habitData.id,
            day_index: i,
            completed: false,
        }));

        const { error: progressError } = await this.supabase
            .from('habit_progress')
            .insert(progressData);

        if (progressError) throw progressError;

        return {
            id: habitData.id,
            name: habitData.name,
            type: habitData.type,
            totalDays: habitData.total_days,
            linkedIdentities,
            progress: new Array(totalDays).fill(false),
            createdAt: habitData.created_at,
        };
    }

    async getHabits(): Promise<Habit[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];

        // Récupérer les habitudes
        const { data: habits, error: habitsError } = await this.supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (habitsError) throw habitsError;

        const result: Habit[] = [];

        for (const habit of habits) {
            // Récupérer les identités liées
            const { data: linkedIdentities } = await this.supabase
                .from('habit_identities')
                .select('identity_id')
                .eq('habit_id', habit.id);

            // Récupérer la progression
            const { data: progressData } = await this.supabase
                .from('habit_progress')
                .select('day_index, completed')
                .eq('habit_id', habit.id)
                .order('day_index');

            const progress = new Array(habit.total_days).fill(false);
            progressData?.forEach(item => {
                progress[item.day_index] = item.completed;
            });

            result.push({
                id: habit.id,
                name: habit.name,
                type: habit.type,
                totalDays: habit.total_days,
                linkedIdentities: linkedIdentities?.map(item => item.identity_id) || [],
                progress,
                createdAt: habit.created_at,
            });
        }

        return result;
    }

    async updateHabit(id: number, updates: Partial<Habit>): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        // Mettre à jour l'habitude
        if (updates.name || updates.type || updates.totalDays) {
            const { error } = await this.supabase
                .from('habits')
                .update({
                    name: updates.name,
                    type: updates.type,
                    total_days: updates.totalDays,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
        }

        // Mettre à jour les identités liées
        if (updates.linkedIdentities) {
            // Supprimer les anciennes liaisons
            await this.supabase
                .from('habit_identities')
                .delete()
                .eq('habit_id', id);

            // Ajouter les nouvelles liaisons
            if (updates.linkedIdentities.length > 0) {
                const links = updates.linkedIdentities.map(identityId => ({
                    habit_id: id,
                    identity_id: identityId,
                }));

                const { error } = await this.supabase
                    .from('habit_identities')
                    .insert(links);

                if (error) throw error;
            }
        }

        return true;
    }

    async deleteHabit(id: number): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const { error } = await this.supabase
            .from('habits')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        return !error;
    }

    // ===== HABIT PROGRESS =====

    async toggleHabitDay(habitId: number, dayIndex: number): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        // Récupérer l'état actuel
        const { data: currentProgress } = await this.supabase
            .from('habit_progress')
            .select('completed')
            .eq('habit_id', habitId)
            .eq('day_index', dayIndex)
            .single();

        const newCompleted = !currentProgress?.completed;

        const { error } = await this.supabase
            .from('habit_progress')
            .update({
                completed: newCompleted,
                completed_at: newCompleted ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            })
            .eq('habit_id', habitId)
            .eq('day_index', dayIndex);

        return !error;
    }

    // ===== UTILITY METHODS =====

    async getStats(): Promise<{ identities: number; habits: number; totalProgress: number }> {
        const user = await this.getCurrentUser();
        if (!user) {
            return { identities: 0, habits: 0, totalProgress: 0 };
        }

        // Récupérer les IDs des habitudes de l'utilisateur
        const { data: userHabits } = await this.supabase
            .from('habits')
            .select('id')
            .eq('user_id', user.id);

        const habitIds = userHabits?.map(h => h.id) || [];

        const [identitiesResult, habitsResult, progressResult] = await Promise.all([
            this.supabase
                .from('identities')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id),
            this.supabase
                .from('habits')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id),
            habitIds.length > 0 ? this.supabase
                .from('habit_progress')
                .select('id', { count: 'exact' })
                .eq('completed', true)
                .in('habit_id', habitIds) : { count: 0 },
        ]);

        return {
            identities: identitiesResult.count || 0,
            habits: habitsResult.count || 0,
            totalProgress: progressResult.count || 0,
        };
    }

    // ===== EXPORT/IMPORT =====

    async exportData(): Promise<string> {
        const [identities, habits] = await Promise.all([
            this.getIdentities(),
            this.getHabits(),
        ]);

        const data = {
            identities,
            habits,
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
        };

        return JSON.stringify(data, null, 2);
    }

    async importData(jsonData: string): Promise<boolean> {
        try {
            const data = JSON.parse(jsonData);

            if (data.identities && Array.isArray(data.identities)) {
                for (const identity of data.identities) {
                    await this.createIdentity(identity.name, identity.description, identity.color);
                }
            }

            if (data.habits && Array.isArray(data.habits)) {
                for (const habit of data.habits) {
                    await this.createHabit(
                        habit.name,
                        habit.type,
                        habit.totalDays,
                        habit.linkedIdentities
                    );
                }
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            return false;
        }
    }

    // ===== SKIPS =====
    async getHabitSkips(): Promise<SkipsByHabit> {
        const user = await this.getCurrentUser();
        if (!user) return {};
        const { data, error } = await this.supabase
            .from('habit_skips')
            .select('habit_id, day_index')
            .eq('user_id', user.id);
        if (error) throw error;
        const map: SkipsByHabit = {};
        data?.forEach((row: any) => {
            if (!map[row.habit_id]) map[row.habit_id] = [];
            map[row.habit_id].push(row.day_index);
        });
        return map;
    }

    async toggleSkipDay(habitId: number, dayIndex: number): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');
        // Try to insert; on conflict delete
        const { error } = await this.supabase
            .from('habit_skips')
            .upsert({ user_id: user.id, habit_id: habitId, day_index: dayIndex }, { onConflict: 'habit_id,day_index,user_id' });
        if (!error) return true;
        // fallback toggle via delete if already exists
        await this.supabase
            .from('habit_skips')
            .delete()
            .eq('user_id', user.id)
            .eq('habit_id', habitId)
            .eq('day_index', dayIndex);
        return true;
    }

    // ===== GAMIFICATION STATE =====
    async getGamificationState(): Promise<{ points: number }> {
        const user = await this.getCurrentUser();
        if (!user) return { points: 0 };
        const { data } = await this.supabase
            .from('gamification_state')
            .select('points')
            .eq('user_id', user.id)
            .single();
        return { points: data?.points ?? 0 };
    }

    async addPoints(amount: number): Promise<number> {
        const user = await this.getCurrentUser();
        if (!user) return amount; // noop
        // Upsert row and increment
        const { data, error } = await this.supabase.rpc('increment_points', { p_user_id: user.id, p_amount: amount });
        if (!error && typeof data === 'number') return data;
        // Fallback: fetch then update
        const { data: current } = await this.supabase
            .from('gamification_state')
            .select('points')
            .eq('user_id', user.id)
            .single();
        const points = (current?.points ?? 0) + amount;
        await this.supabase
            .from('gamification_state')
            .upsert({ user_id: user.id, points, updated_at: new Date().toISOString() });
        return points;
    }

    // ===== REWARDS =====
    async listRewards(): Promise<Reward[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];
        const { data, error } = await this.supabase
            .from('rewards')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map((r: any) => ({ id: r.id, title: r.title, cost: r.cost, createdAt: r.created_at, claimedAt: r.claimed_at }));
    }

    async createReward(title: string, cost: number): Promise<Reward> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');
        const { data, error } = await this.supabase
            .from('rewards')
            .insert({ user_id: user.id, title, cost })
            .select('*')
            .single();
        if (error) throw error;
        return { id: data.id, title: data.title, cost: data.cost, createdAt: data.created_at, claimedAt: data.claimed_at };
    }

    async claimReward(rewardId: number): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');
        const { error } = await this.supabase
            .from('rewards')
            .update({ claimed_at: new Date().toISOString() })
            .eq('id', rewardId)
            .eq('user_id', user.id);
        return !error;
    }

    // ===== CHALLENGES =====
    async listChallenges(): Promise<Challenge[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];
        const { data } = await this.supabase
            .from('challenges')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        return (data || []).map((c: any) => ({
            id: c.id,
            title: c.title,
            targetDays: c.target_days,
            progressDays: 0,
            weekStartISO: new Date(c.week_start).toISOString().slice(0, 10),
            completedAt: c.completed_at || undefined,
        }));
    }

    async upsertWeeklyChallenge(title: string, weekStartISO: string, targetDays: number): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');
        const { error } = await this.supabase
            .from('challenges')
            .upsert({ user_id: user.id, title, week_start: weekStartISO, target_days: targetDays });
        return !error;
    }

    async completeChallenge(id: number): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');
        const { error } = await this.supabase
            .from('challenges')
            .update({ completed_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id);
        return !error;
    }

    // ===== USER PREFS / NOTIFS =====
    async getUserPrefs(): Promise<UserPrefs> {
        const user = await this.getCurrentUser();
        if (!user) return { 
            notifHour: 20, 
            weeklyEmailEnabled: false, 
            weeklyEmailDay: 6, 
            weeklyEmailHour: 9 
        };
        const { data } = await this.supabase
            .from('user_prefs')
            .select('notif_hour, weekly_email_enabled, weekly_email_day, weekly_email_hour')
            .eq('user_id', user.id)
            .single();
        return { 
            notifHour: data?.notif_hour ?? 20,
            weeklyEmailEnabled: data?.weekly_email_enabled ?? false,
            weeklyEmailDay: data?.weekly_email_day ?? 6,
            weeklyEmailHour: data?.weekly_email_hour ?? 9
        };
    }

    async setUserNotifHour(hour: number): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) return false;
        const { error } = await this.supabase
            .from('user_prefs')
            .upsert({ user_id: user.id, notif_hour: hour, updated_at: new Date().toISOString() });
        return !error;
    }

    async computeOptimalNotifHour(): Promise<number> {
        const user = await this.getCurrentUser();
        if (!user) return 20;
        // Heuristique: récupérer habit_progress.completed_at des 30 derniers jours et prendre l'heure modale
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await this.supabase
            .from('habit_progress')
            .select('completed_at')
            .gte('completed_at', since)
            .not('completed_at', 'is', null)
            .limit(5000);
        const hours: number[] = [];
        (data || []).forEach((r: any) => {
            const d = new Date(r.completed_at);
            if (!isNaN(d.getTime())) hours.push(d.getHours());
        });
        if (hours.length === 0) return 20;
        const freq = new Array(24).fill(0);
        hours.forEach(h => { freq[h]++; });
        let best = 20;
        let bestCount = -1;
        for (let h = 0; h < 24; h++) {
            if (freq[h] > bestCount) { bestCount = freq[h]; best = h; }
        }
        return best;
    }
}

export default SupabaseDatabaseClient;
