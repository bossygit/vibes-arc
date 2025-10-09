import { createClient } from '@supabase/supabase-js';
import { Identity, Habit } from '@/types';

// Types pour Supabase
interface SupabaseIdentity {
  id: number;
  name: string;
  description?: string;
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

    async createIdentity(name: string, description?: string): Promise<Identity> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const { data, error } = await this.supabase
            .from('identities')
            .insert({
                name,
                description,
                user_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            description: data.description,
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
                    await this.createIdentity(identity.name, identity.description);
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
}

export default SupabaseDatabaseClient;
