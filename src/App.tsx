import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import Dashboard from '@/components/Dashboard';
import IdentitiesView from '@/components/IdentitiesView';
import AddHabitView from '@/components/AddHabitView';
import HabitDetailView from '@/components/HabitDetailView';
import Header from '@/components/Header';
import Auth from '@/components/Auth';
import SupabaseDatabaseClient from '@/database/supabase-client';

import RewardsChallenges from '@/components/RewardsChallenges';
import TemplatesView from '@/components/TemplatesView';
import MagicGratitudeChallenge from '@/components/MagicGratitudeChallenge';
import MoneyMindsetGame from '@/components/MoneyMindsetGame';
import FocusWheelGame from '@/components/FocusWheelGame';
import PrimingView from '@/components/PrimingView';
import EnvironmentDesignView from '@/components/EnvironmentDesignView';
import { getCurrentDayIndex, isHabitActiveOnDay, getHabitStartDayIndex } from '@/utils/habitUtils';

function App() {
    const { view } = useAppStore();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const supabase = SupabaseDatabaseClient.getInstance();
            const user = await supabase.getCurrentUser();
            setIsAuthenticated(!!user);
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
    };

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard />;
            case 'identities':
                return <IdentitiesView />;
            case 'addHabit':
                return <AddHabitView />;
            case 'habitDetail':
                return <HabitDetailView />;
            case 'rewards':
                return <RewardsChallenges />;
            case 'templates':
                return <TemplatesView />;
            case 'magicGratitude':
                return <MagicGratitudeChallenge />;
            case 'moneyMindset':
                return <MoneyMindsetGame />;
            case 'focusWheel':
                return <FocusWheelGame />;
            case 'priming':
                return <PrimingView />;
            case 'environment':
                return <EnvironmentDesignView />;
            default:
                return <Dashboard />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Auth onAuthSuccess={handleAuthSuccess} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Header />
            <main className="max-w-6xl mx-auto px-6 py-8">
                {renderView()}
            </main>
            {/* Notifications navigateur : 3 rappels/jour (7h30, 12h00, 18h30) */}
            <SmartNudges />
        </div>
    );
}

export default App;

// ─── Créneaux de notification navigateur ──────────────────────────────────────

const NOTIFICATION_SLOTS = [
    { id: 'morning', hour: 7, minute: 30, label: 'Matin' },
    { id: 'noon', hour: 12, minute: 0, label: 'Midi' },
    { id: 'evening', hour: 18, minute: 30, label: 'Soir' },
] as const;

const BROWSER_ENABLED_KEY = 'vibes-arc-browser-notifs-enabled';

/** Construit et envoie une notification navigateur avec les habitudes restantes */
function buildAndSendNotification(slotLabel: string) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const state = useAppStore.getState();
    const todayIdx = getCurrentDayIndex();
    const activeToday = (state.habits || []).filter((h) => isHabitActiveOnDay(h, todayIdx));
    const remaining = activeToday.filter((h) => !h.progress[todayIdx]);

    // Pas de notification si aucune habitude active
    if (activeToday.length === 0) return;

    const completed = activeToday.length - remaining.length;
    const todayPct = activeToday.length > 0 ? Math.round((completed / activeToday.length) * 100) : 0;

    // Trend 7 jours (moyenne des % quotidiens)
    const dayPct = (idx: number): number | null => {
        const active = (state.habits || []).filter(
            (h) => idx >= getHabitStartDayIndex(h) && idx >= 0 && idx < h.progress.length
        );
        if (active.length === 0) return null;
        const done = active.filter((h) => !!h.progress[idx]).length;
        return Math.round((done / active.length) * 100);
    };
    const avgPct = (s: number, e: number) => {
        let sum = 0;
        let count = 0;
        for (let i = s; i <= e; i++) {
            const p = dayPct(i);
            if (p !== null) { sum += p; count += 1; }
        }
        return count > 0 ? Math.round(sum / count) : 0;
    };
    const end = todayIdx;
    const start = Math.max(0, end - 6);
    const prevEnd = start - 1;
    const prevStart = Math.max(0, prevEnd - 6);
    const last7 = avgPct(start, end);
    const prev7 = avgPct(prevStart, prevEnd);
    const delta = last7 - prev7;

    const title = remaining.length > 0
        ? `Vibes Arc (${slotLabel}) — ${remaining.length} habitude${remaining.length > 1 ? 's' : ''} restante${remaining.length > 1 ? 's' : ''}`
        : `Vibes Arc (${slotLabel}) — Journée complète !`;

    const names = remaining.slice(0, 3).map((h) => h.name);
    const more = remaining.length - names.length;
    const list = remaining.length > 0
        ? `Restantes: ${names.join(', ')}${more > 0 ? ` (+${more})` : ''}`
        : 'Tout est coché pour aujourd\'hui.';

    const body = `${completed}/${activeToday.length} (${todayPct}%) • Trend 7j: ${last7}% (${delta >= 0 ? '+' : ''}${delta}%)\n${list}`;

    new Notification(title, { body });
}

/** Composant invisible qui programme 3 notifications navigateur par jour */
const SmartNudges: React.FC = () => {
    useEffect(() => {
        const timers: number[] = [];

        const scheduleSlot = (slot: typeof NOTIFICATION_SLOTS[number]) => {
            const dedupKey = `vibes-arc-notif-sent-${slot.id}`;

            const run = () => {
                const enabled = localStorage.getItem(BROWSER_ENABLED_KEY) === 'true';
                if (!enabled) {
                    // Réessayer dans 60 s au cas où l'utilisateur active entre-temps
                    const t = window.setTimeout(run, 60_000);
                    timers.push(t);
                    return;
                }

                const now = new Date();
                const target = new Date();
                target.setHours(slot.hour, slot.minute, 0, 0);

                let delay = target.getTime() - now.getTime();
                if (delay < 0) {
                    // L'heure est déjà passée aujourd'hui → programmer pour demain
                    delay += 24 * 60 * 60 * 1000;
                }

                const t = window.setTimeout(() => {
                    try {
                        const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
                        // Dedup : un seul envoi par créneau par jour
                        if (localStorage.getItem(dedupKey) === stamp) return;

                        buildAndSendNotification(slot.label);
                        localStorage.setItem(dedupKey, stamp);
                    } finally {
                        // Reprogrammer pour le prochain passage
                        run();
                    }
                }, delay);

                timers.push(t);
            };

            run();
        };

        // Programmer les 3 créneaux indépendamment
        NOTIFICATION_SLOTS.forEach(scheduleSlot);

        return () => {
            timers.forEach((t) => window.clearTimeout(t));
        };
    }, []);

    return null;
};
