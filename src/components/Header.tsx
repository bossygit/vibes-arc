import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import SupabaseDatabaseClient from '@/database/supabase-client';
import { Trophy, User, ChevronDown } from 'lucide-react';

const Header: React.FC = () => {
    const { view, setView, gamification } = useAppStore();

    const navItems = [
        { key: 'dashboard', label: 'Tableau de bord' },
        { key: 'identities', label: 'Identités' },
        { key: 'addHabit', label: 'Ajouter Habitude' },
        { key: 'templates', label: 'Templates' },
        { key: 'magicGratitude', label: 'Magic Gratitude' },
        { key: 'rewards', label: 'Récompenses' },
    ] as const;

    const [open, setOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const supabase = SupabaseDatabaseClient.getInstance();
                const user = await supabase.getCurrentUser();
                setUserEmail(user?.email ?? null);
            } catch {
                setUserEmail(null);
            }
        })();
    }, []);

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
                    <div className="flex items-center gap-3">
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

                        {/* User menu */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setOpen((v) => !v)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                                aria-haspopup="menu"
                                aria-expanded={open}
                            >
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                    <User className="w-4 h-4" />
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                            </button>
                            {open && (
                                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-20">
                                    <div className="px-3 py-2 text-sm text-slate-500">Mon compte</div>
                                    {userEmail && (
                                        <div className="px-3 pb-2 text-xs text-slate-500 break-all">{userEmail}</div>
                                    )}
                                    <div className="px-3 py-2 flex items-center gap-2 rounded hover:bg-slate-50">
                                        <div className="px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 font-semibold flex items-center gap-2">
                                            <Trophy className="w-4 h-4" />
                                            <span>{gamification.points} pts</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const supabase = SupabaseDatabaseClient.getInstance();
                                                await supabase.signOut();
                                            } finally {
                                                window.location.reload();
                                            }
                                        }}
                                        className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 text-slate-700"
                                    >
                                        Se déconnecter
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
