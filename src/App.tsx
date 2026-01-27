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
            {/* Notifications intelligentes: heure préférée + heure optimale */}
            <SmartNudges />
        </div>
    );
}

export default App;

// Notifications navigateur (si activées dans les réglages)
const SmartNudges: React.FC = () => {
    useEffect(() => {
        const BROWSER_ENABLED_KEY = 'vibes-arc-browser-notifs-enabled';
        const LAST_SENT_KEY = 'vibes-arc-browser-notifs-last-sent';

        const schedule = () => {
            const enabled = localStorage.getItem(BROWSER_ENABLED_KEY) === 'true';
            if (!enabled) return null;

            const now = new Date();
            const { userPrefs } = useAppStore.getState();
            const preferredHour = userPrefs?.notifHour ?? 20;

            const target = new Date();
            target.setHours(preferredHour, 0, 0, 0);
            let delay = target.getTime() - now.getTime();
            if (delay < 0) delay += 24 * 60 * 60 * 1000; // demain

            const t = window.setTimeout(() => {
                try {
                    // Eviter les doublons le même jour (ex: re-render)
                    const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
                    if (localStorage.getItem(LAST_SENT_KEY) === stamp) return;

                    if (!('Notification' in window)) return;
                    if (Notification.permission !== 'granted') return;

                    const state = useAppStore.getState();
                    const todayIdx = getCurrentDayIndex();
                    const activeToday = (state.habits || []).filter((h) => isHabitActiveOnDay(h, todayIdx));
                    const remaining = activeToday.filter((h) => !h.progress[todayIdx]);

                    const completed = activeToday.length - remaining.length;
                    const todayPct = activeToday.length > 0 ? Math.round((completed / activeToday.length) * 100) : 0;

                    // Trend 7 jours (moyenne des % quotidiens)
                    const dayPct = (idx: number): number | null => {
                        const active = (state.habits || []).filter((h) => idx >= getHabitStartDayIndex(h) && idx >= 0 && idx < h.progress.length);
                        if (active.length === 0) return null;
                        const done = active.filter((h) => !!h.progress[idx]).length;
                        return Math.round((done / active.length) * 100);
                    };
                    const avgPct = (start: number, end: number) => {
                        let sum = 0;
                        let count = 0;
                        for (let i = start; i <= end; i++) {
                            const p = dayPct(i);
                            if (p !== null) {
                                sum += p;
                                count += 1;
                            }
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
                        ? `Vibes Arc — ${remaining.length} habitude${remaining.length > 1 ? 's' : ''} restante${remaining.length > 1 ? 's' : ''}`
                        : 'Vibes Arc — Journée complète';

                    const names = remaining.slice(0, 3).map((h) => h.name);
                    const more = remaining.length - names.length;
                    const list = remaining.length > 0
                        ? `Restantes: ${names.join(', ')}${more > 0 ? ` (+${more})` : ''}`
                        : 'Tout est coché pour aujourd’hui.';

                    const body = `${completed}/${activeToday.length} (${todayPct}%) • Trend 7j: ${last7}% (${delta >= 0 ? '+' : ''}${delta}%)\n${list}`;

                    new Notification(title, { body });
                    localStorage.setItem(LAST_SENT_KEY, stamp);
                } finally {
                    schedule(); // reprogrammer
                }
            }, delay);

            return t;
        };

        const timer = schedule();
        return () => {
            if (timer) window.clearTimeout(timer);
        };
    }, []);

    return null;
};
