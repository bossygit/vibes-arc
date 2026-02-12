import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Download, X, Share } from 'lucide-react';

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
            console.error('Erreur lors de la verification de l\'authentification:', error);
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
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {renderView()}
            </main>
            {/* Notifications navigateur : 3 rappels/jour (7h30, 12h00, 18h30) */}
            <SmartNudges />
            {/* Bandeau d'installation PWA */}
            <InstallBanner />
        </div>
    );
}

export default App;

// ─── Creneaux de notification navigateur (toutes les heures de 6h a 22h) ─────

const NOTIFICATION_SLOTS = Array.from({ length: 17 }, (_, i) => {
    const hour = 6 + i; // 6, 7, 8 … 22
    return { id: `h${hour}`, hour, minute: 0, label: `${hour}h00` };
});

const BROWSER_ENABLED_KEY = 'vibes-arc-browser-notifs-enabled';

/**
 * Envoie une notification via le Service Worker (mobile-friendly)
 * avec fallback sur new Notification() pour le desktop.
 */
async function sendNotification(title: string, body: string, slotId?: string) {
    const tag = slotId ? `vibes-arc-reminder-${slotId}` : 'vibes-arc-reminder';

    // Tenter via le Service Worker (fonctionne sur mobile + arriere-plan)
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.ready;
            if (reg) {
                await reg.showNotification(title, {
                    body,
                    icon: '/vite.svg',
                    badge: '/vite.svg',
                    tag,
                } as NotificationOptions);
                return;
            }
        } catch (e) {
            console.warn('showNotification via SW echoue, fallback:', e);
        }
    }

    // Fallback desktop : new Notification()
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, tag });
    }
}

/** Construit le contenu de la notification et l'envoie */
async function buildAndSendNotification(slotLabel: string, slotId?: string) {
    // Verifier que la permission est accordee
    if ('Notification' in window && Notification.permission !== 'granted') return;

    const state = useAppStore.getState();
    const todayIdx = getCurrentDayIndex();
    const activeToday = (state.habits || []).filter((h) => isHabitActiveOnDay(h, todayIdx));
    const remaining = activeToday.filter((h) => !h.progress[todayIdx]);

    // Pas de notification si aucune habitude active
    if (activeToday.length === 0) return;

    const completed = activeToday.length - remaining.length;
    const todayPct = activeToday.length > 0 ? Math.round((completed / activeToday.length) * 100) : 0;

    // Trend 7 jours
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
        : `Vibes Arc (${slotLabel}) — Journee complete !`;

    const names = remaining.slice(0, 3).map((h) => h.name);
    const more = remaining.length - names.length;
    const list = remaining.length > 0
        ? `Restantes: ${names.join(', ')}${more > 0 ? ` (+${more})` : ''}`
        : 'Tout est coche pour aujourd\'hui.';

    const body = `${completed}/${activeToday.length} (${todayPct}%) | Trend 7j: ${last7}% (${delta >= 0 ? '+' : ''}${delta}%)\n${list}`;

    await sendNotification(title, body, slotId);
}

/**
 * Composant invisible : polling toutes les 60s pour verifier si un creneau
 * de notification est arrive. Beaucoup plus resilient sur mobile que setTimeout
 * avec de longs delais (qui sont tues par le navigateur).
 */
const SmartNudges: React.FC = () => {
    useEffect(() => {
        // Enregistrer le service worker au demarrage et forcer la mise a jour
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then((reg) => {
                // Forcer la verification d'une nouvelle version du SW
                reg.update().catch(() => {});
            }).catch((e) =>
                console.warn('SW registration failed:', e)
            );
        }

        const SLOT_WINDOW_MINUTES = 5; // fenetre de 5 min pour chaque creneau

        const check = () => {
            const enabled = localStorage.getItem(BROWSER_ENABLED_KEY) === 'true';
            if (!enabled) return;

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const stamp = now.toISOString().slice(0, 10); // YYYY-MM-DD

            for (const slot of NOTIFICATION_SLOTS) {
                const slotMinutes = slot.hour * 60 + slot.minute;
                // Verifier si on est dans la fenetre du creneau
                if (currentMinutes >= slotMinutes && currentMinutes < slotMinutes + SLOT_WINDOW_MINUTES) {
                    const dedupKey = `vibes-arc-notif-sent-${slot.id}`;
                    // Dedup : un seul envoi par creneau par jour
                    if (localStorage.getItem(dedupKey) === stamp) continue;

                    buildAndSendNotification(slot.label, slot.id);
                    localStorage.setItem(dedupKey, stamp);
                }
            }
        };

        // Verifier immediatement puis toutes les 60 secondes
        check();
        const interval = window.setInterval(check, 60_000);

        return () => {
            window.clearInterval(interval);
        };
    }, []);

    return null;
};

// ─── Bandeau d'installation PWA ───────────────────────────────────────────────

const INSTALL_DISMISSED_KEY = 'vibes-arc-install-dismissed';

function isStandalone(): boolean {
    // Detecte si l'app est deja installee (lancee depuis l'ecran d'accueil)
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if ((navigator as any).standalone === true) return true; // iOS Safari
    return false;
}

function isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

const InstallBanner: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);
    const promptRef = useRef<any>(null);

    useEffect(() => {
        // Ne pas afficher si deja installe ou deja dismiss
        if (isStandalone()) return;
        if (localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true') return;

        // Android/Chrome : ecouter l'evenement beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault();
            promptRef.current = e;
            setDeferredPrompt(e);
            setShowBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS : afficher le guide manuellement apres un delai
        if (isIOS()) {
            const t = window.setTimeout(() => {
                if (!isStandalone()) {
                    setShowBanner(true);
                    setShowIOSGuide(true);
                }
            }, 3000);
            return () => {
                window.removeEventListener('beforeinstallprompt', handler);
                window.clearTimeout(t);
            };
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = useCallback(async () => {
        if (promptRef.current) {
            promptRef.current.prompt();
            const result = await promptRef.current.userChoice;
            if (result.outcome === 'accepted') {
                setShowBanner(false);
            }
            promptRef.current = null;
            setDeferredPrompt(null);
        }
    }, []);

    const handleDismiss = useCallback(() => {
        setShowBanner(false);
        localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    }, []);

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4">
            <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg border border-indigo-200 p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                        <Download className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm">Installer Vibes Arc</h3>
                        {showIOSGuide ? (
                            <p className="text-xs text-slate-600 mt-1">
                                Pour recevoir les notifications et un acces rapide :
                                appuie sur <Share className="w-3.5 h-3.5 inline text-indigo-600" /> en bas du navigateur,
                                puis <strong>Sur l'ecran d'accueil</strong>.
                            </p>
                        ) : (
                            <p className="text-xs text-slate-600 mt-1">
                                Installe l'app pour recevoir les notifications sur mobile et un acces rapide depuis ton ecran d'accueil.
                            </p>
                        )}
                        {deferredPrompt && (
                            <button
                                onClick={handleInstall}
                                className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition"
                            >
                                Installer
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-1 rounded hover:bg-slate-100 flex-shrink-0"
                        aria-label="Fermer"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </div>
        </div>
    );
};
