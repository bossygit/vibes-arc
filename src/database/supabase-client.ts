import { createClient } from '@supabase/supabase-js';
import { Identity, Habit, Reward, Challenge, UserPrefs, SkipsByHabit, MilestoneAchievement } from '@/types';

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

    // ===== SESSION HELPERS (client-side) =====
    async getAccessToken(): Promise<string | null> {
        try {
            const { data } = await this.supabase.auth.getSession();
            return data.session?.access_token ?? null;
        } catch {
            return null;
        }
    }

    // Expose supabase auth helper for internal services (avoid direct property access)
    async getSession() {
        return await this.supabase.auth.getSession();
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
        linkedIdentities: number[],
        milestoneKey?: string
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
                milestone_key: milestoneKey ?? null,
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
            milestoneKey: habitData.milestone_key ?? undefined,
            startDayIndex: (() => {
                try {
                    const base = new Date(2025, 9, 1);
                    base.setHours(0, 0, 0, 0);
                    const created = new Date(habitData.created_at);
                    created.setHours(0, 0, 0, 0);
                    return Math.max(0, Math.floor((created.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)));
                } catch {
                    return 0;
                }
            })(),
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
                milestoneKey: habit.milestone_key ?? undefined,
                startDayIndex: (() => {
                    try {
                        const base = new Date(2025, 9, 1);
                        base.setHours(0, 0, 0, 0);
                        const created = new Date(habit.created_at);
                        created.setHours(0, 0, 0, 0);
                        return Math.max(0, Math.floor((created.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)));
                    } catch {
                        return 0;
                    }
                })(),
            });
        }

        return result;
    }

    async updateHabit(id: number, updates: Partial<Habit>): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        // Mettre à jour l'habitude
        if (updates.name || updates.type || updates.totalDays || updates.milestoneKey !== undefined) {
            const { error } = await this.supabase
                .from('habits')
                .update({
                    name: updates.name,
                    type: updates.type,
                    total_days: updates.totalDays,
                    milestone_key: updates.milestoneKey ?? null,
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

        // Récupérer l'état actuel (peut ne pas exister si l'habitude a été étendue)
        const { data: currentProgress } = await this.supabase
            .from('habit_progress')
            .select('completed')
            .eq('habit_id', habitId)
            .eq('day_index', dayIndex)
            .maybeSingle();

        const newCompleted = !currentProgress?.completed;

        // Upsert pour créer la ligne si absente
        const { error } = await this.supabase
            .from('habit_progress')
            .upsert(
                {
                    habit_id: habitId,
                    day_index: dayIndex,
                    completed: newCompleted,
                    completed_at: newCompleted ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'habit_id,day_index' }
            );

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
        if (!user) {
            return { 
                notifEnabled: false,
                notifHour: 20, 
                notifTimezone: 'Europe/Paris',
                notifChannel: 'none',
                weeklyEmailEnabled: false, 
                weeklyEmailDay: 6, 
                weeklyEmailHour: 9 
            };
        }
        const { data, error } = await this.supabase
            .from('user_prefs')
            .select('notif_enabled, notif_hour, notif_timezone, notif_channel, telegram_chat_id, telegram_username, whatsapp_number, weekly_email_enabled, weekly_email_day, weekly_email_hour, last_notif_sent_at')
            .eq('user_id', user.id)
            .maybeSingle();
        
        if (error) {
            console.warn('Erreur lors du chargement des préférences:', error);
        }
        return { 
            notifEnabled: data?.notif_enabled ?? false,
            notifHour: data?.notif_hour ?? 20,
            notifTimezone: data?.notif_timezone ?? 'Europe/Paris',
            notifChannel: data?.notif_channel ?? 'none',
            telegramChatId: data?.telegram_chat_id ?? undefined,
            telegramUsername: data?.telegram_username ?? undefined,
            whatsappNumber: data?.whatsapp_number ?? undefined,
            weeklyEmailEnabled: data?.weekly_email_enabled ?? false,
            weeklyEmailDay: data?.weekly_email_day ?? 6,
            weeklyEmailHour: data?.weekly_email_hour ?? 9,
            lastNotifSentAt: data?.last_notif_sent_at ?? undefined,
        };
    }

    async saveUserPrefs(prefs: UserPrefs): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) return false;
        const payload = {
            user_id: user.id,
            notif_enabled: prefs.notifEnabled,
            notif_hour: prefs.notifHour,
            notif_timezone: prefs.notifTimezone,
            notif_channel: prefs.notifChannel,
            telegram_chat_id: prefs.telegramChatId || null,
            telegram_username: prefs.telegramUsername || null,
            whatsapp_number: prefs.whatsappNumber || null,
            weekly_email_enabled: prefs.weeklyEmailEnabled,
            weekly_email_day: prefs.weeklyEmailDay,
            weekly_email_hour: prefs.weeklyEmailHour,
            last_notif_sent_at: prefs.lastNotifSentAt || null,
            updated_at: new Date().toISOString(),
        };
        const { error } = await this.supabase
            .from('user_prefs')
            .upsert(payload);
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

    async triggerNotificationTest(): Promise<{ status: string; message?: string; reason?: string }> {
        try {
            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('Utilisateur non authentifié');
            }

            const { data, error } = await this.supabase.functions.invoke('send-notifications', {
                body: { mode: 'single', reason: 'manual-test' }
            });
            
            if (error) {
                console.error('Erreur Edge Function:', error);
                throw new Error(error.message || 'Erreur lors de l\'appel à la fonction Edge');
            }
            
            return data as { status: string; message?: string; reason?: string };
        } catch (error: any) {
            console.error('Erreur lors du déclenchement de la notification:', error);
            return {
                status: 'error',
                reason: error?.message || 'Impossible de contacter le serveur de notifications'
            };
        }
    }

    // ===== MILESTONE ACHIEVEMENTS =====

    async getMilestoneAchievements(): Promise<MilestoneAchievement[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];

        const { data, error } = await this.supabase
            .from('milestone_achievements')
            .select('milestone_id, achieved_at, notified_at')
            .eq('user_id', user.id)
            .order('achieved_at', { ascending: false });

        if (error) {
            console.warn('milestone_achievements indisponible:', error.message);
            return this.getLocalMilestoneAchievements();
        }

        const achievements = (data || []).map((row: { milestone_id: string; achieved_at: string; notified_at: string | null }) => ({
            milestoneId: row.milestone_id,
            achievedAt: row.achieved_at,
            notifiedAt: row.notified_at ?? undefined,
        }));

        this.saveLocalMilestoneAchievements(achievements);
        return achievements;
    }

    private getLocalMilestoneAchievements(): MilestoneAchievement[] {
        try {
            const raw = localStorage.getItem('vibes-arc-milestone-achievements');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    private saveLocalMilestoneAchievements(achievements: MilestoneAchievement[]): void {
        localStorage.setItem('vibes-arc-milestone-achievements', JSON.stringify(achievements));
    }

    async saveMilestoneAchievement(milestoneId: string): Promise<MilestoneAchievement | null> {
        const user = await this.getCurrentUser();
        const achievedAt = new Date().toISOString();
        const achievement: MilestoneAchievement = { milestoneId, achievedAt };

        const local = this.getLocalMilestoneAchievements();
        if (!local.some((a) => a.milestoneId === milestoneId)) {
            this.saveLocalMilestoneAchievements([achievement, ...local]);
        }

        if (!user) return achievement;

        const { error } = await this.supabase
            .from('milestone_achievements')
            .upsert(
                {
                    user_id: user.id,
                    milestone_id: milestoneId,
                    achieved_at: achievedAt,
                },
                { onConflict: 'user_id,milestone_id' }
            );

        if (error) {
            console.warn('Erreur sauvegarde milestone:', error.message);
        }

        return achievement;
    }

    async markMilestoneNotified(milestoneId: string): Promise<void> {
        const user = await this.getCurrentUser();
        const notifiedAt = new Date().toISOString();

        const local = this.getLocalMilestoneAchievements().map((a) =>
            a.milestoneId === milestoneId ? { ...a, notifiedAt } : a
        );
        this.saveLocalMilestoneAchievements(local);

        if (!user) return;

        await this.supabase
            .from('milestone_achievements')
            .update({ notified_at: notifiedAt })
            .eq('user_id', user.id)
            .eq('milestone_id', milestoneId);
    }

    async sendMilestoneTelegramNotification(message: string): Promise<{ status: string; reason?: string }> {
      try {
        const { data, error } = await this.supabase.functions.invoke('send-notifications', {
          body: {
            mode: 'single',
            reason: 'milestone',
            previewMessage: message,
          },
        });

        if (error) {
          return { status: 'error', reason: error.message };
        }

        return (data as { status: string; reason?: string }) ?? { status: 'sent' };
      } catch (err: unknown) {
        return { status: 'error', reason: (err as Error).message };
      }
    }

    // ===== FOCUS 17/68 (focus_holds) =====

    async saveFocusHold(
      durationSeconds: number,
      intentionLabel: string | null,
      milestoneReached: number,
      startedAt?: string
    ): Promise<boolean> {
      const user = await this.getCurrentUser();
      if (!user) return false;

      const { error } = await this.supabase
        .from('focus_holds')
        .insert({
          user_id: user.id,
          intention_label: intentionLabel,
          started_at: startedAt ?? new Date().toISOString(),
          duration_seconds: durationSeconds,
          milestone_reached: milestoneReached,
        });

      if (error) {
        console.warn('Erreur sauvegarde focus_hold:', error.message);
        return false;
      }
      return true;
    }

    async getFocusHolds(limit: number = 20): Promise<any[]> {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('focus_holds')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Erreur chargement focus_holds:', error.message);
        return [];
      }
      return data ?? [];
    }

    async getFocusAggregates(daysBack: number = 90): Promise<any[]> {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const since = new Date();
      since.setDate(since.getDate() - daysBack);

      const { data, error } = await this.supabase
        .from('focus_holds')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', since.toISOString())
        .order('started_at', { ascending: false });

      if (error) {
        console.warn('Erreur chargement focus aggregates:', error.message);
        return [];
      }
      return data ?? [];
    }

    // ============================================================
    // VIBES ARC v2 — Tribunal de la Vie
    // ============================================================

    // ===== DESIRES =====

    async createDesire(
        title: string,
        type: 'avoir' | 'être',
        linkedIdentityId: number,
        description?: string,
        target?: string
    ): Promise<import('@/types').Desire> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const { data, error } = await this.supabase
            .from('desires')
            .insert({
                user_id: user.id,
                title,
                type,
                description: description ?? null,
                target: target ?? null,
                linked_identity_id: linkedIdentityId,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            title: data.title,
            type: data.type,
            description: data.description,
            target: data.target,
            linkedIdentityId: data.linked_identity_id,
            createdAt: data.created_at,
        };
    }

    async getDesires(): Promise<import('@/types').Desire[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];

        const { data, error } = await this.supabase
            .from('desires')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((d: any) => ({
            id: d.id,
            title: d.title,
            type: d.type,
            description: d.description,
            target: d.target,
            linkedIdentityId: d.linked_identity_id,
            createdAt: d.created_at,
        }));
    }

    async updateDesire(id: number, updates: Partial<import('@/types').Desire>): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.target !== undefined) payload.target = updates.target;
        if (updates.linkedIdentityId !== undefined) payload.linked_identity_id = updates.linkedIdentityId;

        const { error } = await this.supabase
            .from('desires')
            .update(payload)
            .eq('id', id)
            .eq('user_id', user.id);

        return !error;
    }

    async deleteDesire(id: number): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const { error } = await this.supabase
            .from('desires')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        return !error;
    }

    // ===== DAILY MOODS =====

    async saveDailyMood(
        date: string,
        score: number,
        dominantEmotion?: string,
        notes?: string,
        causes?: string
    ): Promise<import('@/types').DailyMood> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const { data, error } = await this.supabase
            .from('daily_moods')
            .upsert(
                {
                    user_id: user.id,
                    date,
                    score,
                    dominant_emotion: dominantEmotion ?? null,
                    notes: notes ?? null,
                    causes: causes ?? null,
                },
                { onConflict: 'user_id,date' }
            )
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            date: data.date,
            score: data.score as import('@/types').EmotionalFrequency,
            dominantEmotion: data.dominant_emotion,
            notes: data.notes,
            causes: data.causes,
            createdAt: data.created_at,
        };
    }

    async getDailyMoods(daysBack: number = 90): Promise<import('@/types').DailyMood[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];

        const since = new Date();
        since.setDate(since.getDate() - daysBack);

        const { data, error } = await this.supabase
            .from('daily_moods')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', since.toISOString().slice(0, 10))
            .order('date', { ascending: false });

        if (error) throw error;

        return (data || []).map((m: any) => ({
            id: m.id,
            date: m.date,
            score: m.score as import('@/types').EmotionalFrequency,
            dominantEmotion: m.dominant_emotion,
            notes: m.notes,
            causes: m.causes,
            createdAt: m.created_at,
        }));
    }

    async getTodayMood(): Promise<import('@/types').DailyMood | null> {
        const user = await this.getCurrentUser();
        if (!user) return null;

        const today = new Date().toISOString().slice(0, 10);

        const { data, error } = await this.supabase
            .from('daily_moods')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

        if (error || !data) return null;

        return {
            id: data.id,
            date: data.date,
            score: data.score as import('@/types').EmotionalFrequency,
            dominantEmotion: data.dominant_emotion,
            notes: data.notes,
            causes: data.causes,
            createdAt: data.created_at,
        };
    }

    // ===== ACCUSERS =====

    async createAccuser(
        name: string,
        linkedDesireId: number,
        totalDays: number = 92
    ): Promise<import('@/types').Accuser> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const { data, error } = await this.supabase
            .from('accusers')
            .insert({
                user_id: user.id,
                name,
                linked_desire_id: linkedDesireId,
                total_days: totalDays,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            linkedDesireId: data.linked_desire_id,
            totalDays: data.total_days,
            progress: new Array(totalDays).fill(false),
            createdAt: data.created_at,
            startDayIndex: (() => {
                try {
                    const base = new Date(2025, 9, 1);
                    base.setHours(0, 0, 0, 0);
                    const created = new Date(data.created_at);
                    created.setHours(0, 0, 0, 0);
                    return Math.max(0, Math.floor((created.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)));
                } catch {
                    return 0;
                }
            })(),
        };
    }

    async getAccusers(desireId?: number): Promise<import('@/types').Accuser[]> {
        const user = await this.getCurrentUser();
        if (!user) return [];

        let query = this.supabase
            .from('accusers')
            .select('*')
            .eq('user_id', user.id);

        if (desireId !== undefined) {
            query = query.eq('linked_desire_id', desireId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        const result: import('@/types').Accuser[] = [];

        for (const accuser of (data || [])) {
            // Récupérer la progression
            const { data: progressData } = await this.supabase
                .from('accuser_progress')
                .select('day_index, occurred')
                .eq('accuser_id', accuser.id)
                .order('day_index');

            const progress = new Array(accuser.total_days).fill(false);
            progressData?.forEach((p: any) => {
                if (p.day_index < progress.length) {
                    progress[p.day_index] = p.occurred;
                }
            });

            result.push({
                id: accuser.id,
                name: accuser.name,
                linkedDesireId: accuser.linked_desire_id,
                totalDays: accuser.total_days,
                progress,
                createdAt: accuser.created_at,
                startDayIndex: (() => {
                    try {
                        const base = new Date(2025, 9, 1);
                        base.setHours(0, 0, 0, 0);
                        const created = new Date(accuser.created_at);
                        created.setHours(0, 0, 0, 0);
                        return Math.max(0, Math.floor((created.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)));
                    } catch {
                        return 0;
                    }
                })(),
            });
        }

        return result;
    }

    async toggleAccuserDay(accuserId: number, dayIndex: number): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const { data: current } = await this.supabase
            .from('accuser_progress')
            .select('occurred')
            .eq('accuser_id', accuserId)
            .eq('day_index', dayIndex)
            .maybeSingle();

        const newOccurred = !current?.occurred;

        const { error } = await this.supabase
            .from('accuser_progress')
            .upsert(
                {
                    accuser_id: accuserId,
                    day_index: dayIndex,
                    occurred: newOccurred,
                    occurred_at: newOccurred ? new Date().toISOString() : null,
                },
                { onConflict: 'accuser_id,day_index' }
            );

        return !error;
    }

    async deleteAccuser(id: number): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('Utilisateur non authentifié');

        const { error } = await this.supabase
            .from('accusers')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        return !error;
    }
  }

export default SupabaseDatabaseClient;
