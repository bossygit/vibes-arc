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

// Composant simple pour nudges (localStorage + Notification API si dispo)
const SmartNudges: React.FC = () => {
    useEffect(() => {
        const schedule = async () => {
            const now = new Date();
            // Récupérer heure préférée et heure optimale (best-effort)
            let preferredHour = 20;
            try {
                const supabase = SupabaseDatabaseClient.getInstance();
                const prefs = await supabase.getUserPrefs();
                preferredHour = prefs.notifHour ?? 20;
                // Optionnel: calculer une heure optimale et prendre la moyenne arrondie
                const optimal = await supabase.computeOptimalNotifHour();
                preferredHour = Math.round((preferredHour + optimal) / 2);
            } catch { }

            const target = new Date();
            target.setHours(preferredHour, 0, 0, 0);
            let delay = target.getTime() - now.getTime();
            if (delay < 0) delay += 24 * 60 * 60 * 1000; // demain 20h

            const t = setTimeout(async () => {
                try {
                    // Demande de permission
                    if ('Notification' in window && Notification.permission !== 'granted') {
                        await Notification.requestPermission();
                    }
                    // Envoi
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('Petit rappel Vibes Arc', { body: 'Un pas aujourd\'hui renforce ton identité 💪' });
                    }
                } finally {
                    schedule(); // reprogrammer pour le lendemain
                }
            }, delay);
            return t;
        };

        const timer = schedule();
        return () => clearTimeout(timer as any);
    }, []);

    return null;
};
