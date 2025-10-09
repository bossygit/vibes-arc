import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import Dashboard from '@/components/Dashboard';
import IdentitiesView from '@/components/IdentitiesView';
import AddHabitView from '@/components/AddHabitView';
import HabitDetailView from '@/components/HabitDetailView';
import Header from '@/components/Header';
import Auth from '@/components/Auth';
import SupabaseDatabaseClient from '@/database/supabase-client';

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
        </div>
    );
}

export default App;
