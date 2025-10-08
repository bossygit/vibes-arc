import React from 'react';
import { useAppStore } from '@/store/useAppStore';

const Header: React.FC = () => {
    const { view, setView } = useAppStore();

    const navItems = [
        { key: 'dashboard', label: 'Tableau de bord' },
        { key: 'identities', label: 'Identités' },
        { key: 'addHabit', label: 'Ajouter Habitude' },
    ] as const;

    return (
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gradient">
                            Vibes Arc
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">Deviens qui tu veux être</p>
                    </div>
                    <nav className="flex gap-2">
                        {navItems.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => setView(item.key)}
                                className={`px-4 py-2 rounded-lg font-medium transition ${view === item.key
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-600 hover:bg-white'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
